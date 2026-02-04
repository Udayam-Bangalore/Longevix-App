import { API_CONFIG } from '../config/api.config';
import { authService } from './auth.service';

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

export const nutritionStatsService = {
  async getDailyStats(startDate?: string, endDate?: string): Promise<DailyStats[]> {
    try {
      const token = await authService.getToken();
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.DAILY}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getWeeklyStats(startDate?: string, endDate?: string): Promise<WeeklyStats[]> {
    try {
      const token = await authService.getToken();
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.WEEKLY}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getMonthlyStats(year?: number): Promise<MonthlyStats[]> {
    try {
      const token = await authService.getToken();
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.MONTHLY}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getNutritionSummary(): Promise<NutritionSummary> {
    try {
      const token = await authService.getToken();
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.SUMMARY}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async triggerAggregation(): Promise<{ message: string }> {
    try {
      const token = await authService.getToken();
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.STATS.AGGREGATE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
