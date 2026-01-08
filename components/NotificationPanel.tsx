import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { notificationsApi } from '../api/notifications';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { styles } from '../styles/globalStyles';
import type { Notification } from '../types/notifications';

const { width, height } = Dimensions.get('window');

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationPanel({ visible, onClose, onUnreadCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();

  // Theme-aware colors
  const backgroundColor = isDarkMode ? '#1a1a1b' : '#ffffff';
  const textColor = isDarkMode ? '#fff' : '#333';
  const iconColor = isDarkMode ? '#fff' : '#333';

  // Load notifications when panel opens
  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async (isRefresh = false) => {
    if (!isOnline) {
      setError(t('notifications.offlineNotifications'));
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await notificationsApi.getNotifications({
        page: 1,
        limit: 50, // Load recent notifications
      });

      setNotifications(response.notifications);

      // Update unread count
      const unreadCount = response.notifications.filter(n => !n.markedRead).length;
      onUnreadCountChange?.(unreadCount);

    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(t('notifications.failedToLoad'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!isOnline || notification.markedRead) return;

    try {
      const success = await notificationsApi.markAsRead(notification.id);
      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? { ...n, markedRead: true }
              : n
          )
        );

        // Update unread count
        const newUnreadCount = notifications.filter(n =>
          n.id !== notification.id && !n.markedRead
        ).length;
        onUnreadCountChange?.(newUnreadCount);
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      Alert.alert(t('common.status.error'), t('notifications.failedToMarkRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!isOnline) return;

    const unreadNotifications = notifications.filter(n => !n.markedRead);
    if (unreadNotifications.length === 0) return;

    try {
      const success = await notificationsApi.markAllAsRead();
      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, markedRead: true }))
        );

        // Update unread count to 0
        onUnreadCountChange?.(0);

        Alert.alert(t('common.status.success'), t('notifications.allNotificationsRead'));
      }
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      Alert.alert(t('common.status.error'), t('notifications.failedToMarkRead'));
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    Alert.alert(
      t('notifications.deleteNotification'),
      t('common.actions.confirm'),
      [
        { text: t('common.actions.cancel'), style: 'cancel' },
        {
          text: t('common.actions.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await notificationsApi.deleteNotification(notification.id);
              if (success) {
                // Update local state
                setNotifications(prev => prev.filter(n => n.id !== notification.id));

                // Update unread count if deleted notification was unread
                if (!notification.markedRead) {
                  const newUnreadCount = notifications.filter(n =>
                    n.id !== notification.id && !n.markedRead
                  ).length;
                  onUnreadCountChange?.(newUnreadCount);
                }
              }
            } catch (err: any) {
              console.error('Failed to delete notification:', err);
              Alert.alert(t('common.status.error'), t('notifications.failedToDelete'));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return t('common.status.recent', { defaultValue: 'Just now' });
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        notificationItemStyles.container,
        { backgroundColor: isDarkMode ? '#2d2d2e' : '#f5f5f5' },
        !item.markedRead && { borderLeftColor: '#ff4500', borderLeftWidth: 4 }
      ]}
      onPress={() => handleMarkAsRead(item)}
      activeOpacity={0.7}
    >
      <View style={notificationItemStyles.content}>
        <View style={notificationItemStyles.header}>
          <View style={[
            notificationItemStyles.statusDot,
            { backgroundColor: item.markedRead ? '#666' : '#ff4500' }
          ]} />
          <Text style={[notificationItemStyles.date, { color: isDarkMode ? '#666' : '#999' }]}>
            {formatDate(item.createdAt)}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteNotification(item)}
            style={notificationItemStyles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={isDarkMode ? '#666' : '#999'} />
          </TouchableOpacity>
        </View>

        <Text style={[
          notificationItemStyles.message,
          { color: textColor },
          !item.markedRead && { fontWeight: '600' }
        ]}>
          {item.alertMessage}
        </Text>

        {!item.markedRead && (
          <TouchableOpacity
            onPress={() => handleMarkAsRead(item)}
            style={notificationItemStyles.markReadButton}
          >
            <Text style={notificationItemStyles.markReadText}>
              {t('notifications.markAsRead')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (error) {
      return (
        <EmptyState
          icon="alert-circle-outline"
          title={t('common.status.error')}
          message={error}
          actionText={t('common.actions.retry')}
          onAction={() => loadNotifications()}
        />
      );
    }

    return (
      <EmptyState
        icon="notifications-outline"
        title={t('notifications.noNotifications')}
        message={t('notifications.noNotifications')}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[panelStyles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[panelStyles.header, { borderBottomColor: isDarkMode ? '#333' : '#e0e0e0' }]}>
          <Text style={[panelStyles.title, { color: textColor }]}>
            {t('notifications.title')}
          </Text>

          <View style={panelStyles.headerActions}>
            {notifications.some(n => !n.markedRead) && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={panelStyles.markAllButton}
                disabled={!isOnline}
              >
                <Text style={[
                  panelStyles.markAllText,
                  { color: isOnline ? '#ff4500' : '#666' }
                ]}>
                  {t('notifications.markAllAsRead')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={panelStyles.closeButton}>
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={panelStyles.content}>
          {isLoading ? (
            <LoadingSpinner message={t('notifications.loadingNotifications')} />
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => loadNotifications(true)}
                  tintColor={isDarkMode ? '#fff' : '#333'}
                />
              }
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                notifications.length === 0 ? panelStyles.emptyContent : undefined
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// Styles for the notification panel
const panelStyles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  markAllButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};

// Styles for notification items
const notificationItemStyles = {
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  markReadButton: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ff4500',
    borderRadius: 4,
  },
  markReadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
};