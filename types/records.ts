/**
 * Record Type Definitions
 * TypeScript interfaces for inquiry, daily record, interaction record, and complaint detail data
 */

// Inquiry Record Types
export interface InquiryRecord {
  id: number;
  dateOfInquiry: string;
  inquirerName: string;
  inquirerContact?: string;
  companyId?: number;
  typeOfInquiry?: string;
  inquiryContent?: string;
  progressStatus?: string;
  responderId?: number;
  recorderId?: number;
  repliesIdArray?: number[];
  updatedAt: string;
  createdAt: string;
}

export interface CreateInquiryRequest {
  dateOfInquiry: string;
  inquirerName: string;
  inquirerContact?: string;
  companyId?: number;
  typeOfInquiry?: string;
  inquiryContent?: string;
  progressStatus?: string;
  responderId?: number;
  recorderId?: number;
}

export interface UpdateInquiryRequest extends Partial<CreateInquiryRequest> {}

// Daily Record Types
export interface DailyRecord {
  id: number;
  dateOfRecord: string;
  staffId?: number;
  conditionStatus?: string;
  feedbackContent?: string;
  contactNumber?: string;
  photo?: string;
  repliesIdArray?: number[];
  updatedAt: string;
  createdAt: string;
}

export interface CreateDailyRecordRequest {
  dateOfRecord?: string;
  conditionStatus: string;
  feedbackContent: string;
  contactNumber?: string;
  photo?: string;
}

export interface UpdateDailyRecordRequest
  extends Partial<CreateDailyRecordRequest> {}

// Interaction Record Types
export interface InteractionRecord {
  id: number;
  type?: string;
  date?: string;
  description?: string;
  status?: string;
  name?: string;
  title?: string;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  location?: string;
  means?: string;
  responseDetails?: string;
  companiesId?: number;
  repliesIdArray?: number[];
  updatedAt: string;
  createdAt: string;
}

export interface CreateInteractionRecordRequest {
  type?: string;
  date?: string;
  description?: string;
  status?: string;
  name?: string;
  title?: string;
  personInvolvedStaffId?: number;
  userInChargeId?: number;
  location?: string;
  means?: string;
  responseDetails?: string;
  companiesId?: number;
}

export interface UpdateInteractionRecordRequest
  extends Partial<CreateInteractionRecordRequest> {}

// Complaint Detail Types
export interface ComplaintDetail {
  id: number;
  dateOfOccurrence?: string;
  complainerName?: string;
  complainerContact?: string;
  personInvolved?: string;
  progressStatus?: string;
  urgencyLevel?: string;
  complaintContent?: string;
  responderId?: number;
  companyId?: number;
  recorderId?: number;
  repliesIdArray?: number[];
  updatedAt: string;
  createdAt: string;
}

export interface CreateComplaintDetailRequest {
  dateOfOccurrence?: string;
  complainerName?: string;
  complainerContact?: string;
  personInvolved?: string;
  progressStatus?: string;
  urgencyLevel?: string;
  complaintContent?: string;
  responderId?: number;
  companyId?: number;
  recorderId?: number;
}

export interface UpdateComplaintDetailRequest
  extends Partial<CreateComplaintDetailRequest> {}

// Message Reply Types
export interface MessageReply {
  id: number;
  toDatetime?: string;
  fromDatetime?: string;
  toMessage?: string;
  fromMessage?: string;
  userId?: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Search Result Types
export interface SearchResult {
  tableName: string;
  recordId: number;
  matchedFields: string[];
  preview: string;
  recordData: InquiryRecord | DailyRecord | InteractionRecord | ComplaintDetail;
}

export interface SearchParams {
  q: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Submission Record Types
export interface SubmissionRecord {
  id: number;
  tableName:
    | "inquiries"
    | "daily_record"
    | "interaction_records"
    | "complaint_details";
  recordId: number;
  createdAt: string;
  updatedAt: string;
  recordData: InquiryRecord | DailyRecord | InteractionRecord | ComplaintDetail;
  preview: string;
}

export interface SubmissionsParams {
  page?: number;
  limit?: number;
}

// Document Types
export interface Document {
  id: number;
  title: string;
  type: "STAFF" | "PROPERTY" | "COMPANY" | "MANUAL";
  relatedEntityId: string;
  filePath: string | null;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsParams {
  q?: string;
  page?: number;
  limit?: number;
}
