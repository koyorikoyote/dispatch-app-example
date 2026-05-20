import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEventStream } from '../contexts/EventStreamContext';
import { notificationsApi } from '../api/notifications';
import { styles } from '../styles/globalStyles';

interface NotificationBellProps {
  onPress: () => void;
}

export interface NotificationBellRef {
  updateUnreadCount: (count: number) => void;
  refreshCount: () => Promise<void>;
}

export const NotificationBell = forwardRef<NotificationBellRef, NotificationBellProps>(
  ({ onPress }, ref) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { isDarkMode } = useTheme();
    const { t } = useLanguage();
    const { on: subscribeStream } = useEventStream();

    // Theme-aware icon color
    const iconColor = isDarkMode ? "#fff" : "#333";

    // Initial load. Real-time updates flow through the SSE subscription
    // below, so no polling interval is needed — every reply create/update/
    // delete or mark-read on the server pushes an event within the same tick.
    useEffect(() => {
      loadUnreadCount();
    }, []);

    // Listen for any event that could change unread state and re-fetch.
    // Re-fetch (rather than incrementing locally) keeps the badge in sync
    // with the canonical fetchNotificationsForUser() result, which honours
    // the same isRead / repliesIdArray rules the bell displays.
    useEffect(() => {
      const unsubReply = subscribeStream("reply-changed", () => {
        void loadUnreadCount();
      });
      const unsubRead = subscribeStream("reply-read", () => {
        void loadUnreadCount();
      });
      return () => {
        unsubReply();
        unsubRead();
      };
    }, [subscribeStream]);

    const loadUnreadCount = async () => {
      if (isLoading) return;
      
      try {
        setIsLoading(true);
        const count = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.warn('Failed to load notification count:', error);
        // Don't show error to user for background polling
      } finally {
        setIsLoading(false);
      }
    };

    // Update unread count when notifications are read
    const updateUnreadCount = (newCount: number) => {
      setUnreadCount(newCount);
    };

    // Expose update function to parent components
    useImperativeHandle(ref, () => ({
      updateUnreadCount,
      refreshCount: loadUnreadCount,
    }));

    return (
      <TouchableOpacity 
        style={styles.notificationButton} 
        onPress={onPress}
        accessibilityLabel={t('notifications.title')}
        accessibilityHint={unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.noNotifications')}
      >
        <Ionicons 
          name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
          size={24} 
          color={iconColor} 
        />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
);