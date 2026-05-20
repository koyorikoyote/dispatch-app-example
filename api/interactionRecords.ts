/**
 * Interaction Records API
 * API methods for interaction record management
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  InteractionRecord,
  CreateInteractionRecordRequest,
  UpdateInteractionRecordRequest,
} from "../types/records";

export type {
  InteractionRecord,
  CreateInteractionRecordRequest,
  UpdateInteractionRecordRequest,
};

export const interactionRecordsApi = {
  /**
   * Get list of interaction records
   */
  async getInteractionRecords(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InteractionRecord>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<InteractionRecord>>
    >("/mobile/interaction-records", { params });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch interaction records");
    }

    return response.data;
  },

  /**
   * Get a single interaction record by ID
   */
  async getInteractionRecord(id: number): Promise<InteractionRecord> {
    const response = await apiClient.get<ApiResponse<InteractionRecord>>(
      `/mobile/interaction-records/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch interaction record");
    }

    return response.data;
  },

  /**
   * Create a new interaction record
   */
  async createInteractionRecord(
    data: CreateInteractionRecordRequest
  ): Promise<InteractionRecord> {
    const response = await apiClient.post<ApiResponse<InteractionRecord>>(
      "/mobile/interaction-records",
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to create interaction record");
    }

    return response.data;
  },

  /**
   * Update an existing interaction record
   */
  async updateInteractionRecord(
    id: number,
    data: UpdateInteractionRecordRequest
  ): Promise<InteractionRecord> {
    const response = await apiClient.put<ApiResponse<InteractionRecord>>(
      `/mobile/interaction-records/${id}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to update interaction record");
    }

    return response.data;
  },

  /**
   * Delete an interaction record
   */
  async deleteInteractionRecord(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      `/mobile/interaction-records/${id}`
    );

    if (!response.success) {
      throw new Error("Failed to delete interaction record");
    }
  },
};
