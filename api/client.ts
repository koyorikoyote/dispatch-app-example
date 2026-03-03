/**
 * HTTP API Client
 * Centralized axios client with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { API_CONFIG, ENV_CONFIG } from "../config/api";

export class ApiClient {
  private client: AxiosInstance;
  private isOnline: boolean = true;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    if (ENV_CONFIG.enableApiLogging) {
      console.log(`🔌 API Client initialized with Base URL: ${API_CONFIG.BASE_URL}`);
      console.log(`⏱️ API Timeout: ${API_CONFIG.TIMEOUT}ms`);
    }

    this.setupInterceptors();
    this.setupNetworkMonitoring();
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          let token: string | null = null;

          if (Platform.OS === "web") {
            // Use localStorage for web
            token = localStorage.getItem("auth_token");
          } else {
            // Use SecureStore for native
            if (SecureStore && typeof SecureStore.getItemAsync === "function") {
              token = await SecureStore.getItemAsync("auth_token");
            }
          }

          if (ENV_CONFIG.enableApiLogging) {
            console.log(
              `🔑 Token retrieved for ${config.url}:`,
              token ? `${token.substring(0, 20)}...` : "null"
            );
          }

          // Additional debug logging for submissions endpoint
          if (config.url?.includes("/mobile/submissions") && !token) {
            console.warn(
              "⚠️ No token available for submissions request - this will likely fail"
            );
          }

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else if (config.url && !config.url.includes("/mobile/auth/login")) {
            // For non-login requests, we should have a token
            console.error(
              "🚨 No token available for authenticated request:",
              config.url
            );
            // Don't make the request without a token for protected endpoints
            if (
              config.url.includes("/mobile/submissions") ||
              config.url.includes("/mobile/companies") ||
              config.url.includes("/mobile/users")
            ) {
              throw new Error("Authentication required - no token available");
            }
          }
        } catch (error) {
          if (ENV_CONFIG.enableApiLogging) {
            console.warn("Failed to retrieve auth token:", error);
          }
        }

        if (ENV_CONFIG.enableApiLogging) {
          console.log(
            `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
            {
              params: config.params,
              data: config.data ? "[DATA]" : undefined,
              hasAuth: !!config.headers.Authorization,
            }
          );
        }

        return config;
      },
      (error) => {
        if (ENV_CONFIG.enableApiLogging) {
          console.error("Request interceptor error:", error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (ENV_CONFIG.enableApiLogging) {
          console.log(
            `✅ API Response: ${response.status} ${response.config.url}`,
            {
              data: response.data ? "[DATA]" : undefined,
            }
          );
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (ENV_CONFIG.enableApiLogging) {
          console.error(
            `❌ API Error: ${error.response?.status} ${originalRequest?.url}`,
            {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
            }
          );
        }

        // Handle 401 Unauthorized or 403 with "Token expired" - attempt token refresh
        const isTokenExpired =
          error.response?.status === 401 ||
          (error.response?.status === 403 &&
            error.response?.data?.message === "Token expired");

        if (isTokenExpired && !originalRequest._retry) {
          originalRequest._retry = true;

          if (ENV_CONFIG.enableApiLogging) {
            console.log(
              `🔄 Received ${error.response?.status} (token expired), attempting token refresh...`
            );
          }

          try {
            // Attempt to refresh token
            const newToken = await this.refreshToken();
            if (newToken) {
              if (ENV_CONFIG.enableApiLogging) {
                console.log(
                  "✅ Token refreshed successfully, retrying request"
                );
              }
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client.request(originalRequest);
            } else {
              // Token refresh returned null, clear token
              await this.clearAuthToken();
              if (ENV_CONFIG.enableApiLogging) {
                console.error("❌ Token refresh returned null");
              }
              error.message = "Session expired. Please log in again.";
            }
          } catch (refreshError) {
            // Token refresh failed, clear token and let auth context handle redirect
            await this.clearAuthToken();
            if (ENV_CONFIG.enableApiLogging) {
              console.error("❌ Token refresh failed:", refreshError);
            }
            // Modify error message to be more user-friendly
            error.message = "Authentication failed. Please log in again.";
          }
        }

        // Enhanced network error handling
        if (!error.response) {
          error.isNetworkError = true;
          if (!this.isOnline) {
            error.message =
              "No internet connection. Please check your network and try again.";
          } else {
            error.message = "Network error occurred. Please try again.";
          }
        }

        // Add retry information to error
        if (
          error.response?.status >= 500 ||
          error.response?.status === 408 ||
          error.response?.status === 429
        ) {
          error.isRetryable = true;
          error.retryAfter = error.response?.data?.meta?.retryAfter || 5;
        }

        return Promise.reject(error);
      }
    );
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false;
      if (ENV_CONFIG.enableApiLogging) {
        console.log(
          "Network status changed:",
          this.isOnline ? "Online" : "Offline"
        );
      }
    });
  }

  // Generic request method with enhanced retry logic
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>(config);
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "GET", url });
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "DELETE", url });
  }

  // Network status
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // Get current auth token
  async getAuthToken(): Promise<string | null> {
    try {
      let token: string | null = null;

      if (Platform.OS === "web") {
        // Use localStorage for web
        token = localStorage.getItem("auth_token");
      } else {
        // Use SecureStore for native
        if (SecureStore && typeof SecureStore.getItemAsync === "function") {
          token = await SecureStore.getItemAsync("auth_token");
        } else {
          console.warn("SecureStore not available");
          return null;
        }
      }

      // Additional validation - check if token is not empty
      if (token && token.trim().length === 0) {
        console.warn("Retrieved empty token, treating as null");
        return null;
      }

      return token;
    } catch (error) {
      console.warn("Failed to retrieve auth token:", error);
      return null;
    }
  }

  // Set auth token
  async setAuthToken(token: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        // Use localStorage for web
        localStorage.setItem("auth_token", token);
      } else {
        // Use SecureStore for native
        if (SecureStore && typeof SecureStore.setItemAsync === "function") {
          await SecureStore.setItemAsync("auth_token", token);
        } else {
          throw new Error("SecureStore not available");
        }
      }
    } catch (error) {
      console.error("Failed to store auth token:", error);
      throw error;
    }
  }

  // Clear auth token
  async clearAuthToken(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        // Use localStorage for web
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_refresh_token");
      } else {
        // Use SecureStore for native
        if (SecureStore && typeof SecureStore.deleteItemAsync === "function") {
          await SecureStore.deleteItemAsync("auth_token");
          await SecureStore.deleteItemAsync("auth_refresh_token");
        }
      }
    } catch (error) {
      console.warn("Failed to clear auth token:", error);
    }
  }

  // Get current refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      let token: string | null = null;
      if (Platform.OS === "web") {
        token = localStorage.getItem("auth_refresh_token");
      } else {
        if (SecureStore && typeof SecureStore.getItemAsync === "function") {
          token = await SecureStore.getItemAsync("auth_refresh_token");
        }
      }
      return token && token.trim().length > 0 ? token : null;
    } catch {
      return null;
    }
  }

  // Set refresh token
  async setRefreshToken(token: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("auth_refresh_token", token);
      } else {
        if (SecureStore && typeof SecureStore.setItemAsync === "function") {
          await SecureStore.setItemAsync("auth_refresh_token", token);
        }
      }
    } catch (error) {
      console.error("Failed to store refresh token:", error);
    }
  }

  // Refresh authentication token
  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const currentRefreshToken = await this.getRefreshToken();
      if (!currentRefreshToken) {
        return null;
      }

      // Make refresh request without interceptors to avoid infinite loop
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/mobile/auth/refresh`,
        { refreshToken: currentRefreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: API_CONFIG.TIMEOUT,
        }
      );

      if (response.data?.success && response.data?.data?.token) {
        const newToken = response.data.data.token;
        const newRefreshToken = response.data.data.refreshToken;
        await this.setAuthToken(newToken);
        if (newRefreshToken) {
          await this.setRefreshToken(newRefreshToken);
        }
        return newToken;
      }

      return null;
    } catch (error) {
      if (ENV_CONFIG.enableApiLogging) {
        console.error("Token refresh failed:", error);
      }
      return null;
    }
  }

  // Enhanced retry logic with exponential backoff
  private async requestWithRetry<T>(
    config: AxiosRequestConfig,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error: any) {
      // Enhanced retry decision logic
      const shouldRetry = this.shouldRetryRequest(error, retryCount);

      if (shouldRetry) {
        // Calculate delay with jitter to prevent thundering herd
        const baseDelay = ENV_CONFIG.retryDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const delay = baseDelay + jitter;

        if (ENV_CONFIG.enableApiLogging) {
          console.log(
            `Retrying request (attempt ${retryCount + 1}/${ENV_CONFIG.retryAttempts
            }) after ${Math.round(delay)}ms`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry<T>(config, retryCount + 1);
      }

      // Add additional error context
      error.retryCount = retryCount;
      error.maxRetries = ENV_CONFIG.retryAttempts;

      throw error;
    }
  }

  // Enhanced retry decision logic
  private shouldRetryRequest(error: any, retryCount: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (retryCount >= ENV_CONFIG.retryAttempts) {
      return false;
    }

    // Always retry network errors
    if (
      error.isNetworkError ||
      error.code === "NETWORK_ERROR" ||
      !error.response
    ) {
      return true;
    }

    // Retry specific HTTP status codes
    const status = error.response?.status;
    if (status) {
      // Retry server errors (5xx)
      if (status >= 500) {
        return true;
      }

      // Retry specific client errors
      if (status === 408 || status === 429) {
        // Timeout or rate limit
        return true;
      }

      // Don't retry other 4xx errors (auth, validation, etc.)
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    return false;
  }

  // Utility methods for common operations

  /**
   * Check if the client is currently online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get the current API base URL
   */
  getBaseUrl(): string {
    return API_CONFIG.BASE_URL;
  }

  /**
   * Check if a token refresh is currently in progress
   */
  isTokenRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Manually trigger a token refresh
   */
  async forceTokenRefresh(): Promise<boolean> {
    try {
      const newToken = await this.refreshToken();
      return !!newToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get request configuration with auth header
   */
  async getAuthConfig(): Promise<{ headers: { Authorization: string } } | {}> {
    const token = await this.getAuthToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
