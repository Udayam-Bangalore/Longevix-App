import React, { ReactNode, useEffect } from 'react';
import { useMealsStore, useAuthStore } from '@/src/store';
import { FoodItemUI as FoodItem, MealUI as Meal } from '@/src/store/meals.store';
import { DailyStats, MonthlyStats, NutritionSummary, WeeklyStats } from '@/src/services/nutrition-stats.service';

interface MealsContextType {
  meals: Meal[];
  addFoodToMeal: (mealName: string, foodItem: FoodItem) => Promise<void>;
  getMeal: (mealName: string) => Meal | undefined;
  loading: boolean;
  error: string | null;
  refreshMeals: () => Promise<void>;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  nutritionSummary: NutritionSummary | null;
  statsLoading: boolean;
  statsError: string | null;
  refreshStats: () => Promise<void>;
  getDailyStats: (startDate?: string, endDate?: string) => Promise<void>;
  getWeeklyStats: (startDate?: string, endDate?: string) => Promise<void>;
  getMonthlyStats: (year?: number) => Promise<void>;
  isAnyLoading: boolean;
  clearErrors: () => void;
}

const MealsContext = React.createContext<MealsContextType | undefined>(undefined);

interface MealsProviderProps {
  children: ReactNode;
}

export function MealsProvider({ children }: MealsProviderProps) {
  const store = useMealsStore();
  const { user, isLoading: authLoading } = useAuthStore();
  const isAuthenticated = !!user;

  // Load meals from API when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      store.refreshMeals();
    }
  }, [isAuthenticated, authLoading]);

  const value: MealsContextType = {
    meals: store.meals,
    addFoodToMeal: store.addFoodToMeal,
    getMeal: store.getMeal,
    loading: store.loading,
    error: store.error,
    refreshMeals: store.refreshMeals,
    dailyStats: store.dailyStats,
    weeklyStats: store.weeklyStats,
    monthlyStats: store.monthlyStats,
    nutritionSummary: store.nutritionSummary,
    statsLoading: store.statsLoading,
    statsError: store.statsError,
    refreshStats: store.refreshStats,
    getDailyStats: store.getDailyStats,
    getWeeklyStats: store.getWeeklyStats,
    getMonthlyStats: store.getMonthlyStats,
    isAnyLoading: store.isAnyLoading,
    clearErrors: store.clearErrors,
  };

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

export function useMeals() {
  const context = React.useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
}

// Re-export store hooks only - types should be imported from store/meals.store directly
export { 
  useMealsStore, 
  useMeals as useMealsSelector, 
  useMealsLoading, 
  useMealsError,
  useDailyStats,
  useWeeklyStats,
  useMonthlyStats,
  useNutritionSummary,
  useMealsAnyLoading
} from '@/src/store';
