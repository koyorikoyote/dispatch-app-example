/**
 * Uploads API
 * API methods for file upload management
 */

import { apiClient } from "./client";
import type { ApiResponse } from "../types/api";

export interface PresignedUploadResponse {
  url: string;
  key: string;
  headers: Record<string, string>;
  publicUrl: string;
}

export interface PresignRequest {
  contentType: string;
  scope?: "submission" | "comment";
  refId?: number;
  keyHint?: string;
}

export const uploadsApi = {
  /**
   * Get presigned URL for direct S3 upload
   */
  async getPresignedUrl(
    data: PresignRequest
  ): Promise<PresignedUploadResponse> {
    const response = await apiClient.post<ApiResponse<PresignedUploadResponse>>(
      "/mobile/uploads/presign",
      data
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to get presigned URL");
    }

    return response.data;
  },

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadToS3(
    presignedUrl: string,
    file: Blob,
    contentType: string,
    headers: Record<string, string>
  ): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": contentType,
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to S3");
    }
  },
};
