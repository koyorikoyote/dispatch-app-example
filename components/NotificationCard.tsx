"use client"

import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import type { Notification } from "../types/notifications"
import { useLanguage } from "../contexts/LanguageContext"
import { useSwipe } from "../contexts/SwipeContext"

interface NotificationCardProps {
    notification: Notification
    onPress: (notification: Notification) => void
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { isSwipeInProgress } = useSwipe()

    const handlePress = () => {
        if (!isSwipeInProgress) {
            onPress(notification)
        }
    }

    const cardStyle = {
        ...styles.card,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    }

    const tableNameStyle = {
        ...styles.tableName,
        color: isDarkMode ? "#fff" : "#000",
    }

    const dateStyle = {
        ...styles.date,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const messageStyle = {
        ...styles.message,
        color: isDarkMode ? "#ccc" : "#333",
    }

    const getTableDisplayName = (tableName: string) => {
        switch (tableName) {
            case "inquiries":
                return t("forms.inquiry.title")
            case "daily_record":
                return t("forms.dailyRecord.title")
            case "interaction_records":
                return t("forms.interactionRecord.title")
            case "complaint_details":
                return t("forms.complaintDetail.title")
            default:
                return tableName
        }
    }

    const getTableIcon = (tableName: string) => {
        switch (tableName) {
            case "inquiries":
                return "help-circle-outline"
            case "daily_record":
                return "calendar-outline"
            case "interaction_records":
                return "people-outline"
            case "complaint_details":
                return "warning-outline"
            default:
                return "document-outline"
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return t("notifications.timeAgo.justNow")
        if (diffMins < 60) return t("notifications.timeAgo.minutesAgo", { count: diffMins })
        if (diffHours < 24) return t("notifications.timeAgo.hoursAgo", { count: diffHours })
        if (diffDays < 7) return t("notifications.timeAgo.daysAgo", { count: diffDays })

        return date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
        })
    }

    return (
        <TouchableOpacity style={cardStyle} onPress={handlePress}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons
                        name={getTableIcon(notification.tableName) as any}
                        size={20}
                        color="#ff4500"
                        style={styles.icon}
                    />
                    <Text style={tableNameStyle}>{getTableDisplayName(notification.tableName)}</Text>
                </View>
                <Text style={dateStyle}>{formatDate(notification.updatedAt)}</Text>
            </View>
            <Text style={messageStyle} numberOfLines={2}>
                {notification.lastMessage || t("notifications.noMessagePreview")}
            </Text>
            <View style={styles.footer}>
                <View style={styles.unreadIndicator} />
                <Text style={dateStyle}>{t("notifications.tapToViewDetails")}</Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    icon: {
        marginRight: 8,
    },
    tableName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    date: {
        fontSize: 12,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#ff4500",
        marginRight: 8,
    },
})
