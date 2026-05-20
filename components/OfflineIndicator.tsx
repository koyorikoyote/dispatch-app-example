/**
 * Offline Indicator Component
 * Shows offline status and provides user feedback when network is unavailable
 */

import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface OfflineIndicatorProps {
  style?: any;
  showDuration?: boolean;
  onPress?: () => void;
}

export function OfflineIndicator({ 
  style, 
  showDuration = true, 
  onPress 
}: OfflineIndicatorProps) {
  const { isOffline, getOfflineMessage } = useOfflineMode();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (isOffline) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, fadeAnim]);

  if (!isOffline) {
    return null;
  }

  const containerStyle = [
    styles.container,
    {
      backgroundColor: isDarkMode ? '#d32f2f' : '#f44336',
    },
    style,
  ];

  const textStyle = [
    styles.text,
    {
      color: '#fff',
    },
  ];

  const message = showDuration ? getOfflineMessage() : t('network.offline');

  const content = (
    <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={textStyle}>{message}</Text>
      {onPress && (
        <Ionicons name="refresh-outline" size={16} color="#fff" />
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/**
 * Banner-style offline indicator for full-width display
 */
export function OfflineBanner({ onRetry }: { onRetry?: () => void }) {
  const { isOffline, getOfflineMessage } = useOfflineMode();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[
      styles.banner,
      { backgroundColor: isDarkMode ? '#d32f2f' : '#f44336' }
    ]}>
      <View style={styles.bannerContent}>
        <Ionicons name="cloud-offline-outline" size={20} color="#fff" />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>{t('network.offline')}</Text>
          <Text style={styles.bannerSubtitle}>{getOfflineMessage()}</Text>
        </View>
      </View>
      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.retryText}>{t('common.actions.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Compact offline indicator for status bars
 */
export function OfflineStatusDot() {
  const { isOffline } = useOfflineMode();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.statusDot}>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    gap: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
});