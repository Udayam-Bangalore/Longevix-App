import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Meal } from './entities/meal.entity';
import { NutritionDailyStats } from './entities/nutrition-daily-stats.entity';
import { NutritionMonthlyStats } from './entities/nutrition-monthly-stats.entity';
import { NutritionWeeklyStats } from './entities/nutrition-weekly-stats.entity';

@Injectable()
export class NutritionAggregationService {
  private readonly logger = new Logger(NutritionAggregationService.name);

  constructor(
    @InjectRepository(Meal)
    private mealRepository: Repository<Meal>,
    @InjectRepository(NutritionDailyStats)
    private dailyStatsRepository: Repository<NutritionDailyStats>,
    @InjectRepository(NutritionWeeklyStats)
    private weeklyStatsRepository: Repository<NutritionWeeklyStats>,
    @InjectRepository(NutritionMonthlyStats)
    private monthlyStatsRepository: Repository<NutritionMonthlyStats>,
  ) {}

  /**
   * Aggregate daily nutrition statistics for a specific user and date
   */
  async aggregateDailyStats(
    userId: string,
    date: Date,
  ): Promise<NutritionDailyStats> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    // Get all meals for the day
    const meals = await this.mealRepository
      .createQueryBuilder('meal')
      .where('meal.userId = :userId', { userId })
      .andWhere('meal.date >= :startDate', { startDate })
      .andWhere('meal.date < :endDate', { endDate })
      .getMany();

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const totalMicronutrients: Record<string, number> = {};
    let breakfastCalories = 0;
    let lunchCalories = 0;
    let dinnerCalories = 0;
    let snackCalories = 0;

    meals.forEach((meal) => {
      const mealName = meal.name.toLowerCase();
      const mealCalories = Number(meal.calories);

      totalCalories += mealCalories;

      // Aggregate micronutrients
      if (meal.micronutrients) {
        Object.entries(meal.micronutrients).forEach(([key, value]) => {
          totalMicronutrients[key] =
            (totalMicronutrients[key] || 0) + Number(value);
        });
      }

      // Aggregate macros from food items
      if (meal.items && meal.items.length > 0) {
        meal.items.forEach((item) => {
          totalProtein += Number(item.protein || 0);
          totalCarbs += Number(item.carbohydrates || 0);
          totalFat += Number(item.fat || 0);
        });
      }

      // Categorize by meal type
      if (mealName.includes('breakfast')) {
        breakfastCalories += mealCalories;
      } else if (mealName.includes('lunch')) {
        lunchCalories += mealCalories;
      } else if (mealName.includes('dinner')) {
        dinnerCalories += mealCalories;
      } else {
        snackCalories += mealCalories;
      }
    });

    // Find or create daily stats
    let dailyStats = await this.dailyStatsRepository.findOne({
      where: { userId, date: startDate },
    });

    if (!dailyStats) {
      dailyStats = this.dailyStatsRepository.create({
        userId,
        date: startDate,
      });
    }

    // Update stats
    dailyStats.calories = totalCalories;
    dailyStats.protein = totalProtein;
    dailyStats.carbohydrates = totalCarbs;
    dailyStats.fat = totalFat;
    dailyStats.micronutrients = totalMicronutrients;
    dailyStats.breakfastCalories = breakfastCalories;
    dailyStats.lunchCalories = lunchCalories;
    dailyStats.dinnerCalories = dinnerCalories;
    dailyStats.snackCalories = snackCalories;
    dailyStats.totalMeals = meals.length;

