/**
 * API Configuration
 * Centralized configuration for API endpoints and environment settings
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

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

  // Dynamic host detection for development (Emulators/Devices)
  if (isDev) {
    // Check if running on an Emulator/Simulator
    if (!Device.isDevice) {
      if (Platform.OS === 'android') {
        return "http://10.0.2.2:3000/api";
      }
      if (Platform.OS === 'ios') {
        return "http://localhost:3000/api";
      }
    }

    // Physical Device: Get the host URI (LAN IP of the machine running the Expo server)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(":")[0];
      return `http://${ip}:3001/api`; // Use port 3001 (Direct Backend)
    }

    // Default Fallbacks if detection fails or hostUri is missing
    if (Platform.OS === 'android') {
      return "http://10.0.2.2:3001/api"; // Use port 3001 (Direct Backend)
    }

    // Fallback for web/iOS — hit the API server directly on :3001 rather
    // than going through the manager-app's webpack-dev-server proxy on :3000.
    // The dev-server proxy was buffering SSE responses, so events never
    // reached the dispatch-app even though the connection authenticated.
    // CORS in dev mode is permissive, so a direct connection just works.
    return "http://localhost:3001/api";
  }

  // Production URL
  return "https://d3h9gio6m7s97q.cloudfront.net/api";
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
    CHANGE_PASSWORD: "/mobile/auth/change-password",
    WEBAUTHN_STATUS: "/mobile/auth/webauthn/status",
    WEBAUTHN_REGISTER_START: "/mobile/auth/webauthn/register/start",
    WEBAUTHN_REGISTER_FINISH: "/mobile/auth/webauthn/register/finish",
    WEBAUTHN_LOGIN_START: "/mobile/auth/webauthn/login/start",
    WEBAUTHN_LOGIN_FINISH: "/mobile/auth/webauthn/login/finish",
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
