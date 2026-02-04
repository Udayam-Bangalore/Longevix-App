import { API_CONFIG } from '../config/api.config';
import { authService } from './auth.service';

export interface FoodItem {
  name: string;
  quantity: number;
  unit?: string;
}

export interface GenerateNutrientsRequest {
  isAuthenticated: boolean;
  role: 'prouser' | 'admin' | 'user';
  food: FoodItem[];
  time: 'breakfast' | 'lunch' | 'snack' | 'dinner';
}

export interface NutrientInfo {
  calories: number;
  fat: number;
  protein: number;
  carbohydrates: number;
  micronutrients: Record<string, number>;
}

export interface GenerateNutrientsResponse {
  total: NutrientInfo;
  items: Array<{
    name: string;
    quantity: number;
    calories: number;
    fat: number;
    protein: number;
    carbohydrates: number;
    micronutrients: Record<string, number>;
  }>;
}

export const aiService = {
  async generateNutrients(data: GenerateNutrientsRequest): Promise<GenerateNutrientsResponse> {
    try {
      // Ensure time is lowercase before sending
      const requestData = {
        ...data,
        time: data.time.toLowerCase(),
      };

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.GENERATE_NUTRIENT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const jsonResponse = await response.json();
      return jsonResponse;
    } catch (error) {
      throw error;
    }
  },

  async chat(message: string): Promise<string> {
    try {
      // Get token from auth service
      const token = await authService.getToken();
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.CHAT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const jsonResponse = await response.json();
      return jsonResponse.response; // Extract the response field
    } catch (error) {
      throw error;
    }
  },

  async chatWithImage(message: string, imageBase64: string): Promise<string> {
    try {
      // Get token from auth service
      const token = await authService.getToken();
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.CHAT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            message: message || "Please analyze this food image and tell me if it's a good choice for my diet.",
            image: imageBase64,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const jsonResponse = await response.json();
      return jsonResponse.response; // Extract the response field
    } catch (error) {
      throw error;
    }
  },
};
