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
  refreshToken: string;
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
  private readonly REFRESH_TOKEN_KEY = "refresh_token";

  async register(data: RegisterData): Promise<{ message: string; user?: any }> {
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`;

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
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`;

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
      
      await this.storeToken(result.accessToken, result.refreshToken);
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.PROFILE}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If token is expired (401), try to refresh it
        if (response.status === 401) {
          try {
            await this.refreshAccessToken();
            // Retry the request with new token
            const newToken = await this.getToken();
            const retryResponse = await fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            });
            
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              return data;
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and throw
            await this.logout();
            throw new Error("Session expired. Please login again.");
          }
        }
        
        const errorText = await response.text();
        let errorMessage = errorText || "Failed to fetch profile";
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Not JSON, use text
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  async storeToken(token: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error: any) {
      // Try to clear and retry on Android
      try {
        await AsyncStorage.clear();
        await AsyncStorage.setItem(this.TOKEN_KEY, token);
        await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      } catch (retryError: any) {
        throw new Error(`Failed to store authentication token: ${retryError?.message || 'Unknown error'}`);
      }
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      return refreshToken;
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      throw new Error("Failed to remove refresh token");
    }
  }

  async refreshAccessToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to refresh access token");
      }

      const result: AuthResponse = await response.json();
      
      // Validate tokens before storing
      if (!result.accessToken || typeof result.accessToken !== 'string' || 
          !result.refreshToken || typeof result.refreshToken !== 'string') {
        throw new Error('Invalid tokens received from server');
      }
      
      await this.storeToken(result.accessToken, result.refreshToken);
      return result;
    } catch (error: any) {
      // If refresh fails, log out the user
      if (error?.message?.includes('Refresh token')) {
        await this.logout();
      }
      
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      
      return token;
    } catch (error) {
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      
    } catch (error) {
      throw new Error("Failed to remove authentication token");
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout to invalidate session on server
      const token = await this.getToken();
      if (token) {
        const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`;
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      // Even if backend logout fails, continue with local cleanup
      console.error("Backend logout error:", error);
    } finally {
      // Always clear local tokens
      await this.removeToken();
      await this.removeRefreshToken();
    }
  }

  async sendPhoneOtp(data: PhoneOtpData): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.SEND_PHONE_OTP}`,
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
      throw error;
    }
  }

  async verifyPhoneOtp(data: VerifyPhoneOtpData): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.VERIFY_PHONE_OTP}`,
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

      await this.storeToken(result.accessToken, result.refreshToken);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async registerPhone(data: RegisterPhoneData): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.REGISTER_PHONE}`,
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
      throw error;
    }
  }

  async verifyPhoneAndSetUsername(data: VerifyPhoneAndSetUsernameData): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.VERIFY_PHONE_AND_SET_USERNAME}`,
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
      
      await this.storeToken(result.accessToken, result.refreshToken);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async setHasSeenWelcome(): Promise<void> {
    try {
      await AsyncStorage.setItem("has_seen_welcome", "true");
    } catch (error) {
      // Error setting welcome flag
    }
  }

  async getHasSeenWelcome(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem("has_seen_welcome");
      return value === "true";
    } catch (error) {
      return false;
    }
  }

  async updateProfile(data: ProfileData): Promise<User> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE}`,
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
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION_EMAIL}`,
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
      throw error;
    }
  }

  async exchangeSupabaseToken(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/${API_CONFIG.ENDPOINTS.AUTH.EXCHANGE_SUPABASE_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to exchange token");
      }

      const result = await response.json();

      if (!result.accessToken || typeof result.accessToken !== 'string') {
        throw new Error('Invalid token received from server');
      }

      await this.storeToken(result.accessToken, result.refreshToken || '');
      return result;
    } catch (error) {
      throw error;
    }
  }
}

export const authService = new AuthService();
