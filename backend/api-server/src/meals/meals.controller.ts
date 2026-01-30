import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { FoodItem } from './entities/meal.entity';
import { MealsService } from './meals.service';

@Controller('meals')
@UseGuards(AuthGuard)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  async createMeal(
    @Body() body: { mealName: string; foodItems: FoodItem[] },
    @Req() req,
  ) {
    const userId = req.user.sub;
    return this.mealsService.createMeal(userId, body.mealName, body.foodItems);
  }

  @Get('today')
  async getTodayMeals(@Req() req) {
    const userId = req.user.sub;
    const today = new Date();
    return this.mealsService.getMealsByDate(userId, today);
  }

  @Get(':id')
  async getMealById(@Param('id') id: string, @Req() req) {
    const userId = req.user.sub;
    return this.mealsService.getMealById(userId, id);
  }

  @Post('add-food')
  async addFoodToMeal(
    @Body() body: { mealName: string; foodItem: FoodItem },
    @Req() req,
  ) {
    const userId = req.user.sub;
    return this.mealsService.addFoodToMeal(userId, body.mealName, body.foodItem);
  }

  @Delete(':mealId/food/:foodId')
  async removeFoodFromMeal(
    @Param('mealId') mealId: string,
    @Param('foodId') foodId: string,
    @Req() req,
  ) {
    const userId = req.user.sub;
    return this.mealsService.removeFoodFromMeal(userId, mealId, foodId);
  }
}