    return this.dailyStatsRepository.save(dailyStats);
  }

  /**
   * Aggregate weekly nutrition statistics
   */
  async aggregateWeeklyStats(
    userId: string,
    weekStart: Date,
  ): Promise<NutritionWeeklyStats | null> {
    const startDate = new Date(weekStart);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Get daily stats for the week
    const dailyStats = await this.dailyStatsRepository
      .createQueryBuilder('stats')
      .where('stats.userId = :userId', { userId })
      .andWhere('stats.date >= :startDate', { startDate })
      .andWhere('stats.date < :endDate', { endDate })
      .orderBy('stats.date', 'ASC')
      .getMany();

    if (dailyStats.length === 0) {
      this.logger.log(
        `No daily stats found for user ${userId} week starting ${startDate.toISOString()}`,
      );
      return null;
    }

    // Calculate totals and averages
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const totalMicronutrients: Record<string, number> = {};
    let daysTracked = 0;
    let goalStreakDays = 0;
    let totalBreakfastCalories = 0;
    let totalLunchCalories = 0;
    let totalDinnerCalories = 0;
    let totalSnackCalories = 0;

    dailyStats.forEach((day) => {
      if (day.calories > 0) {
        daysTracked++;
        totalCalories += Number(day.calories);
        totalProtein += Number(day.protein);
        totalCarbs += Number(day.carbohydrates);
        totalFat += Number(day.fat);
        totalBreakfastCalories += day.breakfastCalories;
        totalLunchCalories += day.lunchCalories;
        totalDinnerCalories += day.dinnerCalories;
        totalSnackCalories += day.snackCalories;

        // Aggregate micronutrients
        if (day.micronutrients) {
          Object.entries(day.micronutrients).forEach(([key, value]) => {
            totalMicronutrients[key] =
              (totalMicronutrients[key] || 0) + Number(value);
          });
        }

        // TODO: Add logic for goal streak based on user's calorie target
        // For now, assume any day with data is a streak day
        goalStreakDays++;
      }
    });

    // Calculate averages
    const avgCalories = daysTracked > 0 ? totalCalories / daysTracked : 0;
    const avgProtein = daysTracked > 0 ? totalProtein / daysTracked : 0;
    const avgCarbs = daysTracked > 0 ? totalCarbs / daysTracked : 0;
    const avgFat = daysTracked > 0 ? totalFat / daysTracked : 0;

    // Get week number and year
    const weekEnd = new Date(endDate);
    weekEnd.setDate(weekEnd.getDate() - 1);
    const { weekNumber, year } = this.getWeekNumber(startDate);

    // Find or create weekly stats
    let weeklyStats = await this.weeklyStatsRepository.findOne({
      where: { userId, weekStart: startDate, weekEnd },
    });

    if (!weeklyStats) {
      weeklyStats = this.weeklyStatsRepository.create({
        userId,
        weekStart: startDate,
        weekEnd,
        weekNumber,
        year,
      });
    }

    // Update stats
    weeklyStats.avgCalories = avgCalories;
    weeklyStats.avgProtein = avgProtein;
    weeklyStats.avgCarbohydrates = avgCarbs;
    weeklyStats.avgFat = avgFat;
    weeklyStats.totalCalories = totalCalories;
    weeklyStats.totalProtein = totalProtein;
    weeklyStats.totalCarbohydrates = totalCarbs;
    weeklyStats.totalFat = totalFat;
    weeklyStats.totalMicronutrients = totalMicronutrients;
    weeklyStats.daysTracked = daysTracked;
    weeklyStats.goalStreakDays = goalStreakDays;
    weeklyStats.totalBreakfastCalories = totalBreakfastCalories;
    weeklyStats.totalLunchCalories = totalLunchCalories;
    weeklyStats.totalDinnerCalories = totalDinnerCalories;
    weeklyStats.totalSnackCalories = totalSnackCalories;

    return this.weeklyStatsRepository.save(weeklyStats);
  }

  /**
   * Aggregate monthly nutrition statistics
   */
  async aggregateMonthlyStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<NutritionMonthlyStats | null> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0); // Last day of the month
    monthEnd.setHours(23, 59, 59, 999);

    const totalDaysInMonth = monthEnd.getDate();

    // Get daily stats for the month
    const dailyStats = await this.dailyStatsRepository
      .createQueryBuilder('stats')
      .where('stats.userId = :userId', { userId })
      .andWhere('stats.date >= :monthStart', { monthStart })
      .andWhere('stats.date <= :monthEnd', { monthEnd })
      .orderBy('stats.date', 'ASC')
      .getMany();

    if (dailyStats.length === 0) {
      this.logger.log(
        `No daily stats found for user ${userId} ${month}/${year}`,
      );
      return null;
    }

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const totalMicronutrients: Record<string, number> = {};
    let daysTracked = 0;
    let goalStreakDays = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let totalBreakfastCalories = 0;
    let totalLunchCalories = 0;
    let totalDinnerCalories = 0;
    let totalSnackCalories = 0;

    // Weekly breakdown
    const weeklyBreakdown: Array<{
      weekNumber: number;
      weekStart: string;
      weekEnd: string;
      totalCalories: number;
      avgCalories: number;
    }> = [];
    let currentWeek: any = null;

    dailyStats.forEach((day) => {
      if (day.calories > 0) {
        daysTracked++;
        totalCalories += Number(day.calories);
        totalProtein += Number(day.protein);
        totalCarbs += Number(day.carbohydrates);
        totalFat += Number(day.fat);
        totalBreakfastCalories += day.breakfastCalories;
        totalLunchCalories += day.lunchCalories;
        totalDinnerCalories += day.dinnerCalories;
        totalSnackCalories += day.snackCalories;

        // Aggregate micronutrients
        if (day.micronutrients) {
          Object.entries(day.micronutrients).forEach(([key, value]) => {
            totalMicronutrients[key] =
              (totalMicronutrients[key] || 0) + Number(value);
          });
        }

        // Streak calculation
        goalStreakDays++;
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);

        // Weekly breakdown
        const { weekNumber } = this.getWeekNumber(day.date);
        if (!currentWeek || currentWeek.weekNumber !== weekNumber) {
          if (currentWeek) {
            currentWeek.avgCalories = currentWeek.totalCalories / 7;
            weeklyBreakdown.push(currentWeek);
          }
          const weekStart = new Date(day.date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          currentWeek = {
            weekNumber,
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            totalCalories: day.calories,
            avgCalories: 0,
          };
        } else {
          currentWeek.totalCalories += day.calories;
        }
      } else {
        currentStreak = 0;
      }
    });

    // Add last week
    if (currentWeek) {
      const daysInWeek = dailyStats.filter((d) => {
        const { weekNumber } = this.getWeekNumber(d.date);
        return weekNumber === currentWeek.weekNumber && d.calories > 0;
      }).length;
      currentWeek.avgCalories = currentWeek.totalCalories / (daysInWeek || 1);
      weeklyBreakdown.push(currentWeek);
    }

    // Calculate averages
    const avgCalories = daysTracked > 0 ? totalCalories / daysTracked : 0;
    const avgProtein = daysTracked > 0 ? totalProtein / daysTracked : 0;
    const avgCarbs = daysTracked > 0 ? totalCarbs / daysTracked : 0;
    const avgFat = daysTracked > 0 ? totalFat / daysTracked : 0;
    const trackingPercentage = (daysTracked / totalDaysInMonth) * 100;

    // Find or create monthly stats
    let monthlyStats = await this.monthlyStatsRepository.findOne({
      where: { userId, month, year },
    });

    if (!monthlyStats) {
      monthlyStats = this.monthlyStatsRepository.create({
        userId,
        month,
        year,
        monthStart,
        monthEnd,
      });
    }

    // Update stats
    monthlyStats.avgCalories = avgCalories;
    monthlyStats.avgProtein = avgProtein;
    monthlyStats.avgCarbohydrates = avgCarbs;
    monthlyStats.avgFat = avgFat;
    monthlyStats.totalCalories = totalCalories;
    monthlyStats.totalProtein = totalProtein;
    monthlyStats.totalCarbohydrates = totalCarbs;
    monthlyStats.totalFat = totalFat;
    monthlyStats.totalMicronutrients = totalMicronutrients;
    monthlyStats.daysTracked = daysTracked;
    monthlyStats.totalDaysInMonth = totalDaysInMonth;
    monthlyStats.trackingPercentage = trackingPercentage;
    monthlyStats.goalStreakDays = goalStreakDays;
    monthlyStats.longestStreak = longestStreak;
    monthlyStats.totalBreakfastCalories = totalBreakfastCalories;
    monthlyStats.totalLunchCalories = totalLunchCalories;
    monthlyStats.totalDinnerCalories = totalDinnerCalories;
    monthlyStats.totalSnackCalories = totalSnackCalories;
    monthlyStats.weeklyBreakdown = weeklyBreakdown;

    return this.monthlyStatsRepository.save(monthlyStats);
  }

  /**
   * Run full aggregation for a user (past 90 days)
   */
  async aggregateAllForUser(userId: string): Promise<void> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 3 months back

    this.logger.log(
      `Starting full aggregation for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Aggregate daily stats
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      await this.aggregateDailyStats(userId, new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate weekly stats
    const currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(
      currentWeekStart.getDate() - currentWeekStart.getDay(),
    ); // Go to start of week
    while (currentWeekStart <= endDate) {
      await this.aggregateWeeklyStats(userId, new Date(currentWeekStart));
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // Aggregate monthly stats
    const currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      await this.aggregateMonthlyStats(
        userId,
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
      );
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    this.logger.log(`Completed full aggregation for user ${userId}`);
  }

  /**
   * Clean up old data (older than 3 months)
   */
  async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);

    this.logger.log(`Cleaning up data older than ${cutoffDate.toISOString()}`);

    // Delete old daily stats
    const deletedDaily = await this.dailyStatsRepository.delete({
      date: LessThan(cutoffDate),
    });
    this.logger.log(`Deleted ${deletedDaily.affected} old daily stats`);

    // Delete old weekly stats
    const deletedWeekly = await this.weeklyStatsRepository.delete({
      weekEnd: LessThan(cutoffDate),
    });
    this.logger.log(`Deleted ${deletedWeekly.affected} old weekly stats`);

    // Delete old monthly stats
    const cutoffMonthStart = new Date(
      cutoffDate.getFullYear(),
      cutoffDate.getMonth(),
      1,
    );
    const deletedMonthly = await this.monthlyStatsRepository.delete({
      monthEnd: LessThan(cutoffMonthStart),
    });
    this.logger.log(`Deleted ${deletedMonthly.affected} old monthly stats`);
  }

  /**
   * Get nutrition statistics for a date range
   */
  async getStatsForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<NutritionDailyStats[]> {
    return this.dailyStatsRepository
      .createQueryBuilder('stats')
      .where('stats.userId = :userId', { userId })
      .andWhere('stats.date >= :startDate', { startDate })
      .andWhere('stats.date <= :endDate', { endDate })
      .orderBy('stats.date', 'ASC')
      .getMany();
  }

  /**
   * Get weekly statistics for a date range
   */
  async getWeeklyStatsForRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<NutritionWeeklyStats[]> {
    return this.weeklyStatsRepository
      .createQueryBuilder('stats')
      .where('stats.userId = :userId', { userId })
      .andWhere('stats.weekStart >= :startDate', { startDate })
      .andWhere('stats.weekEnd <= :endDate', { endDate })
      .orderBy('stats.weekStart', 'ASC')
      .getMany();
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(
    userId: string,
    year?: number,
  ): Promise<NutritionMonthlyStats[]> {
    const query = this.monthlyStatsRepository
      .createQueryBuilder('stats')
      .where('stats.userId = :userId', { userId });

    if (year) {
      query.andWhere('stats.year = :year', { year });
    }

    return query
      .orderBy('stats.year', 'DESC')
      .addOrderBy('stats.month', 'DESC')
      .getMany();
  }

  /**
   * Helper method to get ISO week number
   */
  private getWeekNumber(date: Date): { weekNumber: number; year: number } {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return { weekNumber, year: d.getUTCFullYear() };
  }
}
