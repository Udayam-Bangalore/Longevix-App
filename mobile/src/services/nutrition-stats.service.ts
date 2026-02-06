import { API_CONFIG } from '../config/api.config';
import { APIInterceptor } from '../utils/api.interceptor';

export interface DailyStats {
  id: string;
  userId: string;
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  micronutrients?: Record<string, number>;
  breakfastCalories: number;
  lunchCalories: number;
  dinnerCalories: number;
  snackCalories: number;
  totalMeals: number;
}

export interface WeeklyStats {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbohydrates: number;
  avgFat: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
  totalMicronutrients?: Record<string, number>;
  daysTracked: number;
  goalStreakDays: number;
  totalBreakfastCalories: number;
  totalLunchCalories: number;
  totalDinnerCalories: number;
  totalSnackCalories: number;
}

export interface MonthlyStats {
  id: string;
  userId: string;
  month: number;
  year: number;
  monthStart: string;
  monthEnd: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbohydrates: number;
  avgFat: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
  totalMicronutrients?: Record<string, number>;
  daysTracked: number;
  totalDaysInMonth: number;
  trackingPercentage: number;
  goalStreakDays: number;
  longestStreak: number;
  totalBreakfastCalories: number;
  totalLunchCalories: number;
  totalDinnerCalories: number;
  totalSnackCalories: number;
  weeklyBreakdown?: {
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
    totalCalories: number;
    avgCalories: number;
  }[];
}

export interface NutritionSummary {
  last7Days: DailyStats[];
  last4Weeks: WeeklyStats[];
  last3Months: MonthlyStats[];
}

class NutritionStatsService {
  async getDailyStats(startDate?: string, endDate?: string): Promise<DailyStats[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await APIInterceptor.fetchWithInterceptor(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.DAILY}?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[NutritionStatsService] getDailyStats error:', error);
      throw error;
    }
  }

  async getWeeklyStats(startDate?: string, endDate?: string): Promise<WeeklyStats[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await APIInterceptor.fetchWithInterceptor(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.WEEKLY}?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[NutritionStatsService] getWeeklyStats error:', error);
      throw error;
    }
  }

  async getMonthlyStats(year?: number): Promise<MonthlyStats[]> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());

      const response = await APIInterceptor.fetchWithInterceptor(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.MONTHLY}?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[NutritionStatsService] getMonthlyStats error:', error);
      throw error;
    }
  }

  async getNutritionSummary(): Promise<NutritionSummary> {
    try {
      const response = await APIInterceptor.fetchWithInterceptor(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.SUMMARY}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[NutritionStatsService] getNutritionSummary error:', error);
      throw error;
    }
  }

  async triggerAggregation(): Promise<{ message: string }> {
    try {
      const response = await APIInterceptor.fetchWithInterceptor(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.AGGREGATE}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('[NutritionStatsService] triggerAggregation error:', error);
      throw error;
    }
  }
}

export const nutritionStatsService = new NutritionStatsService();
