/**
 * Offline Mode Hook
 * Enhanced hook for offline mode detection and UI feedback
 */

import { useState, useEffect, useCallback, useRef } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Alert } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";

interface OfflineModeState {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  wasOffline: boolean;
  offlineDuration: number; // in seconds
}

interface UseOfflineModeReturn extends OfflineModeState {
  showOfflineAlert: () => void;
  showOnlineAlert: () => void;
  onNetworkRestore: (callback: () => void) => () => void;
  getOfflineMessage: () => string;
}

export const useOfflineMode = (): UseOfflineModeReturn => {
  const { t } = useLanguage();
  const [networkState, setNetworkState] = useState<OfflineModeState>({
    isOnline: true,
    isOffline: false,
    connectionType: null,
    isInternetReachable: null,
    wasOffline: false,
    offlineDuration: 0,
  });

  const offlineStartTime = useRef<Date | null>(null);
  const offlineDurationInterval = useRef<NodeJS.Timeout | null>(null);
  const networkRestoreCallbacks = useRef<Set<() => void>>(new Set());

  const updateNetworkState = useCallback((state: NetInfoState) => {
    const isOnline = state.isConnected ?? false;
    const isOffline = !isOnline;

    setNetworkState((prev) => {
      const wasOffline = prev.isOffline;

      // Track offline duration
      if (isOffline && !wasOffline) {
        // Just went offline
        offlineStartTime.current = new Date();

        // Start tracking offline duration
        offlineDurationInterval.current = setInterval(() => {
          if (offlineStartTime.current) {
            const duration = Math.floor(
              (Date.now() - offlineStartTime.current.getTime()) / 1000
            );
            setNetworkState((current) => ({
              ...current,
              offlineDuration: duration,
            }));
          }
        }, 1000);
      } else if (isOnline && wasOffline) {
        // Just came back online
        offlineStartTime.current = null;

        // Clear offline duration tracking
        if (offlineDurationInterval.current) {
          clearInterval(offlineDurationInterval.current);
          offlineDurationInterval.current = null;
        }

        // Execute network restore callbacks
        networkRestoreCallbacks.current.forEach((callback) => {
          try {
            callback();
          } catch (error) {
            console.error("Network restore callback error:", error);
          }
        });
      }

      return {
        isOnline,
        isOffline,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
        wasOffline,
        offlineDuration: isOffline ? prev.offlineDuration : 0,
      };
    });
  }, []);

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(updateNetworkState);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    return () => {
      unsubscribe();

      // Cleanup offline duration tracking
      if (offlineDurationInterval.current) {
        clearInterval(offlineDurationInterval.current);
      }
    };
  }, [updateNetworkState]);

  const showOfflineAlert = useCallback(() => {
    Alert.alert(
      t("network.noConnectionTitle"),
      t("network.noConnectionMessage"),
      [{ text: t("common.actions.ok") }]
    );
  }, [t]);

  const showOnlineAlert = useCallback(() => {
    Alert.alert(
      t("network.connectionRestoredTitle"),
      t("network.connectionRestoredMessage"),
      [{ text: t("common.actions.ok") }]
    );
  }, [t]);

  const onNetworkRestore = useCallback((callback: () => void) => {
    networkRestoreCallbacks.current.add(callback);

    // Return cleanup function
    return () => {
      networkRestoreCallbacks.current.delete(callback);
    };
  }, []);

  const getOfflineMessage = useCallback(() => {
    if (!networkState.isOffline) {
      return "";
    }

    const { offlineDuration, connectionType } = networkState;

    if (offlineDuration < 60) {
      return t("network.offline");
    } else if (offlineDuration < 3600) {
      const minutes = Math.floor(offlineDuration / 60);
      return `${t("network.offline")} ${minutes} minute${
        minutes > 1 ? "s" : ""
      }`;
    } else {
      const hours = Math.floor(offlineDuration / 3600);
      const minutes = Math.floor((offlineDuration % 3600) / 60);
      return `${t("network.offline")} ${hours}h ${minutes}m`;
    }
  }, [networkState, t]);

  return {
    ...networkState,
    showOfflineAlert,
    showOnlineAlert,
    onNetworkRestore,
    getOfflineMessage,
  };
};

/**
 * Simple hook for components that only need online/offline status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return isOnline;
};

/**
 * Hook for detecting network recovery with callback
 */
export const useNetworkRecovery = (onRecovery?: () => void) => {
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
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

  return { wasOffline, isRecovering: !wasOffline };
};

/**
 * Hook for showing offline indicators in UI
 */
export const useOfflineIndicator = () => {
  const { isOffline, getOfflineMessage } = useOfflineMode();

  return {
    shouldShowIndicator: isOffline,
    indicatorMessage: getOfflineMessage(),
    indicatorColor: "#f44336", // Red color for offline indicator
  };
};
