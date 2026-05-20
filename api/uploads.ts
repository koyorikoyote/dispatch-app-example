/**
 * Uploads API
 * File upload via server-side backend (Google Drive storage)
 */

import { apiClient } from "./client";

export interface UploadResponse {
  publicUrl: string;
  key: string;
}

export interface UploadRequest {
  scope?: "submission" | "comment";
  refId?: number;
  keyHint?: string;
}

export const uploadsApi = {
  /**
   * Upload a file through the backend to Google Drive.
   * Returns the public view URL and a key identifier.
   */
  async uploadFile(
    file: Blob,
    contentType: string,
    options?: UploadRequest
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.scope) formData.append("scope", options.scope);
    if (options?.refId != null) formData.append("refId", String(options.refId));
    if (options?.keyHint) formData.append("keyHint", options.keyHint);

    const token = await apiClient.getAuthToken();
    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(
      `${apiClient.getBaseUrl()}/mobile/uploads/presign`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error("Failed to upload file");
    }

    return result.data as UploadResponse;
  },
};
