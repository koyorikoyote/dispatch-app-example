/**
 * Message Replies API
 * API methods for marking message replies as read
 */

import { apiClient } from "./client";
import type { ApiResponse } from "../types/api";
import type { MessageReply } from "../types/records";

export const messageRepliesApi = {
  /**
   * Mark a message reply as read
   */
  async markAsRead(id: number): Promise<MessageReply> {
    const response = await apiClient.put<ApiResponse<MessageReply>>(
      `/mobile/message-replies/${id}/mark-read`
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to mark message as read");
    }

    return response.data;
  },
};
