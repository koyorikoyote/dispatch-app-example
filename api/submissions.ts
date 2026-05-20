/**
 * Submissions API
 * API methods for fetching staff-related submissions
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type { SubmissionRecord, SubmissionsParams } from "../types/records";
import { ApiCache, generateCacheKey } from "../utils/apiCache";

export const submissionsApi = {
  /**
   * Fetch submissions for the current user
   */
  async fetchSubmissions(
    params?: SubmissionsParams,
    useCache: boolean = true
  ): Promise<PaginatedResponse<SubmissionRecord>> {
    const enhancedParams = { ...params };
    const cacheKey = generateCacheKey("/mobile/submissions", enhancedParams);

    if (useCache) {
      const cached = await ApiCache.get<PaginatedResponse<SubmissionRecord>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<SubmissionRecord>>
    >("/mobile/submissions", { params: enhancedParams });

    if (!response.success) {
      throw new Error("Failed to fetch submissions");
    }

    // Handle both nested { data: [], pagination: {} } and flat { data: [], pagination: {} } responses safely
    const actualData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    const actualPagination = (response as any).pagination || response.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    const result: PaginatedResponse<SubmissionRecord> = {
      data: actualData,
      pagination: actualPagination,
    };

    await ApiCache.set(cacheKey, result);

    return result;
  },

  /**
   * Invalidate submissions cache
   */
  async invalidateCache(): Promise<void> {
    await ApiCache.invalidatePattern("/mobile/submissions");
  },
};
