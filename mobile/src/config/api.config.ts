
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? process.env.EXPO_PUBLIC_DEV_API_URL || "http://10.0.2.2:3000"
    : process.env.EXPO_PUBLIC_API_URL || "https://your-production-api.com",

  ENDPOINTS: {
    AUTH: {
      REGISTER: "/api/auth/register",
      LOGIN: "/api/auth/login",
      PROFILE: "/api/auth/profile",
      UPDATE_PROFILE: "/api/auth/profile",
      SEND_PHONE_OTP: "/api/auth/send-phone-otp",
      VERIFY_PHONE_OTP: "/api/auth/verify-phone-otp",
      RESEND_VERIFICATION_EMAIL: "/api/auth/resend-verification-email",
    },
    AI: {
      CHAT: "/chat",
      GENERATE_NUTRIENT: "/generate-nutrients",
    },
    MEALS: {
      BASE: "/api/meals",
      TODAY: "/api/meals/today",
      CREATE: "/api/meals",
      GET: "/api/meals/:id",
      ADD_FOOD: "/api/meals/add-food",
      REMOVE_FOOD: "/api/meals/:mealId/food/:foodId",
    },
  },
};
