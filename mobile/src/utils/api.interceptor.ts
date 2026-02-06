import { authService } from "@/src/services/auth.service";

// Global refresh promise to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export class APIInterceptor {
  private static saveOriginalRequest(request: RequestInfo, init?: RequestInit): RequestConfig {
    const url = typeof request === 'string' ? request : request.url;
    const method = init?.method || 'GET';
    const headers: Record<string, string> = {};
    
    // Copy existing headers
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }
    
    return {
      url,
      method,
      headers,
      body: init?.body as string | undefined,
    };
  }

  static async requestInterceptor(request: RequestInfo, init?: RequestInit): Promise<[RequestInfo, RequestInit]> {
    // Get token from auth service
    const token = await authService.getToken();
    
    // Add authorization header if token exists
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
    
    // Merge with existing headers
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          if (key.toLowerCase() !== 'authorization') { // Don't override auth header
            headers[key] = value;
          }
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          if (key.toLowerCase() !== 'authorization') {
            headers[key] = value;
          }
        });
      } else {
        Object.entries(init.headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'authorization') {
            headers[key] = value as string;
          }
        });
      }
    }
    
    return [request, { ...init, headers }];
  }

  static async responseInterceptor(
    response: Response, 
    originalRequest: RequestConfig
  ): Promise<Response> {
    // Check if response is unauthorized (401)
    if (response.status === 401) {
      try {
        // Use global refresh promise to prevent race conditions
        if (!refreshPromise) {
          refreshPromise = authService.refreshAccessToken();
        }
        
        const refreshResult = await refreshPromise;
        
        // Clear the promise after it resolves
        refreshPromise = null;
        
        // Retry original request with new token
        const retryHeaders = {
          ...originalRequest.headers,
          "Authorization": `Bearer ${refreshResult.accessToken}`,
        };
        
        const retryOptions: RequestInit = {
          method: originalRequest.method,
          headers: retryHeaders,
        };
        
        // Only add body for non-GET requests
        if (originalRequest.body && originalRequest.method !== 'GET') {
          retryOptions.body = originalRequest.body;
        }
        
        const retryResponse = await fetch(originalRequest.url, retryOptions);
        
        // If retry also fails with 401, logout user
        if (retryResponse.status === 401) {
          await authService.logout();
          throw new Error("Session expired. Please log in again.");
        }
        
        return retryResponse;
      } catch (refreshError) {
        // Clear the promise on error
        refreshPromise = null;
        
        // Handle refresh failure - log out user
        await authService.logout();
        throw new Error("Session expired. Please log in again.");
      }
    }
    
    return response;
  }

  static async fetchWithInterceptor(request: RequestInfo, init?: RequestInit): Promise<Response> {
    // Save original request details before modification
    const originalRequest = this.saveOriginalRequest(request, init);
    
    // Apply request interceptor
    const [modifiedRequest, modifiedInit] = await this.requestInterceptor(request, init);
    
    // Make the request
    const response = await fetch(modifiedRequest, modifiedInit);
    
    // Apply response interceptor with original request details for retry
    return this.responseInterceptor(response, originalRequest);
  }
  
  // Helper method to clear refresh promise (useful for testing or error recovery)
  static clearRefreshPromise() {
    refreshPromise = null;
  }
}
