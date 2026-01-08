"use client"

import { useEffect } from "react"
import { useRouter } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { useAuth } from "../contexts/AuthContext"
import { styles } from "../styles/globalStyles"
import { SwipeablePages } from "../components/SwipeablePages"
import NotificationsDashboard from "./notifications"
import SubmissionsPage from "./submissions"

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()
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
    <SwipeablePages initialPage="notifications">
      <SubmissionsPage />
      <NotificationsDashboard />
    </SwipeablePages>
  )
}
