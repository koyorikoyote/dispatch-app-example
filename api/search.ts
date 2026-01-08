/**
 * Search API
 * API methods for project-wide keyword search
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type { SearchResult, SearchParams } from "../types/records";
import { ApiCache, generateCacheKey } from "../utils/apiCache";

export const searchApi = {
  /**
   * Search across all record types with optional date range filtering
   */
  async search(
    params: SearchParams,
    useCache: boolean = true
  ): Promise<PaginatedResponse<SearchResult>> {
    const cacheKey = generateCacheKey("/mobile/search", params);

    // Try to get from cache first
    if (useCache) {
      const cached = await ApiCache.get<PaginatedResponse<SearchResult>>(
        cacheKey
      );
      if (cached) {
        return cached;
      }
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<SearchResult>>
    >("/mobile/search", { params });

    if (!response.success || !response.data) {
      throw new Error("Failed to perform search");
    }

    // Cache the response
    await ApiCache.set(cacheKey, response.data);

    return response.data;
  },

  /**
   * Invalidate search cache
   */
  async invalidateCache(): Promise<void> {
    await ApiCache.invalidatePattern("/mobile/search");
  },
};
