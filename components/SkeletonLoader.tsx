"use client"

import React, { useEffect, useRef } from "react"
import { View, Animated, StyleSheet } from "react-native"
import { useTheme } from "../contexts/ThemeContext"

interface SkeletonLoaderProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style
}: SkeletonLoaderProps) {
  const { isDarkMode } = useTheme()
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Skip animation in test environment
    if (process.env.NODE_ENV === 'test') {
      return
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [animatedValue])

  // Use static colors in test environment
  const staticBackgroundColor = isDarkMode ? "#2d2d2e" : "#e0e0e0"

  if (process.env.NODE_ENV === 'test') {
    return (
      <View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: staticBackgroundColor,
          },
          style,
        ]}
      />
    )
  }

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: isDarkMode
      ? ["#2d2d2e", "#3d3d3e"]
      : ["#e0e0e0", "#f0f0f0"],
  })

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  )
}

// Skeleton components for specific UI elements
export function UserCardSkeleton() {
  const { isDarkMode } = useTheme()

  const cardStyle = {
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  }

  return (
    <View style={cardStyle}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonLoader width="60%" height={16} />
        <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
      </View>
      <SkeletonLoader width={20} height={20} borderRadius={10} />
    </View>
  )
}

export function NotificationCardSkeleton() {
  const { isDarkMode } = useTheme()

  const cardStyle = {
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  }

  return (
    <View style={cardStyle}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonStatusRow}>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
          <SkeletonLoader width={120} height={16} style={{ marginLeft: 8 }} />
        </View>
        <SkeletonLoader width={60} height={12} />
      </View>

      <View style={styles.skeletonContent}>
        <SkeletonLoader width="100%" height={14} />
        <SkeletonLoader width="80%" height={14} style={{ marginTop: 4 }} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <SkeletonLoader width={8} height={8} borderRadius={4} />
        <SkeletonLoader width={100} height={12} style={{ marginLeft: 8 }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonInfo: {
    marginBottom: 12,
  },
  skeletonInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  skeletonContent: {
    marginTop: 8,
  },
})