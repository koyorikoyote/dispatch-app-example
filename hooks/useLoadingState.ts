/**
 * Loading State Hook
 * Custom hook for managing loading states across different operations
 */

import { useState, useCallback } from 'react';

interface UseLoadingStateReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(operation: () => Promise<T>) => Promise<T>;
}

export const useLoadingState = (initialLoading = false): UseLoadingStateReturn => {
  const [loading, setLoading] = useState(initialLoading);

  const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      const result = await operation();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading,
  };
};

/**
 * Multiple loading states hook for managing different operations
 */
interface UseMultipleLoadingStatesReturn {
  loadingStates: Record<string, boolean>;
  setLoadingState: (key: string, loading: boolean) => void;
  isAnyLoading: boolean;
  withLoading: <T>(key: string, operation: () => Promise<T>) => Promise<T>;
}

export const useMultipleLoadingStates = (): UseMultipleLoadingStatesReturn => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoadingState = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  const withLoading = useCallback(async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
    try {
      setLoadingState(key, true);
      const result = await operation();
      return result;
    } finally {
      setLoadingState(key, false);
    }
  }, [setLoadingState]);

  return {
    loadingStates,
    setLoadingState,
    isAnyLoading,
    withLoading,
  };
};

/**
 * Enhanced loading state hook with UI feedback integration
 */
interface UseUILoadingStateReturn extends UseLoadingStateReturn {
  isInitialLoading: boolean;
  isRefreshing: boolean;
  setInitialLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  withInitialLoading: <T>(operation: () => Promise<T>) => Promise<T>;
  withRefresh: <T>(operation: () => Promise<T>) => Promise<T>;
}

export const useUILoadingState = (initialLoading = false): UseUILoadingStateReturn => {
  const [loading, setLoading] = useState(initialLoading);
  const [isInitialLoading, setInitialLoading] = useState(initialLoading);
  const [isRefreshing, setRefreshing] = useState(false);

  const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      const result = await operation();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const withInitialLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      setInitialLoading(true);
      setLoading(true);
      const result = await operation();
      return result;
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, []);

  const withRefresh = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      setRefreshing(true);
      const result = await operation();
      return result;
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    loading,
    isInitialLoading,
    isRefreshing,
    setLoading,
    setInitialLoading,
    setRefreshing,
    withLoading,
    withInitialLoading,
    withRefresh,
  };
};