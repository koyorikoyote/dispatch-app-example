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

  // ── WebAuthn (Passkey) Methods ─────────────────────────────────────

  /**
   * Check if current user has a passkey registered
   */
  async webauthnStatus(): Promise<{ hasPasskey: boolean; count: number }> {
    const resp = await apiClient.get<ApiResponse<{ hasPasskey: boolean; count: number }>>(
      ENDPOINTS.AUTH.WEBAUTHN_STATUS
    );
    if (!resp.success || !resp.data) {
      throw new Error(resp.error || 'Failed to check passkey status');
    }
    return resp.data;
  },

  /**
   * Start passkey registration
   */
  async webauthnRegisterStart(): Promise<{ challengeToken: string; options: any }> {
    const resp = await apiClient.post<ApiResponse<{ challengeToken: string; options: any }>>(
      ENDPOINTS.AUTH.WEBAUTHN_REGISTER_START
    );
    if (!resp.success || !resp.data) {
      throw new Error(resp.error || 'Failed to start passkey registration');
    }
    return resp.data;
  },

  /**
   * Finish passkey registration
   */
  async webauthnRegisterFinish(challengeToken: string, credential: any): Promise<void> {
    const resp = await apiClient.post<ApiResponse<void>>(
      ENDPOINTS.AUTH.WEBAUTHN_REGISTER_FINISH,
      { challengeToken, credential }
    );
    if (!resp.success) {
      throw new Error(resp.error || 'Failed to register passkey');
    }
  },

  /**
   * Start passkey login (no auth required)
   */
  async webauthnLoginStart(): Promise<{ challengeToken: string; options: any }> {
    const resp = await apiClient.post<ApiResponse<{ challengeToken: string; options: any }>>(
      ENDPOINTS.AUTH.WEBAUTHN_LOGIN_START
    );
    if (!resp.success || !resp.data) {
      throw new Error(resp.error || 'Failed to start passkey login');
    }
    return resp.data;
  },

  /**
   * Finish passkey login (no auth required)
   */
  async webauthnLoginFinish(challengeToken: string, credential: any): Promise<LoginResponse> {
    const resp = await apiClient.post<ApiResponse<LoginResponse>>(
      ENDPOINTS.AUTH.WEBAUTHN_LOGIN_FINISH,
      { challengeToken, credential }
    );
    if (!resp.success || !resp.data?.token) {
      throw new Error(resp.error || 'Passkey login failed');
    }
    await apiClient.setAuthToken(resp.data.token);
    return resp.data;
  },
};
