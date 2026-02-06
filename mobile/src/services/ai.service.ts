import { API_CONFIG } from '../config/api.config';
import { authService } from './auth.service';

export interface FoodItem {
  id?: string;
  name: string;
  quantity: number;
  unit?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  micronutrients?: Record<string, number>;
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

export interface ChatAgentRequest {
  message: string;
  session_id?: string;
  context?: Record<string, any>;
}

export interface ChatAgentResponse {
  response: string;
  session_id: string;
  agent: string;
}

export interface NutritionLookupRequest {
  food_name: string;
  quantity?: number;
  unit?: string;
}

export interface NutritionLookupResponse {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  micronutrients: Record<string, number>;
}

export interface UserProfile {
  age: number;
  sex: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface RDACalculationRequest {
  user_profile: UserProfile;
  intake: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    micronutrients?: Record<string, number>;
  };
}

export interface RDACalculationResponse {
  rda: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    micronutrients: Record<string, number>;
  };
  comparison: {
    calories: { intake: number; rda: number; percentage: number };
    protein: { intake: number; rda: number; percentage: number };
    carbohydrates: { intake: number; rda: number; percentage: number };
    fat: { intake: number; rda: number; percentage: number };
    micronutrients?: Record<string, { intake: number; rda: number; percentage: number }>;
  };
  recommendations: string[];
}

export interface VisionAnalyzeRequest {
  image_base64: string;
  include_nutrition?: boolean;
}

export interface VisionAnalyzeResponse {
  description: string;
  identified_foods?: string[];
  nutrition_estimate?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  health_assessment?: string;
}

export interface RagRetrieveRequest {
  query: string;
  top_k?: number;
  filter_tags?: string[];
}

export interface RagRetrieveResponse {
  results: Array<{
    content: string;
    source: string;
    score: number;
    tags: string[];
  }>;
  query: string;
}

export interface Agent {
  name: string;
  description: string;
  capabilities: string[];
}

export interface AgentsListResponse {
  agents: Agent[];
}

export interface ChatSession {
  session_id: string;
  user_id: string;
  agent?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const aiService = {
  async generateNutrients(data: GenerateNutrientsRequest): Promise<GenerateNutrientsResponse> {
    try {
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
      
      if (jsonResponse.items && jsonResponse.items.length > 0) {
        jsonResponse.items = jsonResponse.items.map((item: any) => {
          return {
            ...item,
            protein: item.protein || item.protein_g || 0,
            carbohydrates: item.carbohydrates || item.carbs_g || 0,
            fat: item.fat || item.fat_g || 0,
          };
        });
      }
      
      return jsonResponse;
    } catch (error) {
      throw error;
    }
  },

  async chat(message: string): Promise<string> {
    try {
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
      return jsonResponse.response;
    } catch (error) {
      throw error;
    }
  },

  async chatWithImage(message: string, imageBase64: string): Promise<string> {
    try {
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
      return jsonResponse.response;
    } catch (error) {
      throw error;
    }
  },

  async chatWithAgent(
    agentName: string,
    data: ChatAgentRequest
  ): Promise<ChatAgentResponse> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.CHAT_AGENT}/${agentName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
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

  async nutritionLookup(data: NutritionLookupRequest): Promise<NutritionLookupResponse> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.TOOLS.NUTRITION_LOOKUP}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
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

  async calculateRDA(data: RDACalculationRequest): Promise<RDACalculationResponse> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.TOOLS.NUTRITION_RDA}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
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

  async visionAnalyze(data: VisionAnalyzeRequest): Promise<VisionAnalyzeResponse> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.TOOLS.VISION_ANALYZE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
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

  async ragRetrieve(data: RagRetrieveRequest): Promise<RagRetrieveResponse> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.TOOLS.RAG_RETRIEVE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
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

  async listAgents(): Promise<AgentsListResponse> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.AGENTS}`,
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

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.SESSIONS}/${sessionId}`,
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

  async deleteSession(sessionId: string): Promise<{ message: string }> {
    try {
      const token = await authService.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AI.SESSIONS}/${sessionId}`,
        {
          method: 'DELETE',
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
