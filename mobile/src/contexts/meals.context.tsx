import { Meal as ApiMeal, mealsService } from '@/src/services/meals.service';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth.context';

export interface FoodItem {
  id?: string;
  name: string;
  quantity: string;
  unit: string;
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
    return {
      id: apiMeal.id,
      name: apiMeal.name,
      items: apiMeal.items,
      calories: apiMeal.calories,
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
      
      // Create a map of existing meals
      const existingMealsMap = new Map(meals.map(meal => [meal.name, meal]));
      
      // Update existing meals with API data
      const updatedMeals = apiMeals.map(mapApiMealToMeal);
      
      // Add any missing meals from initial meals
      const missingMeals = initialMeals.filter(meal => 
        !updatedMeals.some(apiMeal => apiMeal.name === meal.name)
      );
      
      setMeals([...updatedMeals, ...missingMeals]);
    } catch (err: any) {
      console.error('Error fetching meals:', err);
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
      const updatedFoodItem = { ...foodItem, id: Date.now().toString() };
      await mealsService.addFoodToMeal({
        mealName,
        foodItem: updatedFoodItem,
      });
      await refreshMeals();
    } catch (err: any) {
      console.error('Error adding food to meal:', err);
      setError(err.message || 'Failed to add food to meal');
    }
  };

  const getMeal = (mealName: string) => {
    return meals.find(meal => meal.name === mealName);
  };

  const value: MealsContextType = {
    meals,
    addFoodToMeal,
    getMeal,
    loading,
    error,
    refreshMeals,
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
