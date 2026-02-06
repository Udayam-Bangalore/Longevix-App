import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meal } from './entities/meal.entity';
import { NutritionAggregationService } from './nutrition-aggregation.service';

@Injectable()
export class NutritionSchedulerService {
  private readonly logger = new Logger(NutritionSchedulerService.name);

  constructor(
    private readonly nutritionAggregationService: NutritionAggregationService,
    @InjectRepository(Meal)
    private mealRepository: Repository<Meal>,
  ) {}

  @Cron('0 2 * * *')
  async aggregateDailyStats(): Promise<void> {
    this.logger.log(
      'Starting daily nutrition statistics aggregation for all users...',
    );

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Get all unique users who logged meals yesterday
      const userIds = await this.mealRepository
        .createQueryBuilder('meal')
        .select('DISTINCT meal.userId', 'userId')
        .where('meal.date >= :startDate', { startDate: yesterday })
        .andWhere('meal.date < :endDate', {
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        })
        .getRawMany();

      for (const { userId } of userIds) {
        try {
          await this.nutritionAggregationService.aggregateDailyStats(
            userId,
            yesterday,
          );
          this.logger.log(`Aggregated daily stats for user ${userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to aggregate daily stats for user ${userId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Daily nutrition statistics aggregation completed for ${userIds.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to aggregate daily nutrition statistics: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron('0 3 * * 0')
  async aggregateWeeklyStats(): Promise<void> {
    this.logger.log(
      'Starting weekly nutrition statistics aggregation for all users...',
    );

    try {
      const lastSunday = new Date();
      lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay() - 7);
      lastSunday.setHours(0, 0, 0, 0);

      // Get all unique users who have data in the past week
      const weekStart = new Date(lastSunday);
      const weekEnd = new Date(lastSunday);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const userIds = await this.mealRepository
        .createQueryBuilder('meal')
        .select('DISTINCT meal.userId', 'userId')
        .where('meal.date >= :weekStart', { weekStart })
        .andWhere('meal.date < :weekEnd', { weekEnd })
        .getRawMany();

      for (const { userId } of userIds) {
        try {
          await this.nutritionAggregationService.aggregateWeeklyStats(
            userId,
            lastSunday,
          );
          this.logger.log(`Aggregated weekly stats for user ${userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to aggregate weekly stats for user ${userId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Weekly nutrition statistics aggregation completed for ${userIds.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to aggregate weekly nutrition statistics: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron('0 4 1 * *')
  async aggregateMonthlyStats(): Promise<void> {
    this.logger.log(
      'Starting monthly nutrition statistics aggregation for all users...',
    );

    try {
      const firstDayOfLastMonth = new Date();
      firstDayOfLastMonth.setMonth(firstDayOfLastMonth.getMonth() - 1);
      const year = firstDayOfLastMonth.getFullYear();
      const month = firstDayOfLastMonth.getMonth() + 1;

      // Get all unique users who have data in the last month
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const userIds = await this.mealRepository
        .createQueryBuilder('meal')
        .select('DISTINCT meal.userId', 'userId')
        .where('meal.date >= :monthStart', { monthStart })
        .andWhere('meal.date <= :monthEnd', { monthEnd })
        .getRawMany();

      for (const { userId } of userIds) {
        try {
          await this.nutritionAggregationService.aggregateMonthlyStats(
            userId,
            year,
            month,
          );
          this.logger.log(`Aggregated monthly stats for user ${userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to aggregate monthly stats for user ${userId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Monthly nutrition statistics aggregation completed for ${userIds.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to aggregate monthly nutrition statistics: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron('0 5 * * *')
  async cleanupOldData(): Promise<void> {
    this.logger.log('Starting cleanup of old nutrition statistics data...');

    try {
      await this.nutritionAggregationService.cleanupOldData();
      this.logger.log(
        'Cleanup of old nutrition statistics data completed successfully',
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old nutrition statistics data: ${error.message}`,
        error.stack,
      );
    }
  }
}
