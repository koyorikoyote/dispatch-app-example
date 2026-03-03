"use client"

import { useEffect } from "react"
import { useRouter } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { styles } from "../styles/globalStyles"
import { SwipeablePages } from "../components/SwipeablePages"
import NotificationsDashboard from "./notifications"
import SubmissionsPage from "./submissions"

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()
  const { isDarkMode } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login")
      }
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ff4500" />
      </View>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff" }}>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? "#2d2d2e" : "#e5e7eb",
          paddingBottom: 4,
          paddingHorizontal: 16,
        }}
      />
      <SwipeablePages initialPage="notifications">
        <SubmissionsPage />
        <NotificationsDashboard />
      </SwipeablePages>
    </View>
  )
}
