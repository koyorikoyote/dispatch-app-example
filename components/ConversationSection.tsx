"use client"

import { useState, useEffect, useRef } from "react"
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { apiClient } from "../api/client"

interface Reply {
    id: number
    toDatetime: string | null
    fromDatetime: string | null
    toMessage: string | null
    fromMessage: string | null
    userId: number | null
    user: {
        id: number
        name: string
        email: string
    } | null
    staffName?: string
    staffId?: number
    createdAt: string
    updatedAt: string
}

interface ConversationSectionProps {
    tableName: "inquiries" | "daily_record" | "interaction_records" | "complaint_details"
    recordId: number
}

export function ConversationSection({ tableName, recordId }: ConversationSectionProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [replies, setReplies] = useState<Reply[]>([])
    const [messageText, setMessageText] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollViewRef = useRef<ScrollView>(null)

    const getEndpoint = () => {
        const tableMap: Record<string, string> = {
            inquiries: "inquiries",
            daily_record: "daily-records",
            interaction_records: "interaction-records",
            complaint_details: "complaint-details",
        }
        return `/mobile/${tableMap[tableName]}/${recordId}/replies`
    }

    const loadReplies = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.get<{ success: boolean; data: Reply[] }>(getEndpoint())
            if (response.success && response.data) {
                setReplies(response.data)
            }
        } catch (err: any) {
            setError(err.message || "Failed to load messages")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadReplies()
    }, [recordId, tableName])

    useEffect(() => {
        if (replies.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }, 100)
        }
    }, [replies.length])

    const handleSubmit = async () => {
        const trimmedText = messageText.trim()
        if (!trimmedText || isSubmitting) return

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await apiClient.post<{ success: boolean; data: Reply }>(getEndpoint(), {
                messageText: trimmedText,
            })

            if (response.success && response.data) {
                const existingIndex = replies.findIndex(r => r.id === response.data.id)
                if (existingIndex >= 0) {
                    const updatedReplies = [...replies]
                    updatedReplies[existingIndex] = response.data
                    setReplies(updatedReplies)
                } else {
                    setReplies([...replies, response.data])
                }
                setMessageText("")
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true })
                }, 100)
            }
        } catch (err: any) {
            setError(err.message || "Failed to send message")
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatTimestamp = (dateString: string | null) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getUserInitials = (name: string) => {
        const parts = name.trim().split(/\s+/)
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const flattenMessages = () => {
        const messages: Array<{
            id: string
            replyId: number
            text: string
            datetime: string
            isFromDispatch: boolean
            authorName: string
            userId: number | null
        }> = []

        replies.forEach((reply) => {
            if (reply.toMessage && reply.toDatetime) {
                messages.push({
                    id: `${reply.id}-to`,
                    replyId: reply.id,
                    text: reply.toMessage,
                    datetime: reply.toDatetime,
                    isFromDispatch: true,
                    authorName: reply.staffName || "Dispatch User",
                    userId: reply.userId,
                })
            }
            if (reply.fromMessage && reply.fromDatetime) {
                messages.push({
                    id: `${reply.id}-from`,
                    replyId: reply.id,
                    text: reply.fromMessage,
                    datetime: reply.fromDatetime,
                    isFromDispatch: false,
                    authorName: reply.user?.name || "Manager User",
                    userId: reply.userId,
                })
            }
        })

        return messages.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    }

    const isWithinEditWindow = (datetime: string): boolean => {
        const messageDate = new Date(datetime)
        const now = new Date()
        const hoursSincePosted = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
        return hoursSincePosted <= 1
    }

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editText, setEditText] = useState("")

    const handleEditMessage = (message: ReturnType<typeof flattenMessages>[0]) => {
        setEditingMessageId(message.id)
        setEditText(message.text)
    }

    const handleSaveEdit = async (message: ReturnType<typeof flattenMessages>[0]) => {
        if (!editText.trim()) return

        try {
            const response = await apiClient.put<{ success: boolean; data: Reply }>(
                `${getEndpoint()}/${message.replyId}`,
                { messageText: editText.trim() }
            )

            if (response.success && response.data) {
                setReplies(replies.map(r => r.id === message.replyId ? response.data : r))
                setEditingMessageId(null)
                setEditText("")
            }
        } catch (err: any) {
            setError(err.message || "Failed to update message")
        }
    }

    const handleCancelEdit = () => {
        setEditingMessageId(null)
        setEditText("")
    }

    const handleDeleteMessage = async (message: ReturnType<typeof flattenMessages>[0]) => {
        try {
            const response = await apiClient.delete<{ success: boolean }>(
                `${getEndpoint()}/${message.replyId}`
            )

            if (response.success) {
                await loadReplies()
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete message")
        }
    }

    const renderMessage = (message: ReturnType<typeof flattenMessages>[0]) => {
        const isFromDispatch = message.isFromDispatch
        const isEditing = editingMessageId === message.id
        const canEdit = isFromDispatch && isWithinEditWindow(message.datetime)

        return (
            <View
                key={message.id}
                style={[
                    styles.messageContainer,
                    isFromDispatch ? styles.messageLeft : styles.messageRight,
                ]}
            >
                <View
                    style={[
                        styles.avatar,
                        { backgroundColor: isFromDispatch ? "#3b82f6" : "#6b7280" },
                    ]}
                >
                    <Text style={styles.avatarText}>
                        {getUserInitials(message.authorName)}
                    </Text>
                </View>

                <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                        <Text
                            style={[
                                styles.userName,
                                { color: isDarkMode ? "#fff" : "#000" },
                            ]}
                        >
                            {message.authorName}
                        </Text>
                        <Text style={styles.timestamp}>
                            {formatTimestamp(message.datetime)}
                        </Text>
                    </View>

                    {isEditing ? (
                        <View style={styles.editContainer}>
                            <TextInput
                                style={[
                                    styles.editInput,
                                    {
                                        backgroundColor: isDarkMode ? "#2d2d2e" : "#fff",
                                        color: isDarkMode ? "#fff" : "#000",
                                        borderColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.2)"
                                            : "rgba(0, 0, 0, 0.2)",
                                    },
                                ]}
                                value={editText}
                                onChangeText={setEditText}
                                multiline
                                autoFocus
                            />
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={[styles.editButton, styles.saveButton]}
                                    onPress={() => handleSaveEdit(message)}
                                >
                                    <Text style={styles.editButtonText}>{t("common.actions.save")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.editButton, styles.cancelButton]}
                                    onPress={handleCancelEdit}
                                >
                                    <Text style={styles.editButtonText}>{t("common.actions.cancel")}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <View
                                style={[
                                    styles.messageBubble,
                                    {
                                        backgroundColor: isFromDispatch
                                            ? (isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(239, 246, 255, 0.9)")
                                            : (isDarkMode ? "rgba(107, 114, 128, 0.2)" : "rgba(243, 244, 246, 0.9)"),
                                        borderColor: isFromDispatch
                                            ? (isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(191, 219, 254, 0.5)")
                                            : (isDarkMode ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)"),
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        { color: isDarkMode ? "#fff" : "#000" },
                                    ]}
                                >
                                    {message.text}
                                </Text>
                            </View>
                            {canEdit && (
                                <View
                                    style={[
                                        styles.messageActions,
                                        {
                                            borderTopColor: isFromDispatch
                                                ? (isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(191, 219, 254, 0.5)")
                                                : (isDarkMode ? "rgba(107, 114, 128, 0.3)" : "rgba(209, 213, 219, 0.5)"),
                                        },
                                    ]}
                                >
                                    <TouchableOpacity onPress={() => handleEditMessage(message)}>
                                        <Text style={styles.actionText}>{t("common.actions.edit")}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteMessage(message)}>
                                        <Text style={[styles.actionText, styles.deleteText]}>
                                            {t("common.actions.delete")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {error && (
                <View
                    style={[
                        styles.errorContainer,
                        { backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(254, 226, 226, 0.9)" },
                    ]}
                >
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadReplies}>
                        <Text style={styles.retryText}>{t("common.actions.retry")}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text
                        style={[
                            styles.loadingText,
                            { color: isDarkMode ? "#aaa" : "#666" },
                        ]}
                    >
                        {t("common.status.loading")}
                    </Text>
                </View>
            ) : replies.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text
                        style={[
                            styles.emptyText,
                            { color: isDarkMode ? "#aaa" : "#666" },
                        ]}
                    >
                        {t("submission.noComments")}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                >
                    {flattenMessages().map(renderMessage)}
                </ScrollView>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)",
                        borderTopColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.1)",
                    },
                ]}
            >
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: isDarkMode ? "#2d2d2e" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                            borderColor: isDarkMode
                                ? "rgba(255, 255, 255, 0.2)"
                                : "rgba(0, 0, 0, 0.2)",
                        },
                    ]}
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder={t("submission.addComment")}
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                    multiline
                    maxLength={500}
                    editable={!isSubmitting}
                    onSubmitEditing={handleSubmit}
                    blurOnSubmit={false}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        {
                            backgroundColor:
                                !messageText.trim() || isSubmitting ? "#999" : "#3b82f6",
                        },
                    ]}
                    onPress={handleSubmit}
                    disabled={!messageText.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: "#dc2626",
    },
    retryText: {
        fontSize: 13,
        color: "#dc2626",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        textAlign: "center",
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 12,
        paddingLeft: 30,
    },
    messageContainer: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 8,
    },
    messageLeft: {
        justifyContent: "flex-start",
    },
    messageRight: {
        justifyContent: "flex-end",
        flexDirection: "row-reverse",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    messageContent: {
        flex: 1,
        maxWidth: "90%",
    },
    messageHeader: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 4,
        gap: 8,
    },
    userName: {
        fontSize: 13,
        fontWeight: "600",
    },
    timestamp: {
        fontSize: 11,
        color: "#999",
    },
    messageBubble: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: "row",
        padding: 12,
        gap: 8,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        fontSize: 14,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    messageActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    actionText: {
        fontSize: 12,
        color: "#3b82f6",
        fontWeight: "600",
    },
    deleteText: {
        color: "#dc2626",
    },
    editContainer: {
        gap: 8,
    },
    editInput: {
        minHeight: 80,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 14,
        textAlignVertical: "top",
    },
    editActions: {
        flexDirection: "row",
        gap: 8,
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: "#3b82f6",
    },
    cancelButton: {
        backgroundColor: "#6b7280",
    },
    editButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
})
