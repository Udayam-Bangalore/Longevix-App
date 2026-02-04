import { authService } from "@/src/services/auth.service";

export class APIInterceptor {
  static async requestInterceptor(request: RequestInfo, init?: RequestInit): Promise<[RequestInfo, RequestInit]> {
    // Get token from auth service
    const token = await authService.getToken();
    
    // Add authorization header if token exists
    const headers = {
      ...init?.headers,
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
    
    return [request, { ...init, headers }];
  }

  static async responseInterceptor(response: Response): Promise<Response> {
    // Check if response is unauthorized (401)
    if (response.status === 401) {
      console.log("Unauthorized response received. Attempting to refresh token...");
      
      try {
        // Attempt to refresh token
        const refreshResult = await authService.refreshAccessToken();
        console.log("Token refreshed successfully");
        
        // Retry original request with new token
        const originalRequest = response.url;
        const retryOptions = {
          method: response.headers.get("method") || "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${refreshResult.accessToken}`,
          },
        };
        
        const retryResponse = await fetch(originalRequest, retryOptions);
        return retryResponse;
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Handle refresh failure (e.g., log out user)
        await authService.logout();
        throw new Error("Session expired. Please log in again.");
      }
    }
    
    return response;
  }

  static async fetchWithInterceptor(request: RequestInfo, init?: RequestInit): Promise<Response> {
    const [modifiedRequest, modifiedInit] = await this.requestInterceptor(request, init);
    const response = await fetch(modifiedRequest, modifiedInit);
    
    return this.responseInterceptor(response);
  }
}
