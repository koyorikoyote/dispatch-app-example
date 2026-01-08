/**
 * Inquiries API
 * API methods for inquiry record management
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  InquiryRecord,
  CreateInquiryRequest,
  UpdateInquiryRequest,
} from "../types/records";

export type { InquiryRecord, CreateInquiryRequest, UpdateInquiryRequest };

export const inquiriesApi = {
  /**
   * Get list of inquiries
   */
  async getInquiries(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InquiryRecord>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<InquiryRecord>>
    >("/mobile/inquiries", { params });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch inquiries");
    }

    return response.data;
  },

  /**
   * Get a single inquiry by ID
   */
  async getInquiry(id: number): Promise<InquiryRecord> {
    const response = await apiClient.get<ApiResponse<InquiryRecord>>(
      `/mobile/inquiries/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch inquiry");
    }

    return response.data;
  },

  /**
   * Create a new inquiry
   */
  async createInquiry(data: CreateInquiryRequest): Promise<InquiryRecord> {
    const response = await apiClient.post<ApiResponse<InquiryRecord>>(
      "/mobile/inquiries",
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to create inquiry");
    }

    return response.data;
  },

  /**
   * Update an existing inquiry
   */
  async updateInquiry(
    id: number,
    data: UpdateInquiryRequest
  ): Promise<InquiryRecord> {
    const response = await apiClient.put<ApiResponse<InquiryRecord>>(
      `/mobile/inquiries/${id}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to update inquiry");
    }

    return response.data;
  },

  /**
   * Delete an inquiry
   */
  async deleteInquiry(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      `/mobile/inquiries/${id}`
    );

    if (!response.success) {
      throw new Error("Failed to delete inquiry");
    }
  },
};
