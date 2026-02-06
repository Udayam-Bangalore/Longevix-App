import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Meal as ApiMeal, mealsService } from '@/src/services/meals.service';
import { 
  DailyStats, 
  MonthlyStats, 
  nutritionStatsService, 
  NutritionSummary, 
  WeeklyStats 
} from '@/src/services/nutrition-stats.service';
import { useAppStateStore } from './app-state.store';

// Extend the API FoodItem with UI-specific fields
export interface FoodItemUI {
  id?: string;
  name: string;
  quantity: number;  // API uses number
  unit?: string;     // API has this optional
  calories?: number;
  fat?: number;
  protein?: number;
  carbohydrates?: number;
  micronutrients?: Record<string, number>;
}

export interface MealUI {
  id: string;
  name: string;
  items: FoodItemUI[];
  calories: number;
  micronutrients?: Record<string, number>;
  icon: string;
  iconColor: string;
  iconBg: string;
}

// Internal types (aliases for backward compatibility within the store)
type FoodItem = FoodItemUI;
type Meal = MealUI;

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
  const formattedItems = apiMeal.items.map((item) => {
    return {
      ...item,
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbohydrates: Number(item.carbohydrates) || 0,
      fat: Number(item.fat) || 0,
    };
  });

  const calculatedCalories = formattedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
  
  const result = {
    id: apiMeal.id,
    name: apiMeal.name,
    items: formattedItems,
    calories: calculatedCalories,
    micronutrients: apiMeal.micronutrients,
    icon: getMealIcon(apiMeal.name),
    ...getMealColors(apiMeal.name),
  };
  
  return result;
};

interface MealsState {
  // State
  meals: Meal[];
  loading: boolean;
  error: string | null;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  nutritionSummary: NutritionSummary | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Computed
  isAnyLoading: boolean;
  
