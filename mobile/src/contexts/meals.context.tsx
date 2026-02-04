import { Meal as ApiMeal, mealsService } from '@/src/services/meals.service';
import { DailyStats, MonthlyStats, nutritionStatsService, NutritionSummary, WeeklyStats } from '@/src/services/nutrition-stats.service';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth.context';

export interface FoodItem {
  id?: string;
  name: string;
  quantity: string;
  unit: string;
  calories?: number;
  fat?: number;
  protein?: number;
  carbohydrates?: number;
  micronutrients?: Record<string, number>;
}

export interface Meal {
  id: string;
  name: string;
  items: FoodItem[];
  calories: number;
  micronutrients?: Record<string, number>;
  icon: string;
  iconColor: string;
  iconBg: string;
}

interface MealsContextType {
  meals: Meal[];
  addFoodToMeal: (mealName: string, foodItem: FoodItem) => Promise<void>;
  getMeal: (mealName: string) => Meal | undefined;
  loading: boolean;
  error: string | null;
  refreshMeals: () => Promise<void>;
  // Nutrition Statistics
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  nutritionSummary: NutritionSummary | null;
  statsLoading: boolean;
  refreshStats: () => Promise<void>;
  getDailyStats: (startDate?: string, endDate?: string) => Promise<void>;
  getWeeklyStats: (startDate?: string, endDate?: string) => Promise<void>;
  getMonthlyStats: (year?: number) => Promise<void>;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

const initialMeals: Meal[] = [
  {
    id: '1',
    name: 'Breakfast',
    items: [],
    calories: 0,
    icon: 'egg-fried',
    iconColor: '#FF9800',
    iconBg: '#FFF3E0',
  },
  {
    id: '2',
    name: 'Lunch',
    items: [],
    calories: 0,
    icon: 'food-apple',
    iconColor: '#4CAF50',
    iconBg: '#E8F5E9',
  },
  {
    id: '3',
    name: 'Dinner',
    items: [],
    calories: 0,
    icon: 'food-variant',
    iconColor: '#9C27B0',
    iconBg: '#F3E5F5',
  },
  {
    id: '4',
    name: 'Snack',
    items: [],
    calories: 0,
    icon: 'cookie',
    iconColor: '#FFC107',
    iconBg: '#FFFDE7',
  },
];

interface MealsProviderProps {
  children: ReactNode;
}

export function MealsProvider({ children }: MealsProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nutrition Statistics State
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const getMealIcon = (mealName: string) => {
    switch (mealName.toLowerCase()) {
      case 'breakfast':
        return 'egg-fried';
      case 'lunch':
        return 'food-apple';
      case 'dinner':
        return 'food-variant';
      case 'snack':
        return 'cookie';
      default:
        return 'food-variant';
    }
  };

  const getMealColors = (mealName: string) => {
    switch (mealName.toLowerCase()) {
      case 'breakfast':
        return { iconColor: '#FF9800', iconBg: '#FFF3E0' };
      case 'lunch':
        return { iconColor: '#4CAF50', iconBg: '#E8F5E9' };
      case 'dinner':
        return { iconColor: '#9C27B0', iconBg: '#F3E5F5' };
      case 'snack':
        return { iconColor: '#FFC107', iconBg: '#FFFDE7' };
      default:
        return { iconColor: '#9C27B0', iconBg: '#F3E5F5' };
    }
  };

  const mapApiMealToMeal = (apiMeal: ApiMeal): Meal => {
    // Ensure all food items have properly formatted numeric values
    const formattedItems = apiMeal.items.map(item => ({
      ...item,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbohydrates: Number(item.carbohydrates) || 0,
      fat: Number(item.fat) || 0,
    }));

    // Recalculate total calories from items to ensure accuracy
    const calculatedCalories = formattedItems.reduce((sum, item) => sum + (item.calories || 0), 0);

    return {
      id: apiMeal.id,
      name: apiMeal.name,
      items: formattedItems,
      calories: calculatedCalories, // Use calculated value instead of apiMeal.calories
      micronutrients: apiMeal.micronutrients,
      icon: getMealIcon(apiMeal.name),
      ...getMealColors(apiMeal.name),
    };
  };

  const refreshMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiMeals = await mealsService.getTodayMeals();
      
      // Update existing meals with API data
      const updatedMeals = apiMeals.map(mapApiMealToMeal);
      
      // Add any missing meals from initial meals
      const missingMeals = initialMeals.filter(meal => 
        !updatedMeals.some(apiMeal => apiMeal.name === meal.name)
      );
      
      setMeals([...updatedMeals, ...missingMeals]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  // Load meals from API when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      refreshMeals();
    }
  }, [isAuthenticated, authLoading]);

  const addFoodToMeal = async (mealName: string, foodItem: FoodItem) => {
    try {
      setError(null);
      // Generate a unique ID for the food item
      const updatedFoodItem = {
        ...foodItem,
        id: foodItem.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Find the meal ID from existing meals
      const existingMeal = meals.find(m => m.name === mealName);
      
      if (existingMeal && existingMeal.id && !initialMeals.some(im => im.id === existingMeal.id)) {
        // Meal exists in API, add food to existing meal
        await mealsService.addFoodToMeal({
          mealId: existingMeal.id,
          foodItem: updatedFoodItem,
        });
      } else {
        // Create new meal with the food item
        await mealsService.createMeal({
          mealName,
          foodItems: [updatedFoodItem],
        });
      }
      await refreshMeals();
    } catch (err: any) {
      setError(err.message || 'Failed to add food to meal');
    }
  };

  const getMeal = (mealName: string) => {
    return meals.find(meal => meal.name === mealName);
  };

  // Nutrition Statistics Functions
  const refreshStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      const summary = await nutritionStatsService.getNutritionSummary();
      setNutritionSummary(summary);
      setDailyStats(summary.last7Days);
      setWeeklyStats(summary.last4Weeks);
      setMonthlyStats(summary.last3Months);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nutrition stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const getDailyStats = async (startDate?: string, endDate?: string) => {
    try {
      setStatsLoading(true);
      setError(null);
      const stats = await nutritionStatsService.getDailyStats(startDate, endDate);
      setDailyStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch daily stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const getWeeklyStats = async (startDate?: string, endDate?: string) => {
    try {
      setStatsLoading(true);
      setError(null);
      const stats = await nutritionStatsService.getWeeklyStats(startDate, endDate);
      setWeeklyStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weekly stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const getMonthlyStats = async (year?: number) => {
    try {
      setStatsLoading(true);
      setError(null);
      const stats = await nutritionStatsService.getMonthlyStats(year);
      setMonthlyStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monthly stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const value: MealsContextType = {
    meals,
    addFoodToMeal,
    getMeal,
    loading,
    error,
    refreshMeals,
    // Nutrition Statistics
    dailyStats,
    weeklyStats,
    monthlyStats,
    nutritionSummary,
    statsLoading,
    refreshStats,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
  };

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

export function useMeals() {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
}
