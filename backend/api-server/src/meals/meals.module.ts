import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meal } from './entities/meal.entity';
import { NutritionDailyStats } from './entities/nutrition-daily-stats.entity';
import { NutritionMonthlyStats } from './entities/nutrition-monthly-stats.entity';
import { NutritionWeeklyStats } from './entities/nutrition-weekly-stats.entity';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { NutritionAggregationService } from './nutrition-aggregation.service';
import { NutritionSchedulerService } from './nutrition-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meal,
      NutritionDailyStats,
      NutritionWeeklyStats,
      NutritionMonthlyStats,
    ]),
  ],
  controllers: [MealsController],
  providers: [
    MealsService,
    NutritionAggregationService,
    NutritionSchedulerService,
  ],
  exports: [
    MealsService,
    NutritionAggregationService,
    NutritionSchedulerService,
  ],
})
export class MealsModule {}
