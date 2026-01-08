"use client"

import { useState } from "react"
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import type { Notification } from "../types/notifications"
import type {
    InquiryRecord,
    DailyRecord,
    InteractionRecord,
    ComplaintDetail,
} from "../types/records"
import { ConversationSection } from "./ConversationSection"

interface NotificationDetailDialogProps {
    notification: Notification | null
    visible: boolean
    onClose: () => void
    onMarkAsRead: (messageReplyId: number) => Promise<void>
}

export function NotificationDetailDialog({
    notification,
    visible,
    onClose,
    onMarkAsRead,
}: NotificationDetailDialogProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [marking, setMarking] = useState(false)
    const [showConversation, setShowConversation] = useState(false)

    const overlayStyle = {
        ...styles.overlay,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    }

    const dialogStyle = {
        ...styles.dialog,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    }

    const headerStyle = {
        ...styles.header,
        backgroundColor: isDarkMode
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)",
        borderBottomColor: isDarkMode
            ? "rgba(59, 130, 246, 0.2)"
            : "rgba(59, 130, 246, 0.1)",
    }

    const titleStyle = {
        ...styles.title,
        color: isDarkMode ? "#fff" : "#000",
    }

    const closeButtonStyle = {
        ...styles.closeButton,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    }

    const contentStyle = {
        ...styles.content,
    }

    const sectionStyle = {
        ...styles.section,
        backgroundColor: isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.02)",
        borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.05)",
    }

    const labelStyle = {
        ...styles.label,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const valueStyle = {
        ...styles.value,
        color: isDarkMode ? "#fff" : "#000",
    }

    const handleMarkAsRead = async () => {
        if (!notification || marking) return

        try {
            setMarking(true)
            await onMarkAsRead(notification.messageReplyId)
            onClose()
        } catch (error: any) {
            console.error("Failed to mark as read:", error)
        } finally {
            setMarking(false)
        }
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

    const formatDateToYYYYMMDD = (dateString: string) => {
        const date = new Date(dateString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}/${month}/${day}`
    }

    const translateInteractionType = (type: string) => {
        const typeKey = type?.toUpperCase()
        const translationKey = `enums.interactionType.${typeKey}` as any
        const translated = t(translationKey)
        return translated !== translationKey ? translated : type
    }

    const translateInteractionMeans = (means: string) => {
        const meansKey = means?.toUpperCase().replace(/\s+/g, "_")
        const translationKey = `enums.interactionMeans.${meansKey}` as any
        const translated = t(translationKey)
        return translated !== translationKey ? translated : means
    }

    const translateUrgencyLevel = (urgency: string) => {
        const urgencyKey = urgency?.charAt(0).toUpperCase() + urgency?.slice(1).toLowerCase()
        const translationKey = `enums.urgencyLevel.${urgencyKey}` as any
        const translated = t(translationKey)
        return translated !== translationKey ? translated : urgency
    }

    const translateConditionStatus = (condition: string) => {
        const conditionKey = condition?.charAt(0).toUpperCase() + condition?.slice(1).toLowerCase()
        const translationKey = `enums.conditionStatus.${conditionKey}` as any
        const translated = t(translationKey)
        return translated !== translationKey ? translated : condition
    }

    const translateInquiryType = (type: string) => {
        const typeKey = type?.toUpperCase()
        const translationKey = `enums.inquiryType.${typeKey}` as any
        const translated = t(translationKey)
        return translated !== translationKey ? translated : type
    }

    const renderFieldRow = (label: string, value: any, isDate: boolean = false) => {
        if (value === null || value === undefined || value === "") return null

        const displayValue = isDate ? formatDateToYYYYMMDD(value) : String(value)

        return (
            <View style={styles.fieldRow}>
                <Text style={labelStyle}>{label}:</Text>
                <Text style={valueStyle}>{displayValue}</Text>
            </View>
        )
    }

    const renderGridRow = (fields: Array<{ label: string; value: any; isDate?: boolean }>) => {
        const validFields = fields.filter(f => f.value !== null && f.value !== undefined && f.value !== "")
        if (validFields.length === 0) return null

        return (
            <View style={styles.gridRow}>
                {validFields.map((field, index) => {
                    const displayValue = field.isDate ? formatDateToYYYYMMDD(field.value) : String(field.value)
                    return (
                        <View key={index} style={styles.gridCell}>
                            <Text style={labelStyle}>{field.label}:</Text>
                            <Text style={valueStyle}>{displayValue}</Text>
                        </View>
                    )
                })}
            </View>
        )
    }

    const renderRecordDetails = () => {
        if (!notification) return null

        const { recordData, tableName } = notification

        switch (tableName) {
            case "inquiries": {
                const inquiry = recordData as InquiryRecord
                return (
                    <>
                        <View style={sectionStyle}>
                            {renderFieldRow(t("notifications.detailDialog.content"), inquiry.inquiryContent)}
                        </View>
                        <View style={sectionStyle}>
                            {renderFieldRow(t("notifications.detailDialog.inquirerName"), inquiry.inquirerName)}
                            {renderFieldRow(t("notifications.detailDialog.contact"), inquiry.inquirerContact)}
                        </View>
                        <View style={sectionStyle}>
                            {renderGridRow([
                                { label: t("notifications.detailDialog.dateOfInquiry"), value: inquiry.dateOfInquiry, isDate: true },
                                { label: t("notifications.detailDialog.type"), value: inquiry.typeOfInquiry ? translateInquiryType(inquiry.typeOfInquiry) : "" },
                            ])}
                        </View>
                    </>
                )
            }

            case "daily_record": {
                const daily = recordData as DailyRecord
                return (
                    <>
                        <View style={sectionStyle}>
                            {renderFieldRow(t("notifications.detailDialog.feedback"), daily.feedbackContent)}
                        </View>
                        <View style={sectionStyle}>
                            {renderGridRow([
                                { label: t("notifications.detailDialog.date"), value: daily.dateOfRecord, isDate: true },
                                { label: t("notifications.detailDialog.condition"), value: daily.conditionStatus ? translateConditionStatus(daily.conditionStatus) : "" },
                            ])}
                            {renderFieldRow(t("notifications.detailDialog.contactNumber"), daily.contactNumber)}
                        </View>
                        {daily.photo && (
                            <View style={sectionStyle}>
                                <Text style={labelStyle}>{t("notifications.detailDialog.photo")}:</Text>
                                <Image
                                    source={{ uri: daily.photo }}
                                    style={styles.photoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                    </>
                )
            }

            case "interaction_records": {
                const interaction = recordData as InteractionRecord
                return (
                    <>
                        <View style={sectionStyle}>
                            {renderFieldRow(t("notifications.detailDialog.description"), interaction.description)}
                        </View>
                        {(interaction.location || interaction.means) && (
                            <View style={sectionStyle}>
                                {renderGridRow([
                                    { label: t("notifications.detailDialog.location"), value: interaction.location },
                                    { label: t("notifications.detailDialog.means"), value: interaction.means ? translateInteractionMeans(interaction.means) : "" },
                                ])}
                            </View>
                        )}
                        {interaction.responseDetails && (
                            <View style={sectionStyle}>
                                {renderFieldRow(t("notifications.detailDialog.responseDetails"), interaction.responseDetails)}
                            </View>
                        )}
                        <View style={sectionStyle}>
                            {renderGridRow([
                                { label: t("notifications.detailDialog.type"), value: interaction.type ? translateInteractionType(interaction.type) : "" },
                                { label: t("notifications.detailDialog.date"), value: interaction.date, isDate: true },
                            ])}
                            {renderGridRow([
                                { label: t("notifications.detailDialog.name"), value: interaction.name },
                            ])}
                            {renderFieldRow(t("notifications.detailDialog.title"), interaction.title)}
                        </View>
                    </>
                )
            }

            case "complaint_details": {
                const complaint = recordData as ComplaintDetail
                return (
                    <>
                        <View style={sectionStyle}>
                            {renderFieldRow(t("notifications.detailDialog.content"), complaint.complaintContent)}
                        </View>
                        <View style={sectionStyle}>
                            {renderFieldRow(t("notifications.detailDialog.complainerName"), complaint.complainerName)}
                            {renderFieldRow(t("notifications.detailDialog.contact"), complaint.complainerContact)}
                        </View>
                        <View style={sectionStyle}>
                            {renderGridRow([
                                { label: t("notifications.detailDialog.dateOfOccurrence"), value: complaint.dateOfOccurrence, isDate: true },
                                { label: t("notifications.detailDialog.personInvolved"), value: complaint.personInvolved },
                            ])}
                            {renderGridRow([
                                { label: t("notifications.detailDialog.urgency"), value: complaint.urgencyLevel ? translateUrgencyLevel(complaint.urgencyLevel) : "" },
                            ])}
                        </View>
                    </>
                )
            }

            default:
                return null
        }
    }

    if (!notification) return null

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={overlayStyle}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={dialogStyle}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={headerStyle}>
                        <View style={styles.headerLeft}>
                            <Text style={titleStyle}>
                                {getTableDisplayName(notification.tableName)}
                            </Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={{
                                    ...styles.markReadButton,
                                    backgroundColor: marking ? "#999" : "#ff4500",
                                }}
                                onPress={handleMarkAsRead}
                                disabled={marking}
                            >
                                {marking ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="checkmark-circle-outline"
                                            size={16}
                                            color="#fff"
                                            style={styles.markReadIcon}
                                        />
                                        <Text style={styles.markReadText}>
                                            {t("notifications.markAsRead")}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={closeButtonStyle}
                                onPress={onClose}
                                disabled={marking}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={isDarkMode ? "#fff" : "#000"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={{
                            ...styles.toggleButton,
                            backgroundColor: showConversation
                                ? (isDarkMode ? "#2d2d2e" : "#e5e7eb")
                                : "#3b82f6",
                        }}
                        onPress={() => setShowConversation(!showConversation)}
                    >
                        <Ionicons
                            name={showConversation ? "chevron-up" : "chatbubbles-outline"}
                            size={18}
                            color={showConversation ? (isDarkMode ? "#fff" : "#000") : "#fff"}
                            style={styles.buttonIcon}
                        />
                        <Text
                            style={{
                                ...styles.toggleButtonText,
                                color: showConversation ? (isDarkMode ? "#fff" : "#000") : "#fff",
                            }}
                        >
                            {showConversation
                                ? t("notifications.closeChatMessages")
                                : t("notifications.openChatMessages")}
                        </Text>
                    </TouchableOpacity>

                    {showConversation ? (
                        <View style={{ flex: 1 }}>
                            <ConversationSection
                                tableName={notification.tableName}
                                recordId={notification.recordId}
                            />
                        </View>
                    ) : (
                        <ScrollView style={contentStyle}>
                            <View style={sectionStyle}>
                                {renderFieldRow(t("notifications.updatedAt"), notification.updatedAt, true)}
                                {renderFieldRow(t("notifications.lastMessage"), notification.lastMessage)}
                            </View>
                            {renderRecordDetails()}
                        </ScrollView>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
        marginTop: -20,
    },
    dialog: {
        width: "100%",
        maxWidth: 600,
        height: "90%",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flex: 1,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    title: {
        fontSize: 17,
        fontWeight: "bold",
    },
    markReadButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    markReadIcon: {
        marginRight: 4,
    },
    markReadText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    toggleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 12,
        marginVertical: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    buttonIcon: {
        marginRight: 6,
    },
    toggleButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    content: {
        padding: 16,
    },
    section: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
    },
    fieldRow: {
        marginBottom: 8,
    },
    gridRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
        gap: 12,
    },
    gridCell: {
        flex: 1,
        minWidth: "45%",
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 15,
        lineHeight: 22,
    },
    photoImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginTop: 8,
    },
})
