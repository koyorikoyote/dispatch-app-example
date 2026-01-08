import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
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

    // Theme-aware icon color
    const iconColor = isDarkMode ? "#fff" : "#333";

    // Load unread count on component mount and set up polling
    useEffect(() => {
      loadUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }, []);

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