/**
 * API Configuration
 * Centralized configuration for API endpoints and environment settings
 */

import Constants from "expo-constants";

// Check if we're in development mode
const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV === "development";

// Get base URL from environment variables
const getBaseUrl = (): string => {
  // Try to get from expo-constants extra config
  const extraConfig = Constants.expoConfig?.extra;
  if (extraConfig?.DISPATCH_API_BASE_URL) {
    return extraConfig.DISPATCH_API_BASE_URL;
  }

  // Fallback to process.env
  if (process.env.DISPATCH_API_BASE_URL) {
    return process.env.DISPATCH_API_BASE_URL;
  }

  // Default fallback
  return isDev
    ? "http://localhost:3000/api"
    : "https://d3h9gio6m7s97q.cloudfront.net/api";
};

export const API_CONFIG = {
  // Base URL for API endpoints
  BASE_URL: getBaseUrl(),

  // Request timeout in milliseconds (increased for better reliability)
  TIMEOUT: 15000,

  // API version
  VERSION: "v1",

  // Common headers
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

export const ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "/mobile/auth/login",
    LOGOUT: "/mobile/auth/logout",
    REFRESH: "/mobile/auth/refresh",
  },

  // Submission endpoints
  SUBMISSIONS: {
    LIST: "/mobile/submissions",
    CREATE: "/mobile/submissions",
    UPDATE: (id: number) => `/mobile/submissions/${id}`,
    DELETE: (id: number) => `/mobile/submissions/${id}`,
    COMMENTS: (id: number) => `/mobile/submissions/${id}/comments`,
  },

  // User endpoints
  USERS: {
    LIST: "/mobile/users",
    PROFILE: (id: number) => `/mobile/users/${id}`,
    UPDATE: (id: number) => `/mobile/users/${id}`,
    SEARCH: "/mobile/users/search",
  },

  // Company endpoints
  COMPANIES: {
    LIST: "/mobile/companies",
    CREATE: "/mobile/companies",
    UPDATE: (id: number) => `/mobile/companies/${id}`,
    DELETE: (id: number) => `/mobile/companies/${id}`,
  },
} as const;

// Environment-specific settings
export const ENV_CONFIG = {
  isDevelopment: isDev,
  isProduction: !isDev,

  // Logging configuration
  enableApiLogging: isDev,
  enableErrorReporting: !isDev,

  // Network configuration (reduced to prevent overwhelming APIs)
  retryAttempts: process.env.NODE_ENV === "test" ? 0 : 2, // Disable retries in tests
  retryDelay: process.env.NODE_ENV === "test" ? 0 : 1500, // No delay in tests
} as const;
