import { API_CONFIG } from "@/src/config/api.config";
import { FoodItem } from "@/src/contexts/meals.context";
import { authService } from "./auth.service";

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
  mealName: string;
  foodItem: FoodItem;
}

class MealsService {
  async getTodayMeals(): Promise<Meal[]> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MEALS.TODAY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch today's meals");
    }

    return await response.json();
  }

  async getMealById(mealId: string): Promise<Meal> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MEALS.BASE}/${mealId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch meal");
    }

    return await response.json();
  }

  async createMeal(request: CreateMealRequest): Promise<Meal> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MEALS.CREATE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create meal");
    }

    return await response.json();
  }

  async addFoodToMeal(request: AddFoodRequest): Promise<Meal> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MEALS.ADD_FOOD}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to add food to meal");
    }

    return await response.json();
  }

  async removeFoodFromMeal(mealId: string, foodId: string): Promise<Meal> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MEALS.BASE}/${mealId}/food/${foodId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to remove food from meal");
    }

    return await response.json();
  }
}

export const mealsService = new MealsService();
