/**
 * Loading and Error State Components
 * Reusable components for handling loading, error, and empty states
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ErrorHandler } from '../../utils/errorHandler';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

/**
 * Loading state component with spinner and optional message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#2196f3',
  style,
}) => (
  <View style={[styles.centerContainer, style]}>
    <ActivityIndicator size={size} color={color} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

interface ErrorStateProps {
  error?: any;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showDetails?: boolean;
  style?: any;
}

/**
 * Error state component with retry functionality
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message,
  onRetry,
  retryText = 'Try Again',
  showDetails = false,
  style,
}) => {
  const processedError = error ? ErrorHandler.processError(error) : null;
  const displayMessage = message || processedError?.message || 'An error occurred';

  return (
    <View style={[styles.centerContainer, style]}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{displayMessage}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}

      {showDetails && processedError && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorDetailsTitle}>Error Details:</Text>
          <Text style={styles.errorDetailsText}>
            Code: {processedError.code || 'Unknown'}
          </Text>
          <Text style={styles.errorDetailsText}>
            Retryable: {processedError.isRetryable ? 'Yes' : 'No'}
          </Text>
          {processedError.statusCode && (
            <Text style={styles.errorDetailsText}>
              Status: {processedError.statusCode}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

/**
 * Empty state component for when there's no data
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There are no items to display.',
  icon = '📭',
  actionText,
  onAction,
  style,
}) => (
  <View style={[styles.centerContainer, style]}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    
    {actionText && onAction && (
      <TouchableOpacity style={styles.actionButton} onPress={onAction}>
        <Text style={styles.actionButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface NetworkErrorStateProps {
  onRetry?: () => void;
  isOffline?: boolean;
  style?: any;
}

/**
 * Network error state component
 */
export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({
  onRetry,
  isOffline = false,
  style,
}) => (
  <View style={[styles.centerContainer, style]}>
    <Text style={styles.networkIcon}>📡</Text>
    <Text style={styles.errorTitle}>
      {isOffline ? 'You are offline' : 'Connection problem'}
    </Text>
    <Text style={styles.errorMessage}>
      {isOffline
        ? 'Please check your internet connection and try again.'
        : 'Unable to connect to the server. Please try again.'}
    </Text>
    
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

/**
 * Full-screen loading overlay
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = false,
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, transparent && styles.transparentOverlay]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.overlayText}>{message}</Text>
      </View>
    </View>
  );
};

interface ConditionalWrapperProps {
  loading: boolean;
  error?: any;
  isEmpty?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * Wrapper component that conditionally renders loading, error, empty, or content
 */
export const ConditionalWrapper: React.FC<ConditionalWrapperProps> = ({
  loading,
  error,
  isEmpty = false,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  children,
}) => {
  if (loading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <LoadingState />
    );
  }

  if (error) {
    return errorComponent ? (
      <>{errorComponent}</>
    ) : (
      <ErrorState error={error} onRetry={onRetry} />
    );
  }

  if (isEmpty) {
    return emptyComponent ? (
      <>{emptyComponent}</>
    ) : (
      <EmptyState />
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    alignSelf: 'stretch',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  networkIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  transparentOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  overlayContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

/**
 * Hook for managing loading and error states
 */
export const useLoadingError = (initialLoading = false) => {
  const [loading, setLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<any>(null);

  const startLoading = React.useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setLoading(false);
  }, []);

  const setErrorState = React.useCallback((err: any) => {
    setLoading(false);
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setError: setErrorState,
    clearError,
    reset,
  };
};