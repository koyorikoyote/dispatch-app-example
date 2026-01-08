/**
 * API Type Definitions
 * TypeScript interfaces for API requests and responses
 */

// Common API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
  deviceInfo?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
    userTypeLevel: number;
    hourlyRate?: number;
  };
  expiresAt: string;
}

export interface LogoutRequest {
  token: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  userTypeLevel?: number;
  hourlyRate?: number;
  departmentId?: number;
  phone?: string;
  address?: string;
  joinDate?: string;
  status: string;
  languagePreference: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchParams extends PaginationParams {
  query?: string;
  q?: string; // For search endpoint compatibility
  role?: string;
  status?: string;
}

// Record response types
export interface RecordCreateResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SearchResponse<T = any> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Company types
export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  id: number;
}

export interface CompanySearchParams extends PaginationParams {
  query?: string;
  status?: "ACTIVE" | "INACTIVE";
}

// Notification types
export interface Notification {
  id: number;
  userId: number;
  alertMessage: string;
  markedRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationUnreadCountResponse {
  count: number;
}

export interface MarkNotificationReadRequest {
  id: number;
}

export interface NotificationSearchParams extends PaginationParams {
  unreadOnly?: boolean;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  isNetworkError?: boolean;
}
