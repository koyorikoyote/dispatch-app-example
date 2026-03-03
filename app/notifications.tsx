"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, ScrollView, RefreshControl, StyleSheet, AppState, AppStateStatus } from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useRefresh } from "../contexts/RefreshContext"
import { useAuth } from "../contexts/AuthContext"
import { notificationsApi } from "../api/notifications"
import { connectNotificationStream } from "../api/notificationStream"
import type { Notification } from "../types/notifications"
import { messageRepliesApi } from "../api/messageReplies"
import { NotificationCard } from "../components/NotificationCard"
import { NotificationDetailDialog } from "../components/NotificationDetailDialog"
import { EmptyState } from "../components/EmptyState"
import { NotificationCardSkeleton } from "../components/SkeletonLoader"

export default function NotificationsDashboard() {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { refreshTrigger } = useRefresh()
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [dialogVisible, setDialogVisible] = useState(false)
    const appState = useRef(AppState.currentState)
    const disconnectRef = useRef<(() => void) | null>(null)

    const containerStyle = {
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    }

    // Load initial data via REST — always works in React Native
    const fetchInitial = useCallback(async () => {
        try {
            setError(null)
            const data = await notificationsApi.fetchNotifications()
            setNotifications(data)
        } catch (err: any) {
            setError(err.message || t("notifications.failedToLoad"))
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [t])

    // Attach SSE stream for live background updates (best-effort; degrades silently)
    const attachStream = useCallback(() => {
        if (disconnectRef.current) {
            disconnectRef.current()
            disconnectRef.current = null
        }

        const { disconnect } = connectNotificationStream(
            (event) => {
                if (event.type === "snapshot" || event.type === "update") {
                    setNotifications(event.notifications ?? [])
                }
            },
            (_err) => {
                // SSE unavailable — REST + pull-to-refresh still works
            }
        )

        disconnectRef.current = disconnect
    }, [])

    const stopStream = useCallback(() => {
        if (disconnectRef.current) {
            disconnectRef.current()
            disconnectRef.current = null
        }
    }, [])

    useEffect(() => {
        if (user?.id) {
            setLoading(true)
            // Step 1: immediate REST load to clear loading state
            fetchInitial().then(() => {
                // Step 2: layer SSE on top for live updates
                attachStream()
            })
        } else {
            setNotifications([])
            stopStream()
        }

        const subscription = AppState.addEventListener("change", handleAppStateChange)

        return () => {
            subscription.remove()
            stopStream()
        }
    }, [user?.id])

    useEffect(() => {
        if (refreshTrigger > 0) {
            handlePullRefresh()
        }
    }, [refreshTrigger])

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            fetchInitial().then(() => attachStream())
        } else if (nextAppState.match(/inactive|background/)) {
            stopStream()
        }
        appState.current = nextAppState
    }

    const handlePullRefresh = useCallback(async () => {
        setRefreshing(true)
        await fetchInitial()
        attachStream()
    }, [fetchInitial, attachStream])

    const handleCardClick = (notification: Notification) => {
        setSelectedNotification(notification)
        setDialogVisible(true)
    }

    const handleCloseDialog = () => {
        setDialogVisible(false)
        setSelectedNotification(null)
    }

    const handleMarkAsRead = async (messageReplyId: number) => {
        if (!selectedNotification) return

        setNotifications((prev) =>
            prev.filter(
                (n) =>
                    !(
                        n.tableName === selectedNotification.tableName &&
                        n.recordId === selectedNotification.recordId
                    )
            )
        )

        try {
            await messageRepliesApi.markAsRead(messageReplyId)
        } catch (err: any) {
            console.error("Failed to mark as read:", err)
            fetchInitial()
            throw err
        }
    }

    if (loading) {
        return (
            <View style={containerStyle}>
                <View style={styles.scrollView}>
                    <NotificationCardSkeleton />
                    <NotificationCardSkeleton />
                    <NotificationCardSkeleton />
                    <NotificationCardSkeleton />
                    <NotificationCardSkeleton />
                </View>
            </View>
        )
    }

    if (error) {
        return (
            <View style={containerStyle}>
                <EmptyState
                    icon="alert-circle-outline"
                    title={t("common.status.error")}
                    message={error}
                    actionText={t("common.actions.retry")}
                    onAction={fetchInitial}
                />
            </View>
        )
    }

    if (notifications.length === 0) {
        return (
            <View style={containerStyle}>
                <EmptyState
                    icon="notifications-outline"
                    title={t("notifications.noNotifications")}
                    message={t("notifications.emptyStateMessage")}
                />
            </View>
        )
    }

    return (
        <View style={containerStyle}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handlePullRefresh}
                        tintColor="#ff4500"
                        colors={["#ff4500"]}
                    />
                }
            >
                {notifications.map((notification) => (
                    <NotificationCard
                        key={`${notification.tableName}-${notification.recordId}`}
                        notification={notification}
                        onPress={handleCardClick}
                    />
                ))}
            </ScrollView>

            <NotificationDetailDialog
                notification={selectedNotification}
                visible={dialogVisible}
                onClose={handleCloseDialog}
                onMarkAsRead={handleMarkAsRead}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 16,
        paddingBottom: 80,
    },
})
