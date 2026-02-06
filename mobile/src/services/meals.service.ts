import { API_CONFIG } from "@/src/config/api.config";
import { FoodItem } from "@/src/services/ai.service";
import { APIInterceptor } from "@/src/utils/api.interceptor";

export interface Meal {
  id: string;
  userId: string;
  name: string;
  items: FoodItem[];
  calories: number;
  micronutrients?: Record<string, number>;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMealRequest {
  mealName: string;
  foodItems: FoodItem[];
}

export interface AddFoodRequest {
  mealId: string;
  foodItem: FoodItem;
}

class MealsService {
  async getTodayMeals(): Promise<Meal[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.TODAY}`;
      
      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to fetch today's meals");
        } catch (parseError) {
          throw new Error(errorText || "Failed to fetch today's meals");
        }
      }

      return await response.json();
    } catch (error: any) {
      console.error("[MealsService] getTodayMeals error:", error);
      throw error;
    }
  }

  async getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.DATE_RANGE}?startDate=${startDate}&endDate=${endDate}`;
      
      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to fetch meals by date range");
        } catch (parseError) {
          throw new Error(errorText || "Failed to fetch meals by date range");
        }
      }

      return await response.json();
    } catch (error: any) {
      console.error("[MealsService] getMealsByDateRange error:", error);
      throw error;
    }
  }

  async getMealById(mealId: string): Promise<Meal> {
    if (!mealId || mealId === 'undefined' || mealId === 'null') {
      throw new Error('Invalid meal ID provided');
    }
    
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.BASE}/${mealId}`;
      
      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to fetch meal");
        } catch (parseError) {
          throw new Error(errorText || "Failed to fetch meal");
        }
      }

      return await response.json();
    } catch (error: any) {
      throw error;
    }
  }

  async createMeal(request: CreateMealRequest): Promise<Meal> {
    try {
      const response = await APIInterceptor.fetchWithInterceptor(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.CREATE}`,
        {
          method: "POST",
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to create meal");
        } catch (parseError) {
          throw new Error(errorText || "Failed to create meal");
        }
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async addFoodToMeal(request: AddFoodRequest): Promise<Meal> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.ADD_FOOD}`.replace(
        ":mealId",
        request.mealId,
      );

      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "POST",
        body: JSON.stringify({ foodItem: request.foodItem }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData?.message || errorData?.error || errorData?.detail || "Failed to add food to meal";
          throw new Error(errorMessage);
        } catch (parseError) {
          const cleanError = errorText.replace(/^[\s\S]*?Error:\s*/, '').trim() || "Failed to add food to meal";
          throw new Error(cleanError);
        }
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async removeFoodFromMeal(mealId: string, foodId: string): Promise<Meal> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.REMOVE_FOOD}`
        .replace(":mealId", mealId)
        .replace(":foodId", foodId);

      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to remove food from meal");
        } catch (parseError) {
          throw new Error(errorText || "Failed to remove food from meal");
        }
      }

      return await response.json();
    } catch (error: any) {
      console.error("[MealsService] removeFoodFromMeal error:", error);
      throw error;
    }
  }

  async updateMeal(
    mealId: string,
    data: { mealName?: string; foodItems?: FoodItem[] }
  ): Promise<Meal> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.UPDATE}`.replace(
        ":id",
        mealId
      );

      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to update meal");
        } catch (parseError) {
          throw new Error(errorText || "Failed to update meal");
        }
      }

      return await response.json();
    } catch (error: any) {
      console.error("[MealsService] updateMeal error:", error);
      throw error;
    }
  }

  async deleteMeal(mealId: string): Promise<{ message: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.MEALS.DELETE}`.replace(
        ":id",
        mealId
      );

      const response = await APIInterceptor.fetchWithInterceptor(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to delete meal");
        } catch (parseError) {
          throw new Error(errorText || "Failed to delete meal");
        }
      }

      return await response.json();
    } catch (error: any) {
      console.error("[MealsService] deleteMeal error:", error);
      throw error;
    }
  }
}

export const mealsService = new MealsService();
