/**
 * Complaint Details API
 * API methods for complaint detail management
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  ComplaintDetail,
  CreateComplaintDetailRequest,
  UpdateComplaintDetailRequest,
} from "../types/records";

export type {
  ComplaintDetail,
  CreateComplaintDetailRequest,
  UpdateComplaintDetailRequest,
};

export const complaintDetailsApi = {
  /**
   * Get list of complaint details
   */
  async getComplaintDetails(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ComplaintDetail>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ComplaintDetail>>
    >("/mobile/complaint-details", { params });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch complaint details");
    }

    return response.data;
  },

  /**
   * Get a single complaint detail by ID
   */
  async getComplaintDetail(id: number): Promise<ComplaintDetail> {
    const response = await apiClient.get<ApiResponse<ComplaintDetail>>(
      `/mobile/complaint-details/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch complaint detail");
    }

    return response.data;
  },

  /**
   * Create a new complaint detail
   */
  async createComplaintDetail(
    data: CreateComplaintDetailRequest
  ): Promise<ComplaintDetail> {
    const response = await apiClient.post<ApiResponse<ComplaintDetail>>(
      "/mobile/complaint-details",
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to create complaint detail");
    }

    return response.data;
  },

  /**
   * Update an existing complaint detail
   */
  async updateComplaintDetail(
    id: number,
    data: UpdateComplaintDetailRequest
  ): Promise<ComplaintDetail> {
    const response = await apiClient.put<ApiResponse<ComplaintDetail>>(
      `/mobile/complaint-details/${id}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to update complaint detail");
    }

    return response.data;
  },

  /**
   * Delete a complaint detail
   */
  async deleteComplaintDetail(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      `/mobile/complaint-details/${id}`
    );

    if (!response.success) {
      throw new Error("Failed to delete complaint detail");
    }
  },
};
