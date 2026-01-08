/**
 * Documents API
 * API methods for fetching and searching documents
 */

import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type { Document, DocumentsParams } from "../types/records";
import { ApiCache, generateCacheKey } from "../utils/apiCache";

export const documentsApi = {
  /**
   * Fetch all documents
   */
  async fetchDocuments(
    params?: DocumentsParams,
    useCache: boolean = true
  ): Promise<PaginatedResponse<Document>> {
    const cacheKey = generateCacheKey("/mobile/documents", params);

    // Try to get from cache first
    if (useCache) {
      const cached = await ApiCache.get<PaginatedResponse<Document>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Document>>
    >("/mobile/documents", { params });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch documents");
    }

    // Cache the response
    await ApiCache.set(cacheKey, response.data);

    return response.data;
  },

  /**
   * Search documents by keyword
   */
  async searchDocuments(
    query: string,
    params?: Omit<DocumentsParams, "q">,
    useCache: boolean = true
  ): Promise<PaginatedResponse<Document>> {
    const fullParams = { ...params, q: query };
    const cacheKey = generateCacheKey("/mobile/documents", fullParams);

    // Try to get from cache first
    if (useCache) {
      const cached = await ApiCache.get<PaginatedResponse<Document>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Document>>
    >("/mobile/documents", { params: fullParams });

    if (!response.success || !response.data) {
      throw new Error("Failed to search documents");
    }

    // Cache the response
    await ApiCache.set(cacheKey, response.data);

    return response.data;
  },

  /**
   * Invalidate documents cache
   */
  async invalidateCache(): Promise<void> {
    await ApiCache.invalidatePattern("/mobile/documents");
  },
};
