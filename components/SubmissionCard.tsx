"use client"

import { memo } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useSwipe } from "../contexts/SwipeContext"
import type { SubmissionRecord, InquiryRecord, DailyRecord, InteractionRecord, ComplaintDetail } from "../types/records"

interface SubmissionCardProps {
    submission: SubmissionRecord
    onPress: () => void
}

export const SubmissionCard = memo(function SubmissionCard({ submission, onPress }: SubmissionCardProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { isSwipeInProgress } = useSwipe()

    const handlePress = () => {
        if (!isSwipeInProgress) {
            onPress()
        }
    }

    const cardStyle = {
        ...styles.card,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    }

    const typeNameStyle = {
        ...styles.typeName,
        color: isDarkMode ? "#fff" : "#000",
    }

    const dateStyle = {
        ...styles.date,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const contentStyle = {
        ...styles.content,
        color: isDarkMode ? "#ccc" : "#333",
    }

    const statusStyle = (status: string) => ({
        ...styles.statusBadge,
        backgroundColor: getStatusColor(status, isDarkMode),
    })

    const dateBadgeStyle = {
        ...styles.dateBadge,
        backgroundColor: isDarkMode ? "#3b82f6" : "#60a5fa",
    }

    const getStatusBadge = () => {
        const { tableName, recordData } = submission

        if (tableName === "complaint_details") {
            const complaint = recordData as ComplaintDetail
            if (complaint.urgencyLevel) {
                const translationKey = `enums.urgencyLevel.${complaint.urgencyLevel}` as any
                return (
                    <View style={statusStyle(complaint.urgencyLevel)}>
                        <Text style={styles.statusText}>{t(translationKey)}</Text>
                    </View>
                )
            }
        }
        return null
    }

    const getResolutionDateBadge = () => {
        const { tableName, recordData } = submission

        if (tableName === "complaint_details") {
            const complaint = recordData as any
            if (complaint.resolutionDate) {
                const resolutionDateFormatted = formatDate(complaint.resolutionDate)
                return (
                    <View style={[styles.dateBadge, { backgroundColor: isDarkMode ? "#10b981" : "#34d399" }]}>
                        <Ionicons name="checkmark-done-outline" size={12} color="#fff" style={styles.badgeIcon} />
                        <Text style={styles.badgeText}>{resolutionDateFormatted}</Text>
                    </View>
                )
            }
        }
        return null
    }

    const getTypeDisplayName = (tableName: string) => {
        switch (tableName) {
            case "inquiries":
                return t("notifications.types.inquiries")
            case "daily_record":
                return t("notifications.types.daily_record")
            case "interaction_records":
                return t("notifications.types.interaction_records")
            case "complaint_details":
                return t("notifications.types.complaint_details")
            default:
                return tableName
        }
    }

    const getTypeIcon = (tableName: string) => {
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
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}/${month}/${day}`
    }

    const getRecordDate = (): string => {
        const { tableName, recordData } = submission

        switch (tableName) {
            case "inquiries":
                return (recordData as InquiryRecord).dateOfInquiry || submission.createdAt
            case "daily_record":
                return (recordData as DailyRecord).dateOfRecord || submission.createdAt
            case "interaction_records":
                return (recordData as InteractionRecord).date || submission.createdAt
            case "complaint_details":
                return (recordData as ComplaintDetail).dateOfOccurrence || submission.createdAt
            default:
                return submission.createdAt
        }
    }

    const getStatusColor = (status: string, isDark: boolean) => {
        const statusLower = status?.toLowerCase() || ""
        if (statusLower.includes("open") || statusLower.includes("pending")) {
            return isDark ? "#3b82f6" : "#60a5fa"
        }
        if (statusLower.includes("closed") || statusLower.includes("resolved")) {
            return isDark ? "#10b981" : "#34d399"
        }
        if (statusLower.includes("hold")) {
            return isDark ? "#f59e0b" : "#fbbf24"
        }
        if (statusLower.includes("high")) {
            return isDark ? "#ef4444" : "#f87171"
        }
        return isDark ? "#6b7280" : "#9ca3af"
    }

    const renderRecordContent = () => {
        const { tableName, recordData } = submission

        switch (tableName) {
            case "inquiries": {
                const inquiry = recordData as InquiryRecord
                return (
                    <>
                        <Text style={contentStyle} numberOfLines={1}>
                            {inquiry.inquirerName}
                        </Text>
                        <Text style={contentStyle} numberOfLines={2}>
                            {inquiry.inquiryContent || t("submission.noDescription")}
                        </Text>
                    </>
                )
            }

            case "daily_record": {
                const daily = recordData as DailyRecord
                return (
                    <>
                        <Text style={contentStyle} numberOfLines={1}>
                            {daily.conditionStatus || "N/A"}
                        </Text>
                        <Text style={contentStyle} numberOfLines={2}>
                            {daily.feedbackContent || t("submission.noDescription")}
                        </Text>
                    </>
                )
            }

            case "interaction_records": {
                const interaction = recordData as InteractionRecord
                return (
                    <>
                        <Text style={contentStyle} numberOfLines={1}>
                            {interaction.name || interaction.title || "N/A"}
                        </Text>
                        <Text style={contentStyle} numberOfLines={2}>
                            {interaction.description || t("submission.noDescription")}
                        </Text>
                    </>
                )
            }

            case "complaint_details": {
                const complaint = recordData as ComplaintDetail
                return (
                    <>
                        <Text style={contentStyle} numberOfLines={1}>
                            {complaint.complainerName}
                        </Text>
                        <Text style={contentStyle} numberOfLines={2}>
                            {complaint.complaintContent || t("submission.noDescription")}
                        </Text>
                    </>
                )
            }

            default:
                return (
                    <Text style={contentStyle} numberOfLines={2}>
                        {submission.preview || t("submission.noDescription")}
                    </Text>
                )
        }
    }

    return (
        <TouchableOpacity style={cardStyle} onPress={handlePress}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons
                        name={getTypeIcon(submission.tableName) as any}
                        size={20}
                        color="#3b82f6"
                        style={styles.icon}
                    />
                    <Text style={typeNameStyle}>{getTypeDisplayName(submission.tableName)}</Text>
                </View>
                <View style={styles.headerRight}>
                    {getStatusBadge()}
                    <View style={dateBadgeStyle}>
                        <Text style={styles.badgeText}>{formatDate(getRecordDate())}</Text>
                    </View>
                    {getResolutionDateBadge()}
                </View>
            </View>
            <View style={styles.contentContainer}>
                {renderRecordContent()}
            </View>
        </TouchableOpacity>
    )
})

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
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    icon: {
        marginRight: 8,
    },
    typeName: {
        fontSize: 16,
        fontWeight: "bold",
    },
    date: {
        fontSize: 12,
    },
    dateBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeIcon: {
        marginRight: 4,
    },
    badgeText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    contentContainer: {
        gap: 4,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
    },
    badgeRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
})
