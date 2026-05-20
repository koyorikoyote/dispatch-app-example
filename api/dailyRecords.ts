/**
 * Daily Records API
 * API methods for daily record management
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  DailyRecord,
  CreateDailyRecordRequest,
  UpdateDailyRecordRequest,
} from "../types/records";

export type { DailyRecord, CreateDailyRecordRequest, UpdateDailyRecordRequest };

export const dailyRecordsApi = {
  /**
   * Get list of daily records
   */
  async getDailyRecords(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<DailyRecord>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<DailyRecord>>
    >("/mobile/daily-records", { params });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch daily records");
    }

    return response.data;
  },

  /**
   * Get a single daily record by ID
   */
  async getDailyRecord(id: number): Promise<DailyRecord> {
    const response = await apiClient.get<ApiResponse<DailyRecord>>(
      `/mobile/daily-records/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch daily record");
    }

    return response.data;
  },

  /**
   * Create a new daily record
   */
  async createDailyRecord(
    data: CreateDailyRecordRequest
  ): Promise<DailyRecord> {
    const response = await apiClient.post<ApiResponse<DailyRecord>>(
      "/mobile/daily-records",
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to create daily record");
    }

    return response.data;
  },

  /**
   * Update an existing daily record
   */
  async updateDailyRecord(
    id: number,
    data: UpdateDailyRecordRequest
  ): Promise<DailyRecord> {
    const response = await apiClient.put<ApiResponse<DailyRecord>>(
      `/mobile/daily-records/${id}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to update daily record");
    }

    return response.data;
  },

  /**
   * Delete a daily record
   */
  async deleteDailyRecord(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(
      `/mobile/daily-records/${id}`
    );

    if (!response.success) {
      throw new Error("Failed to delete daily record");
    }
  },
};
