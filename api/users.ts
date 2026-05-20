/**
 * Users API Methods
 * Typed API methods for user management endpoints
 */

import { apiClient } from './client';
import {
  User,
  UserSearchParams,
  PaginatedResponse,
  ApiResponse,
} from '../types/api';
import { ENDPOINTS } from '../config/api';

export const usersApi = {
  /**
   * Get paginated list of users with optional search and filtering
   */
  async getUsers(params?: UserSearchParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<any>(
      ENDPOINTS.USERS.LIST,
      { params }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch users');
    }
    
    // Backend returns: { success: true, data: [...], pagination: {...} }
    // We need to return: { data: [...], pagination: {...} }
    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: response.pagination
      };
    }
    
    // Fallback for other response formats
    return response.data || response;
  },

  /**
   * Search users by query string
   */
  async searchUsers(query: string, params?: Omit<UserSearchParams, 'query'>): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<any>(
      ENDPOINTS.USERS.SEARCH,
      { 
        params: {
          ...params,
          q: query,
        }
      }
    );
    
    // The response format is: { success: true, data: [...], pagination: {...} }
    if (!response.success) {
      throw new Error(response.error || 'Failed to search users');
    }
    
    return {
      data: response.data || [],
      pagination: response.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  },

  /**
   * Get a single user by ID
   */
  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      ENDPOINTS.USERS.PROFILE(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      '/users/me'
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch current user');
    }
    
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      ENDPOINTS.USERS.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update user');
    }
    
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateCurrentUser(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      '/users/me',
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update profile');
    }
    
    return response.data;
  },

  /**
   * Get users by role
   */
  async getUsersByRole(role: string, params?: Omit<UserSearchParams, 'role'>): Promise<PaginatedResponse<User>> {
    return this.getUsers({ ...params, role });
  },

  /**
   * Get active users only
   */
  async getActiveUsers(params?: Omit<UserSearchParams, 'status'>): Promise<PaginatedResponse<User>> {
    return this.getUsers({ ...params, status: 'ACTIVE' });
  },
};