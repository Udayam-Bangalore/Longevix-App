import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodItem, Meal } from './entities/meal.entity';

@Injectable()
export class MealsService {
  constructor(@InjectRepository(Meal) private mealRepository: Repository<Meal>) {}

  async createMeal(userId: string, mealName: string, foodItems: FoodItem[]): Promise<Meal> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalCalories = 0;
    const totalMicronutrients: Record<string, number> = {};

    foodItems.forEach(item => {
      totalCalories += item.calories || 0;

      if (item.micronutrients) {
        Object.entries(item.micronutrients).forEach(([key, value]) => {
          if (!totalMicronutrients[key]) {
            totalMicronutrients[key] = 0;
          }
          totalMicronutrients[key] += value;
        });
      }
    });

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);

    const existingMeal = await this.mealRepository
      .createQueryBuilder('meal')
      .where('meal.userId = :userId', { userId })
      .andWhere('meal.name = :mealName', { mealName })
      .andWhere('meal.date >= :today', { today })
      .andWhere('meal.date < :endDate', { endDate })
      .getOne();

    if (existingMeal) {
      existingMeal.items = [...existingMeal.items, ...foodItems];
      existingMeal.calories += totalCalories;

      if (!existingMeal.micronutrients) {
        existingMeal.micronutrients = {};
      }

      Object.entries(totalMicronutrients).forEach(([key, value]) => {
        if (!existingMeal.micronutrients![key]) {
          existingMeal.micronutrients![key] = 0;
        }
        existingMeal.micronutrients![key] += value;
      });

      return this.mealRepository.save(existingMeal);
    }

    const newMeal = this.mealRepository.create({
      userId,
      name: mealName,
      items: foodItems,
      calories: totalCalories,
      micronutrients: totalMicronutrients,
      date: today,
    });

    return this.mealRepository.save(newMeal);
  }

  async getMealsByDate(userId: string, date: Date): Promise<Meal[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return this.mealRepository
      .createQueryBuilder('meal')
      .where('meal.userId = :userId', { userId })
      .andWhere('meal.date >= :startDate', { startDate })
      .andWhere('meal.date < :endDate', { endDate })
      .getMany();
  }

  async getMealById(userId: string, mealId: string): Promise<Meal | null> {
    return this.mealRepository.findOne({
      where: {
        id: mealId,
        userId,
      },
    });
  }

  async addFoodToMeal(userId: string, mealName: string, foodItem: FoodItem): Promise<Meal> {
    return this.createMeal(userId, mealName, [foodItem]);
  }

  async removeFoodFromMeal(userId: string, mealId: string, foodId: string): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: {
        id: mealId,
        userId,
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    // Find the food item being removed to calculate calories to subtract
    const removedItem = meal.items.find(item => item.id === foodId);
    if (removedItem) {
      meal.calories -= Number(removedItem.calories);
      
      // Subtract micronutrients
      if (removedItem.micronutrients) {
        Object.entries(removedItem.micronutrients).forEach(([key, value]) => {
          if (meal.micronutrients && meal.micronutrients[key]) {
            meal.micronutrients[key] -= value;
            if (meal.micronutrients[key] < 0) {
              meal.micronutrients[key] = 0;
            }
          }
        });
      }
    }

    meal.items = meal.items.filter(item => item.id !== foodId);
    return this.mealRepository.save(meal);
  }
}
