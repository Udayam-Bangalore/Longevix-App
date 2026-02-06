import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { FoodItem } from './entities/meal.entity';
import { MealsService } from './meals.service';
import { NutritionAggregationService } from './nutrition-aggregation.service';

@Controller('meals')
@UseGuards(AuthGuard)
export class MealsController {
  constructor(
    private readonly mealsService: MealsService,
    private readonly nutritionAggregationService: NutritionAggregationService,
  ) {}

  @Post()
  async createMeal(
    @Body() body: { mealName: string; foodItems: FoodItem[] },
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.mealsService.createMeal(userId, body.mealName, body.foodItems);
  }

  @Get('today')
  async getTodayMeals(@Req() req) {
    const userId = req.user.id;
    const today = new Date();
    return this.mealsService.getMealsByDate(userId, today);
  }

  @Get('range')
  async getMealsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req,
  ) {
    const userId = req.user.id;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.mealsService.getMealsByDateRange(userId, start, end);
  }

  @Get(':id')
  async getMealById(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.mealsService.getMealById(userId, id);
  }

  @Put(':id')
  async updateMeal(
    @Param('id') id: string,
    @Body() body: { mealName?: string; foodItems?: FoodItem[] },
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.mealsService.updateMeal(userId, id, body);
  }

  @Delete(':id')
  async deleteMeal(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    await this.mealsService.deleteMeal(userId, id);
    return { message: 'Meal deleted successfully' };
  }

  @Post(':mealId/foods')
  async addFoodToMeal(
    @Param('mealId') mealId: string,
    @Body() body: { foodItem: FoodItem },
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.mealsService.addFoodToMealById(userId, mealId, body.foodItem);
  }

  @Delete(':mealId/foods/:foodId')
  async removeFoodFromMeal(
    @Param('mealId') mealId: string,
    @Param('foodId') foodId: string,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.mealsService.removeFoodFromMeal(userId, mealId, foodId);
  }

  // ===== Nutrition Statistics Endpoints =====

  @Get('stats/daily')
  async getDailyStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req,
  ) {
    const userId = req.user.id;
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.nutritionAggregationService.getStatsForDateRange(
      userId,
      start,
      end,
    );
  }

  @Get('stats/weekly')
  async getWeeklyStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req,
  ) {
    const userId = req.user.id;
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.nutritionAggregationService.getWeeklyStatsForRange(
      userId,
      start,
      end,
    );
  }

  @Get('stats/monthly')
  async getMonthlyStats(@Query('year') year: string, @Req() req) {
    const userId = req.user.id;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.nutritionAggregationService.getMonthlyStats(userId, yearNum);
  }

  @Get('stats/summary')
  async getNutritionSummary(@Req() req) {
    const userId = req.user.id;

    // Get last 7 days daily stats
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const last7Days =
      await this.nutritionAggregationService.getStatsForDateRange(
        userId,
        startDate,
        endDate,
      );

    // Get last 4 weeks
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 28);
    const last4Weeks =
      await this.nutritionAggregationService.getWeeklyStatsForRange(
        userId,
        weekStart,
        weekEnd,
      );

    // Get last 3 months
    const monthlyStats = await this.nutritionAggregationService.getMonthlyStats(
      userId,
      new Date().getFullYear(),
    );

    return {
      last7Days,
      last4Weeks,
      last3Months: monthlyStats.slice(0, 3),
    };
  }

  @Post('stats/aggregate')
  async triggerAggregation(@Req() req) {
    const userId = req.user.id;
    await this.nutritionAggregationService.aggregateAllForUser(userId);
    return { message: 'Aggregation completed successfully' };
  }
}
