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
  async logout(refreshToken?: string): Promise<void> {
    const token = await apiClient.getAuthToken();
    if (!token && !refreshToken) {
      return; // Already logged out
    }

    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear the token
      await apiClient.clearAuthToken();
    }
  },

  /**
   * Change current user's password
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    try {
      const resp = await apiClient.post<ApiResponse<void>>(
        ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data
      );

      if (!resp.success) {
        throw new Error(resp.error || 'Failed to change password');
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const resp = await apiClient.post<ApiResponse<LoginResponse>>(
      ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
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
