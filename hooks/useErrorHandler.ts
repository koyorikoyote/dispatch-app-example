/**
 * Error Handler Hook
 * Custom hook for consistent error management across the app
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '../types/api';
import { ENV_CONFIG } from '../config/api';
import { ErrorHandler, ProcessedError } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: string | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (err: any, customMessage?: string) => void;
  clearError: () => void;
  showErrorAlert: (err: any, customMessage?: string) => void;
  retryOperation: (operation: () => Promise<any>, options?: RetryOptions) => Promise<any>;
}

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: any, retryCount: number, maxRetries: number) => boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getErrorMessage = useCallback((err: any, customMessage?: string): string => {
    if (customMessage) {
      return customMessage;
    }

    const processedError = ErrorHandler.processError(err);
    return processedError.message;
  }, []);

  const handleError = useCallback((err: any, customMessage?: string) => {
    const processedError = ErrorHandler.processError(err);
    const message = customMessage || processedError.message;
    setError(message);

    // Log error for debugging
    ErrorHandler.logError(err, 'useErrorHandler');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);

    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const showErrorAlert = useCallback((err: any, customMessage?: string) => {
    const message = getErrorMessage(err, customMessage);

    Alert.alert('Error', message, [
      { text: 'OK', onPress: clearError }
    ]);
  }, [getErrorMessage, clearError]);

  const shouldRetry = useCallback((error: any, currentRetryCount: number, maxRetries: number): boolean => {
    if (currentRetryCount >= maxRetries) {
      return false;
    }

    const processedError = ErrorHandler.processError(error);
    return processedError.isRetryable;
  }, []);

  const retryOperation = useCallback(async (
    operation: () => Promise<any>,
    options: RetryOptions = {}
  ): Promise<any> => {
    const {
      maxRetries = ENV_CONFIG.retryAttempts,
      delay = ENV_CONFIG.retryDelay,
      exponentialBackoff = true,
      retryCondition = shouldRetry
    } = options;

    let lastError: any;
    let currentRetryCount = 0;

    setIsRetrying(false);
    setRetryCount(0);

    while (currentRetryCount <= maxRetries) {
      try {
        // Clear error state on successful retry
        if (currentRetryCount > 0) {
          setError(null);
        }

        const result = await operation();

        // Success - clear retry state
        setIsRetrying(false);
        setRetryCount(0);

        return result;
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (currentRetryCount < maxRetries && retryCondition(error, currentRetryCount, maxRetries)) {
          currentRetryCount++;
          setRetryCount(currentRetryCount);
          setIsRetrying(true);

          // Calculate delay with exponential backoff
          const processedError = ErrorHandler.processError(error);
          const retryDelay = exponentialBackoff
            ? ErrorHandler.getRetryDelay(processedError, currentRetryCount - 1)
            : delay;

          // Check network status before retrying
          const networkState = await NetInfo.fetch();
          if (!networkState.isConnected) {
            // Wait for network to come back online
            await new Promise((resolve) => {
              const unsubscribe = NetInfo.addEventListener((state) => {
                if (state.isConnected) {
                  unsubscribe();
                  resolve(void 0);
                }
              });
            });
          }

          // Wait before retrying
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, retryDelay);
          });

          if (ENV_CONFIG.enableApiLogging) {
            console.log(`Retrying operation (attempt ${currentRetryCount}/${maxRetries}) after ${retryDelay}ms`);
          }
        } else {
          // No more retries or shouldn't retry
          setIsRetrying(false);
          handleError(error);
          throw error;
        }
      }
    }

    // If we get here, all retries failed
    setIsRetrying(false);
    handleError(lastError);
    throw lastError;
  }, [shouldRetry, handleError]);

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    showErrorAlert,
    retryOperation,
  };
};

/**
 * Network-specific error handler with enhanced offline detection
 */
export const useNetworkErrorHandler = () => {
  const { handleError, showErrorAlert, retryOperation, ...rest } = useErrorHandler();
  const [isOffline, setIsOffline] = useState(false);

  // Monitor network status
  useState(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    return unsubscribe;
  });

  const handleNetworkError = useCallback((err: any, customMessage?: string) => {
    if (isOffline || err?.isNetworkError || err?.code === 'NETWORK_ERROR') {
      const message = customMessage || 'No internet connection. Please check your network and try again.';
      handleError(err, message);
    } else {
      handleError(err, customMessage);
    }
  }, [handleError, isOffline]);

  const showNetworkErrorAlert = useCallback((err: any, customMessage?: string) => {
    if (isOffline || err?.isNetworkError || err?.code === 'NETWORK_ERROR') {
      const message = customMessage || 'No internet connection. Please check your network and try again.';
      showErrorAlert(err, message);
    } else {
      showErrorAlert(err, customMessage);
    }
  }, [showErrorAlert, isOffline]);

  const retryWithNetworkCheck = useCallback(async (
    operation: () => Promise<any>,
    options: RetryOptions = {}
  ) => {
    // Enhanced retry that waits for network connectivity
    return retryOperation(operation, {
      ...options,
      retryCondition: (error: any, retryCount: number, maxRetries: number) => {
        // Always retry network errors if we have retries left
        if (error?.isNetworkError || error?.code === 'NETWORK_ERROR' || isOffline) {
          return retryCount < maxRetries;
        }

        // Use default retry logic for other errors
        return options.retryCondition ?
          options.retryCondition(error, retryCount, maxRetries) :
          retryCount < maxRetries && (error?.response?.status >= 500 || !error?.response);
      }
    });
  }, [retryOperation, isOffline]);

  return {
    ...rest,
    isOffline,
    handleError: handleNetworkError,
    showErrorAlert: showNetworkErrorAlert,
    retryOperation: retryWithNetworkCheck,
  };
};

/**
 * Hook for handling API operation errors with automatic retry
 */
export const useApiErrorHandler = () => {
  const { retryOperation, ...errorHandler } = useNetworkErrorHandler();

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      showAlert?: boolean;
      customMessage?: string;
      maxRetries?: number;
    }
  ): Promise<T> => {
    const { showAlert = false, customMessage, maxRetries } = options || {};

    try {
      return await retryOperation(operation, { maxRetries });
    } catch (error) {
      if (showAlert) {
        errorHandler.showErrorAlert(error, customMessage);
      } else {
        errorHandler.handleError(error, customMessage);
      }
      throw error;
    }
  }, [retryOperation, errorHandler]);

  return {
    ...errorHandler,
    executeWithRetry,
  };
};