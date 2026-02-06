
const getBaseUrl = () => {
  const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL || "http://10.0.2.2:3000/api";
  const prodUrl = process.env.EXPO_PUBLIC_API_URL || "https://longevix-app-ejqz0v.cranl.net/api";
  const url = __DEV__ ? devUrl : prodUrl;
  return url.replace(/\/$/, "");
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  
   ENDPOINTS: {
    AUTH: {
      REGISTER: "auth/register",
      LOGIN: "auth/login",
      LOGOUT: "auth/logout",
      PROFILE: "auth/profile",
      UPDATE_PROFILE: "auth/profile",
      SEND_PHONE_OTP: "auth/send-phone-otp",
      VERIFY_PHONE_OTP: "auth/verify-phone-otp",
      REGISTER_PHONE: "auth/register-phone",
      VERIFY_PHONE_AND_SET_USERNAME: "auth/verify-phone-and-set-username",
      RESEND_VERIFICATION_EMAIL: "auth/resend-verification-email",
      REFRESH_TOKEN: "auth/refresh-token",
      EXCHANGE_SUPABASE_TOKEN: "auth/exchange-supabase-token",
    },
    AI: {
      CHAT: "ai/chat",
      GENERATE_NUTRIENT: "ai/generate-nutrient",
      CHAT_AGENT: "ai/chat/agent",
      TOOLS: {
        NUTRITION_LOOKUP: "ai/tools/nutrition/lookup",
        NUTRITION_RDA: "ai/tools/nutrition/rda",
        VISION_ANALYZE: "ai/tools/vision/analyze",
        RAG_RETRIEVE: "ai/tools/rag/retrieve",
      },
      AGENTS: "ai/agents",
      SESSIONS: "ai/sessions",
    },
    MEALS: {
      BASE: "meals",
      TODAY: "meals/today",
      DATE_RANGE: "meals/range",
      CREATE: "meals",
      GET: "meals/:id",
      UPDATE: "meals/:id",
      DELETE: "meals/:id",
      ADD_FOOD: "meals/:mealId/foods",
      REMOVE_FOOD: "meals/:mealId/foods/:foodId",
      STATS: {
        DAILY: "meals/stats/daily",
        WEEKLY: "meals/stats/weekly",
        MONTHLY: "meals/stats/monthly",
        SUMMARY: "meals/stats/summary",
        AGGREGATE: "meals/stats/aggregate",
      },
    },
  },
};