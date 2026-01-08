"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, ScrollView, RefreshControl, StyleSheet, AppState, AppStateStatus } from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useRefresh } from "../contexts/RefreshContext"
import { notificationsApi } from "../api/notifications"
import type { Notification } from "../types/notifications"
import { messageRepliesApi } from "../api/messageReplies"
import { NotificationCard } from "../components/NotificationCard"
import { NotificationDetailDialog } from "../components/NotificationDetailDialog"
import { EmptyState } from "../components/EmptyState"
import { NotificationCardSkeleton } from "../components/SkeletonLoader"

const POLLING_INTERVAL = 30000

export default function NotificationsDashboard() {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { refreshTrigger } = useRefresh()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [dialogVisible, setDialogVisible] = useState(false)
    const appState = useRef(AppState.currentState)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const containerStyle = {
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    }

    useEffect(() => {
        fetchNotifications()

        const subscription = AppState.addEventListener("change", handleAppStateChange)

        startPolling()

        return () => {
            subscription.remove()
            stopPolling()
        }
    }, [])

    useEffect(() => {
        if (refreshTrigger > 0) {
            refreshDashboard()
        }
    }, [refreshTrigger])

    const startPolling = () => {
        stopPolling()
        pollingIntervalRef.current = setInterval(() => {
            if (appState.current === "active") {
                fetchNotifications()
            }
        }, POLLING_INTERVAL)
    }

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            refreshDashboard()
            startPolling()
        } else if (nextAppState.match(/inactive|background/)) {
            stopPolling()
        }
        appState.current = nextAppState
    }

    const fetchNotifications = async () => {
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
    }

    const refreshDashboard = useCallback(() => {
        fetchNotifications()
    }, [])

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchNotifications()
    }, [])

    const handleCardClick = (notification: Notification) => {
        setSelectedNotification(notification)
        setDialogVisible(true)
    }

    const handleCloseDialog = () => {
        setDialogVisible(false)
        setSelectedNotification(null)
        refreshDashboard()
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
        } catch (error: any) {
            console.error("Failed to mark as read:", error)
            refreshDashboard()
            throw error
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
                    onAction={fetchNotifications}
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
                        onRefresh={handleRefresh}
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
