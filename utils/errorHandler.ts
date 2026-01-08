/**
 * Enhanced Error Handling Utilities
 * Centralized error processing and user-friendly message generation
 */

import { Alert } from 'react-native';
import { ApiError } from '../types/api';

export interface ProcessedError {
  message: string;
  code?: string;
  isRetryable: boolean;
  retryAfter?: number;
  isNetworkError: boolean;
  statusCode?: number;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

export class ErrorHandler {
  /**
   * Process any error into a standardized format
   */
  static processError(error: any): ProcessedError {
    // Network errors
    if (this.isNetworkError(error)) {
      return {
        message: 'No internet connection. Please check your network and try again.',
        code: 'NETWORK_ERROR',
        isRetryable: true,
        isNetworkError: true,
      };
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT_ERROR',
        isRetryable: true,
        isNetworkError: false,
        retryAfter: 5,
      };
    }

    // HTTP response errors
    if (error?.response) {
      return this.processHttpError(error);
    }

    // Generic errors
    return {
      message: error?.message || 'An unexpected error occurred. Please try again.',
      isRetryable: false,
      isNetworkError: false,
    };
  }

  /**
   * Process HTTP response errors
   */
  private static processHttpError(error: any): ProcessedError {
    const response = error.response;
    const statusCode = response?.status;
    const data = response?.data;

    const baseError: ProcessedError = {
      message: this.getHttpErrorMessage(statusCode, data),
      code: data?.code,
      statusCode,
      isRetryable: this.isRetryableStatus(statusCode),
      isNetworkError: false,
      retryAfter: data?.meta?.retryAfter,
    };

    // Handle validation errors
    if (statusCode === 400 && data?.meta?.validationErrors) {
      baseError.validationErrors = data.meta.validationErrors.map((err: any) => ({
        field: err.field,
        message: err.message,
      }));
      baseError.message = this.formatValidationErrors(baseError.validationErrors);
    }

    return baseError;
  }

  /**
   * Get user-friendly message for HTTP status codes
   */
  private static getHttpErrorMessage(statusCode: number, data?: any): string {
    // Use server-provided error message if available
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }

    // Fallback to status code messages
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 422:
        return 'Invalid data provided. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `Request failed with status ${statusCode}. Please try again.`;
    }
  }

  /**
   * Format validation errors into a readable message
   */
  private static formatValidationErrors(errors: Array<{ field: string; message: string }>): string {
    if (errors.length === 1) {
      return errors[0].message;
    }

    const errorList = errors.map(err => `• ${err.message}`).join('\n');
    return `Please fix the following issues:\n${errorList}`;
  }

  /**
   * Check if error is a network error
   */
  private static isNetworkError(error: any): boolean {
    return (
      error?.isNetworkError ||
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ENOTFOUND' ||
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('Network Error') ||
      !error?.response
    );
  }

  /**
   * Check if error is a timeout error
   */
  private static isTimeoutError(error: any): boolean {
    return (
      error?.code === 'ECONNABORTED' ||
      error?.message?.includes('timeout') ||
      error?.response?.status === 408
    );
  }

  /**
   * Check if HTTP status code is retryable
   */
  private static isRetryableStatus(statusCode: number): boolean {
    return (
      statusCode >= 500 || // Server errors
      statusCode === 408 || // Timeout
      statusCode === 429 || // Rate limit
      statusCode === 503    // Service unavailable
    );
  }

  /**
   * Show error alert to user
   */
  static showErrorAlert(
    error: any,
    title: string = 'Error',
    customMessage?: string,
    onRetry?: () => void
  ): void {
    const processedError = this.processError(error);
    const message = customMessage || processedError.message;

    const buttons: any[] = [{ text: 'OK' }];

    if (processedError.isRetryable && onRetry) {
      buttons.unshift({
        text: 'Retry',
        onPress: onRetry,
      });
    }

    Alert.alert(title, message, buttons);
  }

  /**
   * Show validation error alert
   */
  static showValidationAlert(
    validationErrors: Array<{ field: string; message: string }>,
    title: string = 'Validation Error'
  ): void {
    const message = this.formatValidationErrors(validationErrors);
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  /**
   * Get retry delay based on error
   */
  static getRetryDelay(error: ProcessedError, attempt: number): number {
    if (error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff: 1s, 2s, 4s, 8s
    return Math.min(1000 * Math.pow(2, attempt), 8000);
  }

  /**
   * Check if error should trigger logout
   */
  static shouldLogout(error: ProcessedError): boolean {
    return (
      error.statusCode === 401 ||
      error.code === 'TOKEN_EXPIRED' ||
      error.code === 'INVALID_TOKEN'
    );
  }

  /**
   * Get user-friendly offline message
   */
  static getOfflineMessage(duration?: number): string {
    if (!duration || duration < 60) {
      return 'You are offline. Some features may not be available.';
    } else if (duration < 3600) {
      const minutes = Math.floor(duration / 60);
      return `You have been offline for ${minutes} minute${minutes > 1 ? 's' : ''}. Please check your connection.`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `You have been offline for ${hours}h ${minutes}m. Please check your connection.`;
    }
  }

  /**
   * Log error for debugging (development only)
   */
  static logError(error: any, context?: string): void {
    if (__DEV__) {
      console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
      console.error('Original error:', error);
      console.error('Processed error:', this.processError(error));
      console.groupEnd();
    }
  }
}

/**
 * Hook for consistent error handling across components
 */
export const useErrorHandler = () => {
  const handleError = (
    error: any,
    context?: string,
    customMessage?: string,
    onRetry?: () => void
  ) => {
    ErrorHandler.logError(error, context);
    
    const processedError = ErrorHandler.processError(error);
    
    // Show alert for user-facing errors
    ErrorHandler.showErrorAlert(error, 'Error', customMessage, onRetry);
    
    return processedError;
  };

  const handleValidationError = (
    validationErrors: Array<{ field: string; message: string }>,
    title?: string
  ) => {
    ErrorHandler.showValidationAlert(validationErrors, title);
  };

  const shouldRetry = (error: any): boolean => {
    const processedError = ErrorHandler.processError(error);
    return processedError.isRetryable;
  };

  const shouldLogout = (error: any): boolean => {
    const processedError = ErrorHandler.processError(error);
    return ErrorHandler.shouldLogout(processedError);
  };

  return {
    handleError,
    handleValidationError,
    shouldRetry,
    shouldLogout,
    processError: ErrorHandler.processError,
  };
};