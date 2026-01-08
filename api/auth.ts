/**
 * Authentication API Methods
 * Typed API methods for authentication endpoints
 */

import { apiClient } from './client';
import { LoginRequest, LoginResponse, LogoutRequest, ApiResponse } from '../types/api';
import { ENDPOINTS } from '../config/api';

export const authApi = {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const resp = await apiClient.post<ApiResponse<LoginResponse>>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    if (!resp.success || !resp.data?.token) {
      throw new Error(resp.error || 'Login failed');
    }
    
    // Store the token automatically
    await apiClient.setAuthToken(resp.data.token);
    
    return resp.data;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const token = await apiClient.getAuthToken();
    if (!token) {
      return; // Already logged out
    }

    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { token });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear the token
      await apiClient.clearAuthToken();
    }
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<LoginResponse> {
    const resp = await apiClient.post<ApiResponse<LoginResponse>>(
      ENDPOINTS.AUTH.REFRESH
    );
    
    if (!resp.success || !resp.data?.token) {
      throw new Error(resp.error || 'Token refresh failed');
    }
    
    // Update stored token
    await apiClient.setAuthToken(resp.data.token);
    
    return resp.data;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getAuthToken();
    return !!token;
  },
};
