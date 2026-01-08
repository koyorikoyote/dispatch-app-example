/**
 * Notifications API
 * API methods for fetching unread notifications
 */

import { apiClient } from "./client";
import type {
  Notification,
  NotificationsResponse,
} from "../types/notifications";

export const notificationsApi = {
  /**
   * Fetch unread notifications for the current user
   */
  async fetchNotifications(): Promise<Notification[]> {
    const response = await apiClient.get<NotificationsResponse>(
      "/mobile/notifications",
      { params: { type: "DISCUSSION" } }
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch notifications");
    }

    return response.data;
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<NotificationsResponse>(
      "/mobile/notifications",
      { params: { type: "DISCUSSION" } }
    );

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch notification count");
    }

    return response.data.length;
  },
};
