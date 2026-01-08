/**
 * API Index
 * Central export point for all API methods and client
 */

export { apiClient, ApiClient } from "./client";
export { authApi } from "./auth";
export { usersApi } from "./users";
export { companiesApi } from "./companies";
export { notificationsApi } from "./notifications";
export { inquiriesApi } from "./inquiries";
export { dailyRecordsApi } from "./dailyRecords";
export { interactionRecordsApi } from "./interactionRecords";
export { complaintDetailsApi } from "./complaintDetails";
export { messageRepliesApi } from "./messageReplies";
export { searchApi } from "./search";
export { submissionsApi } from "./submissions";
export { documentsApi } from "./documents";
export { uploadsApi } from "./uploads";

// Re-export types for convenience
export * from "../types/api";
export * from "../config/api";

// Import all APIs
import { authApi } from "./auth";
import { usersApi } from "./users";
import { companiesApi } from "./companies";
import { notificationsApi } from "./notifications";
import { inquiriesApi } from "./inquiries";
import { dailyRecordsApi } from "./dailyRecords";
import { interactionRecordsApi } from "./interactionRecords";
import { complaintDetailsApi } from "./complaintDetails";
import { messageRepliesApi } from "./messageReplies";
import { searchApi } from "./search";
import { submissionsApi } from "./submissions";
import { documentsApi } from "./documents";
import { uploadsApi } from "./uploads";

// Combined API object for easy access
export const api = {
  auth: authApi,
  users: usersApi,
  companies: companiesApi,
  notifications: notificationsApi,
  inquiries: inquiriesApi,
  dailyRecords: dailyRecordsApi,
  interactionRecords: interactionRecordsApi,
  complaintDetails: complaintDetailsApi,
  messageReplies: messageRepliesApi,
  search: searchApi,
  submissions: submissionsApi,
  documents: documentsApi,
  uploads: uploadsApi,
} as const;

// Default export for convenience
export default api;