  // Actions
  setMeals: (meals: Meal[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDailyStats: (stats: DailyStats[]) => void;
  setWeeklyStats: (stats: WeeklyStats[]) => void;
  setMonthlyStats: (stats: MonthlyStats[]) => void;
  setNutritionSummary: (summary: NutritionSummary | null) => void;
  setStatsLoading: (loading: boolean) => void;
  setStatsError: (error: string | null) => void;
  clearErrors: () => void;
  
  // Async Actions
  refreshMeals: () => Promise<void>;
  addFoodToMeal: (mealName: string, foodItem: FoodItem) => Promise<void>;
  getMeal: (mealName: string) => Meal | undefined;
  refreshStats: () => Promise<void>;
  getDailyStats: (startDate?: string, endDate?: string) => Promise<void>;
  getWeeklyStats: (startDate?: string, endDate?: string) => Promise<void>;
  getMonthlyStats: (year?: number) => Promise<void>;
}

export const useMealsStore = create<MealsState>()(
  persist(
    (set, get) => ({
      // Initial State
      meals: initialMeals,
      loading: true,
      error: null,
      dailyStats: [],
      weeklyStats: [],
      monthlyStats: [],
      nutritionSummary: null,
      statsLoading: false,
      statsError: null,
      
      // Computed
      get isAnyLoading() {
        return get().loading || get().statsLoading;
      },
      
      // Actions
      setMeals: (meals) => set({ meals }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setDailyStats: (dailyStats) => set({ dailyStats }),
      setWeeklyStats: (weeklyStats) => set({ weeklyStats }),
      setMonthlyStats: (monthlyStats) => set({ monthlyStats }),
      setNutritionSummary: (nutritionSummary) => set({ nutritionSummary }),
      setStatsLoading: (statsLoading) => set({ statsLoading }),
      setStatsError: (statsError) => set({ statsError }),
      
      clearErrors: () => {
        set({ error: null, statsError: null });
        useAppStateStore.getState().clearGlobalError();
      },
      
      // Async Actions
      refreshMeals: async () => {
        const { clearGlobalError } = useAppStateStore.getState();
        
        try {
          set({ loading: true, error: null });
          clearGlobalError();
          
          const apiMeals = await mealsService.getTodayMeals();
          
          const updatedMeals = apiMeals.map(mapApiMealToMeal);
          
          const missingMeals = initialMeals.filter(meal => 
            !updatedMeals.some(apiMeal => apiMeal.name === meal.name)
          );
          
          const finalMeals = [...updatedMeals, ...missingMeals];
          
          set({ meals: finalMeals });
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to fetch meals';
          set({ error: errorMessage });
          useAppStateStore.getState().setGlobalError(errorMessage);
          throw err;
        } finally {
          set({ loading: false });
        }
      },
      
      addFoodToMeal: async (mealName, foodItem) => {
        try {
          set({ error: null });
          useAppStateStore.getState().clearGlobalError();
          
          const updatedFoodItem = {
            ...foodItem,
            id: foodItem.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          const { meals } = get();
          
          const existingMeal = meals.find(m => m.name === mealName);
          
          if (existingMeal && existingMeal.id && !initialMeals.some(im => im.id === existingMeal.id)) {
            await mealsService.addFoodToMeal({
              mealId: existingMeal.id,
              foodItem: updatedFoodItem,
            });
          } else {
            await mealsService.createMeal({
              mealName,
              foodItems: [updatedFoodItem],
            });
          }
          
          await Promise.all([get().refreshMeals(), get().refreshStats()]);
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to add food to meal';
          set({ error: errorMessage });
          useAppStateStore.getState().setGlobalError(errorMessage);
          throw err;
        }
      },
      
      getMeal: (mealName) => {
        return get().meals.find(meal => meal.name === mealName);
      },
      
      refreshStats: async () => {
        try {
          set({ statsLoading: true, statsError: null });
          useAppStateStore.getState().clearGlobalError();
          
          const summary = await nutritionStatsService.getNutritionSummary();
          set({
            nutritionSummary: summary,
            dailyStats: summary.last7Days,
            weeklyStats: summary.last4Weeks,
            monthlyStats: summary.last3Months,
          });
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to fetch nutrition stats';
          set({ statsError: errorMessage });
          useAppStateStore.getState().setGlobalError(errorMessage);
          console.error('[MealsStore] refreshStats error:', err);
        } finally {
          set({ statsLoading: false });
        }
      },
      
      getDailyStats: async (startDate, endDate) => {
        try {
          set({ statsLoading: true, statsError: null });
          useAppStateStore.getState().clearGlobalError();
          
          const stats = await nutritionStatsService.getDailyStats(startDate, endDate);
          set({ dailyStats: stats });
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to fetch daily stats';
          set({ statsError: errorMessage });
          useAppStateStore.getState().setGlobalError(errorMessage);
          console.error('[MealsStore] getDailyStats error:', err);
        } finally {
          set({ statsLoading: false });
        }
      },
      
      getWeeklyStats: async (startDate, endDate) => {
        try {
          set({ statsLoading: true, statsError: null });
          useAppStateStore.getState().clearGlobalError();
          
          const stats = await nutritionStatsService.getWeeklyStats(startDate, endDate);
          set({ weeklyStats: stats });
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to fetch weekly stats';
          set({ statsError: errorMessage });
          useAppStateStore.getState().setGlobalError(errorMessage);
          console.error('[MealsStore] getWeeklyStats error:', err);
        } finally {
          set({ statsLoading: false });
        }
      },
      
      getMonthlyStats: async (year) => {
        try {
          set({ statsLoading: true, statsError: null });
          useAppStateStore.getState().clearGlobalError();
          
          const stats = await nutritionStatsService.getMonthlyStats(year);
          set({ monthlyStats: stats });
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to fetch monthly stats';
          set({ statsError: errorMessage });
          useAppStateStore.getState().setGlobalError(errorMessage);
          console.error('[MealsStore] getMonthlyStats error:', err);
        } finally {
          set({ statsLoading: false });
        }
      },
    }),
    {
      name: 'meals-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ meals: state.meals }),
    }
  )
);

// Selectors
export const useMeals = () => useMealsStore((state) => state.meals);
export const useMealsLoading = () => useMealsStore((state) => state.loading);
export const useMealsError = () => useMealsStore((state) => state.error);
export const useDailyStats = () => useMealsStore((state) => state.dailyStats);
export const useWeeklyStats = () => useMealsStore((state) => state.weeklyStats);
export const useMonthlyStats = () => useMealsStore((state) => state.monthlyStats);
export const useNutritionSummary = () => useMealsStore((state) => state.nutritionSummary);
export const useMealsAnyLoading = () => useMealsStore((state) => state.isAnyLoading);
