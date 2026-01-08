/**
 * Companies API Methods
 * Typed API methods for company management endpoints
 */

import { apiClient } from './client';
import {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanySearchParams,
  PaginatedResponse,
  ApiResponse,
} from '../types/api';
import { ENDPOINTS } from '../config/api';

export const companiesApi = {
  /**
   * Get paginated list of companies with optional search and filtering
   */
  async getCompanies(params?: CompanySearchParams): Promise<PaginatedResponse<Company>> {
    const response = await apiClient.get<any>(
      ENDPOINTS.COMPANIES.LIST,
      { params }
    );
    
    // Handle different response formats from backend
    if (response.success === false) {
      throw new Error(response.error || 'Failed to fetch companies');
    }
    
    // Backend returns: { success: true, data: [...], pagination: {...} }
    // We need to return: { data: [...], pagination: {...} }
    if (response.success && response.data && response.pagination) {
      return {
        data: response.data,
        pagination: response.pagination
      };
    }
    
    // If response has pagination field directly (direct response)
    if (response.data && response.pagination) {
      return response;
    }
    
    // Fallback - assume response is the data directly
    return response;
  },

  /**
   * Search companies by name or other criteria
   */
  async searchCompanies(query: string, params?: Omit<CompanySearchParams, 'query'>): Promise<PaginatedResponse<Company>> {
    return this.getCompanies({ ...params, query });
  },

  /**
   * Get a single company by ID
   */
  async getCompany(id: number): Promise<Company> {
    const response = await apiClient.get<ApiResponse<Company>>(
      ENDPOINTS.COMPANIES.UPDATE(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch company');
    }
    
    return response.data;
  },

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await apiClient.post<ApiResponse<Company>>(
      ENDPOINTS.COMPANIES.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create company');
    }
    
    return response.data;
  },

  /**
   * Update an existing company
   */
  async updateCompany(id: number, data: Partial<CreateCompanyRequest>): Promise<Company> {
    const response = await apiClient.put<ApiResponse<Company>>(
      ENDPOINTS.COMPANIES.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update company');
    }
    
    return response.data;
  },

  /**
   * Delete a company
   */
  async deleteCompany(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      ENDPOINTS.COMPANIES.DELETE(id)
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete company');
    }
  },

  /**
   * Get active companies only
   */
  async getActiveCompanies(params?: Omit<CompanySearchParams, 'status'>): Promise<PaginatedResponse<Company>> {
    return this.getCompanies({ ...params, status: 'ACTIVE' });
  },

  /**
   * Get all companies (no pagination) - useful for dropdowns
   */
  async getAllCompanies(): Promise<Company[]> {
    try {
      const response = await this.getCompanies({ limit: 1000 }); // Large limit to get all
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch all companies:', error);
      return []; // Return empty array on error
    }
  },
};