/**
 * Network Status Hook
 * Custom hook for monitoring network connectivity and providing offline indicators
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  refresh: () => Promise<void>;
  onNetworkChange: (callback: (status: NetworkStatus) => void) => () => void;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnected: true,
    connectionType: null,
    isInternetReachable: null,
  });

  const updateNetworkStatus = useCallback((state: NetInfoState) => {
    const status: NetworkStatus = {
      isOnline: state.isConnected ?? false,
      isConnected: state.isConnected ?? false,
      connectionType: state.type,
      isInternetReachable: state.isInternetReachable,
    };
    
    setNetworkStatus(status);
  }, []);

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(updateNetworkStatus);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);

    return unsubscribe;
  }, [updateNetworkStatus]);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    updateNetworkStatus(state);
  }, [updateNetworkStatus]);

  const onNetworkChange = useCallback((callback: (status: NetworkStatus) => void) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const status: NetworkStatus = {
        isOnline: state.isConnected ?? false,
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      };
      callback(status);
    });

    return unsubscribe;
  }, []);

  return {
    ...networkStatus,
    refresh,
    onNetworkChange,
  };
};

/**
 * Simple online/offline hook
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return isOnline;
};

/**
 * Hook for detecting when network comes back online
 */
export const useNetworkRecovery = (onRecovery?: () => void) => {
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected ?? false;
      
      if (isOnline && wasOffline) {
        // Network recovered
        setWasOffline(false);
        onRecovery?.();
      } else if (!isOnline && !wasOffline) {
        // Network lost
        setWasOffline(true);
      }
    });

    return unsubscribe;
  }, [wasOffline, onRecovery]);

  return wasOffline;
};