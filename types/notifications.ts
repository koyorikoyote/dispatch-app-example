/**
 * Notification Type Definitions
 * TypeScript interfaces for notification-related data
 */

import type {
  InquiryRecord,
  DailyRecord,
  InteractionRecord,
  ComplaintDetail,
} from "./records";

export interface Notification {
  id: number;
  tableName:
    | "inquiries"
    | "daily_record"
    | "interaction_records"
    | "complaint_details";
  recordId: number;
  updatedAt: string;
  lastMessage: string;
  recordData: InquiryRecord | DailyRecord | InteractionRecord | ComplaintDetail;
  messageReplyId: number;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}
