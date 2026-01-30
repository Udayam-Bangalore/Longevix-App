import { API_CONFIG } from "@/src/config/api.config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PhoneOtpData {
  phone: string;
}

export interface VerifyPhoneOtpData {
  phone: string;
  token: string;
}

export interface RegisterPhoneData {
  phone: string;
  username: string;
}

export interface VerifyPhoneAndSetUsernameData {
  phone: string;
  token: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  role: string;
  profileCompleted: boolean;
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  dietType?: string;
  primaryGoal?: string;
}

export interface ProfileData {
  age: number;
  sex: string | null;
  height?: number | null;
  weight?: number | null;
  activityLevel: string | null;
  dietType: string | null;
  primaryGoal: string | null;
}

class AuthService {
  private readonly TOKEN_KEY = "auth_token";

  async register(data: RegisterData): Promise<{ message: string; user?: any }> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`;
    console.log("[AuthService] Register URL:", url);
    console.log("[AuthService] API_CONFIG.BASE_URL:", API_CONFIG.BASE_URL);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        throw new Error(errorData.message || "Registration failed");
      }

      const result = await response.json();
      
      // No token is returned - user must verify email first
      return result;
    } catch (error: any) {
      console.error("[AuthService] Register error:", error);
      console.error("[AuthService] Error message:", error?.message);
      console.error("[AuthService] Error type:", error?.constructor?.name);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`;
      console.log("[AuthService] Login URL:", url);
      console.log("[AuthService] API_CONFIG.BASE_URL:", API_CONFIG.BASE_URL);
      console.log("[AuthService] __DEV__:", __DEV__);
      console.log("[AuthService] ENV EXPO_PUBLIC_DEV_API_URL:", process.env.EXPO_PUBLIC_DEV_API_URL);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }

      const result: AuthResponse = await response.json();
      
      // Validate token before storing
      if (!result.accessToken || typeof result.accessToken !== 'string') {
        throw new Error('Invalid token received from server');
      }
      
      await this.storeToken(result.accessToken);
      return result;
    } catch (error: any) {
      console.error("[AuthService] Login error:", error);
      console.error("[AuthService] Error message:", error?.message);
      console.error("[AuthService] Error type:", error?.constructor?.name);
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.PROFILE}`,
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
      throw new Error(errorData.message || "Failed to fetch profile");
    }

    return await response.json();
  }

  async storeToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
      
    } catch (error: any) {
      console.error("Error storing token:", error);
      
      // Try to clear and retry on Android
      try {
        await AsyncStorage.clear();
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
      } catch (retryError: any) {
        console.error("Retry after clear failed:", retryError);
        throw new Error(`Failed to store authentication token: ${retryError?.message || 'Unknown error'}`);
      }
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      
    } catch (error) {
      console.error("Error removing token:", error);
      throw new Error("Failed to remove authentication token");
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async sendPhoneOtp(data: PhoneOtpData): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SEND_PHONE_OTP}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send OTP");
      }

      return await response.json();
    } catch (error) {
      console.error("authService.sendPhoneOtp error:", error);
      throw error;
    }
  }

  async verifyPhoneOtp(data: VerifyPhoneOtpData): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY_PHONE_OTP}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to verify OTP");
      }

      const result: AuthResponse = await response.json();

      // Validate token before storing
      if (!result.accessToken || typeof result.accessToken !== 'string') {
        throw new Error('Invalid token received from server');
      }

      await this.storeToken(result.accessToken);
      return result;
    } catch (error) {
      console.error("authService.verifyPhoneOtp error:", error);
      throw error;
    }
  }

  async registerPhone(data: RegisterPhoneData): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/auth/register-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send OTP");
      }

      return await response.json();
    } catch (error) {
      console.error("authService.registerPhone error:", error);
      throw error;
    }
  }

  async verifyPhoneAndSetUsername(data: VerifyPhoneAndSetUsernameData): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/auth/verify-phone-and-set-username`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to verify OTP");
      }

      const result: AuthResponse = await response.json();
      
      // Validate token before storing
      if (!result.accessToken || typeof result.accessToken !== 'string') {
        throw new Error('Invalid token received from server');
      }
      
      await this.storeToken(result.accessToken);
      return result;
    } catch (error) {
      console.error("authService.verifyPhoneAndSetUsername error:", error);
      throw error;
    }
  }

  async setHasSeenWelcome(): Promise<void> {
    try {
      await AsyncStorage.setItem("has_seen_welcome", "true");
    } catch (error) {
      console.error("Error setting welcome flag:", error);
    }
  }

  async getHasSeenWelcome(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem("has_seen_welcome");
      return value === "true";
    } catch (error) {
      console.error("Error getting welcome flag:", error);
      return false;
    }
  }

  async updateProfile(data: ProfileData): Promise<User> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update profile");
    }

    const result = await response.json();
    return result.user;
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION_EMAIL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to resend verification email");
      }

      return await response.json();
    } catch (error) {
      console.error("authService.resendVerificationEmail error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
