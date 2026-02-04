import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
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

    // Generate UUIDs for food items that don't have them
    const itemsWithIds = foodItems.map(item => ({
      ...item,
      id: item.id || randomUUID(),
      // Ensure numeric values are converted to numbers
      calories: Number(item.calories),
      fat: Number(item.fat),
      protein: Number(item.protein),
      carbohydrates: Number(item.carbohydrates),
      // Convert micronutrients values to numbers
      micronutrients: item.micronutrients ?
        Object.entries(item.micronutrients).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {} as Record<string, number>)
        : {},
    }));

    foodItems.forEach(item => {
      totalCalories += Number(item.calories);

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
      // Ensure all items have IDs and numeric values before merging
      const itemsToAdd = itemsWithIds.map(item => ({
        ...item,
        id: item.id || randomUUID(),
      // Ensure numeric values are converted to numbers
      calories: Number(item.calories),
      fat: Number(item.fat),
      protein: Number(item.protein),
      carbohydrates: Number(item.carbohydrates),
      // Convert micronutrients values to numbers
      micronutrients: item.micronutrients ?
        Object.entries(item.micronutrients).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {} as Record<string, number>)
        : {},
      }));
      existingMeal.items = [...existingMeal.items, ...itemsToAdd];
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
      items: itemsWithIds,
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

  async getMealsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]> {
    return this.mealRepository
      .createQueryBuilder('meal')
      .where('meal.userId = :userId', { userId })
      .andWhere('meal.date >= :startDate', { startDate })
      .andWhere('meal.date <= :endDate', { endDate })
      .orderBy('meal.date', 'ASC')
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

  async addFoodToMealById(userId: string, mealId: string, foodItem: FoodItem): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: {
        id: mealId,
        userId,
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    // Generate UUID for the new food item
    const newItem = {
      ...foodItem,
      id: foodItem.id || randomUUID(),
      calories: Number(foodItem.calories),
      fat: Number(foodItem.fat),
      protein: Number(foodItem.protein),
      carbohydrates: Number(foodItem.carbohydrates),
      micronutrients: foodItem.micronutrients ?
        Object.entries(foodItem.micronutrients).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {} as Record<string, number>)
        : {},
    };

    // Add the new item to the meal
    meal.items = [...meal.items, newItem];
    meal.calories += Number(foodItem.calories);

    // Add micronutrients
    if (foodItem.micronutrients) {
      if (!meal.micronutrients) {
        meal.micronutrients = {};
      }
      Object.entries(foodItem.micronutrients).forEach(([key, value]) => {
        if (!meal.micronutrients![key]) {
          meal.micronutrients![key] = 0;
        }
        meal.micronutrients![key] += Number(value);
      });
    }

    return this.mealRepository.save(meal);
  }

  async updateMeal(userId: string, mealId: string, updateData: { mealName?: string; foodItems?: FoodItem[] }): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: {
        id: mealId,
        userId,
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    // Update meal name if provided
    if (updateData.mealName) {
      meal.name = updateData.mealName;
    }

    // Update food items if provided
    if (updateData.foodItems) {
      const itemsWithIds = updateData.foodItems.map(item => ({
        ...item,
        id: item.id || randomUUID(),
        calories: Number(item.calories),
        fat: Number(item.fat),
        protein: Number(item.protein),
        carbohydrates: Number(item.carbohydrates),
        micronutrients: item.micronutrients ?
          Object.entries(item.micronutrients).reduce((acc, [key, value]) => {
            acc[key] = Number(value);
            return acc;
          }, {} as Record<string, number>)
          : {},
      }));

      // Recalculate totals
      let totalCalories = 0;
      const totalMicronutrients: Record<string, number> = {};

      itemsWithIds.forEach(item => {
        totalCalories += Number(item.calories);
        if (item.micronutrients) {
          Object.entries(item.micronutrients).forEach(([key, value]) => {
            if (!totalMicronutrients[key]) {
              totalMicronutrients[key] = 0;
            }
            totalMicronutrients[key] += value;
          });
        }
      });

      meal.items = itemsWithIds;
      meal.calories = totalCalories;
      meal.micronutrients = totalMicronutrients;
    }

    return this.mealRepository.save(meal);
  }

  async deleteMeal(userId: string, mealId: string): Promise<void> {
    const meal = await this.mealRepository.findOne({
      where: {
        id: mealId,
        userId,
      },
    });

    if (!meal) {
      throw new Error('Meal not found');
    }

    await this.mealRepository.remove(meal);
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
    const removedItem = meal.items.find(item => String(item.id) === String(foodId));
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

    meal.items = meal.items.filter(item => String(item.id) !== String(foodId));
    return this.mealRepository.save(meal);
  }
}
