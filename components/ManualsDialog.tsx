"use client"

import { useState, useEffect, useCallback } from "react"
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Platform,
    Linking,
    Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Paths, File } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useNetworkStatus } from "../hooks/useNetworkStatus"
import { documentsApi } from "../api/documents"
import { apiClient } from "../api/client"
import type { Document } from "../types/records"

interface ManualsDialogProps {
    visible: boolean
    onClose: () => void
}

export function ManualsDialog({ visible, onClose }: ManualsDialogProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { isOnline } = useNetworkStatus()
    const [documents, setDocuments] = useState<Document[]>([])
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

    // Fetch documents on mount
    useEffect(() => {
        if (visible) {
            fetchDocuments()
        }
    }, [visible])

    // Sync filtered documents when documents change (and no search query)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredDocuments(documents)
        }
    }, [documents, searchQuery])

    // Debounced search effect
    useEffect(() => {
        if (!visible || !searchQuery.trim()) return

        const timeoutId = setTimeout(() => {
            handleSearch()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchQuery, visible])

    const fetchDocuments = async () => {
        if (!isOnline) {
            setError(t("manuals.offlineManuals"))
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Invalidate cache first to ensure fresh data
            await documentsApi.invalidateCache()

            const response = await documentsApi.fetchDocuments({
                page: 1,
                limit: 100,
            }, false)

            setDocuments(response.data || [])
        } catch (err: any) {
            console.error("Failed to fetch documents:", err)

            // Network error handling
            if (err.code === "NETWORK_ERROR" || !err.response) {
                setError(t("network.noConnection"))
            } else if (err.response?.status >= 500) {
                setError(t("errors.serverError"))
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                setError(t("errors.unauthorized"))
            } else {
                setError(t("manuals.failedToLoad"))
            }
            setDocuments([])
            setFilteredDocuments([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        const query = searchQuery.trim()

        if (!query) {
            // Reset to show all documents when search is cleared
            setFilteredDocuments(documents)
            return
        }

        if (!isOnline) {
            setError(t("manuals.offlineManuals"))
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await documentsApi.searchDocuments(query, {
                page: 1,
                limit: 100,
            })

            setFilteredDocuments(response.data || [])
        } catch (err: any) {
            console.error("Failed to search documents:", err)

            // Network error handling
            if (err.code === "NETWORK_ERROR" || !err.response) {
                setError(t("network.noConnection"))
            } else if (err.response?.status >= 500) {
                setError(t("errors.serverError"))
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                setError(t("errors.unauthorized"))
            } else {
                setError(t("manuals.failedToLoad"))
            }
            setFilteredDocuments([])
        } finally {
            setLoading(false)
        }
    }

    const handleDocumentPress = useCallback(async (document: Document) => {
        if (!document.filePath) {
            Alert.alert(
                t("errors.general"),
                t("manuals.noFileAvailable"),
                [{ text: t("common.actions.ok") }]
            )
            return
        }

        setSelectedDocument(document)

        try {
            const fileUrl = getFileUrl(document.filePath)

            if (Platform.OS === "web") {
                // Web: Open PDF in new tab
                window.open(fileUrl, "_blank")
            } else {
                // Mobile: Download and open PDF
                await downloadAndOpenPDF(document, fileUrl)
            }
        } catch (error: any) {
            console.error("Failed to open document:", error)
            Alert.alert(
                t("errors.general"),
                t("manuals.failedToOpenDocument"),
                [{ text: t("common.actions.ok") }]
            )
        }
    }, [t])

    const getFileUrl = (filePath: string): string => {
        // Check if filePath is already a full URL (S3/CloudFront)
        try {
            const url = new URL(filePath)
            if (url.protocol === "http:" || url.protocol === "https:") {
                return filePath
            }
        } catch {
            // Not a valid URL, treat as relative path
        }

        // Fallback: construct URL from API base
        const baseUrl = apiClient.getBaseUrl()
        return filePath.startsWith("/") ? `${baseUrl}${filePath}` : `${baseUrl}/${filePath}`
    }

    const downloadAndOpenPDF = async (document: Document, fileUrl: string) => {
        try {
            setLoading(true)

            const fileName = `${document.title.replace(/[^a-z0-9]/gi, "_")}.pdf`
            const file = new File(Paths.cache, fileName)

            // S3/CloudFront URLs are public, but include auth token for consistency
            const token = await apiClient.getAuthToken()
            const headers: Record<string, string> = {}
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            const response = await fetch(fileUrl, { headers })

            if (!response.ok) {
                throw new Error(`Download failed with status ${response.status}`)
            }

            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            await file.write(new Uint8Array(arrayBuffer))

            setLoading(false)

            const isSharingAvailable = await Sharing.isAvailableAsync()

            if (isSharingAvailable) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: "application/pdf",
                    dialogTitle: document.title,
                    UTI: "com.adobe.pdf",
                })
            } else {
                const canOpen = await Linking.canOpenURL(file.uri)
                if (canOpen) {
                    await Linking.openURL(file.uri)
                } else {
                    Alert.alert(
                        t("errors.general"),
                        t("manuals.noPDFViewer"),
                        [{ text: t("common.actions.ok") }]
                    )
                }
            }
        } catch (error: any) {
            setLoading(false)
            console.error("Failed to download/open PDF:", error)
            throw error
        }
    }

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

    const searchInputStyle = {
        ...styles.searchInput,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
        color: isDarkMode ? "#fff" : "#000",
        borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
    }

    const contentStyle = {
        ...styles.content,
    }

    const documentCardStyle = {
        ...styles.documentCard,
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

    const emptyStateStyle = {
        ...styles.emptyState,
        color: isDarkMode ? "#aaa" : "#666",
    }

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
                            <Text style={titleStyle}>{t("manuals.title")}</Text>
                        </View>
                        <TouchableOpacity
                            style={closeButtonStyle}
                            onPress={onClose}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color={isDarkMode ? "#fff" : "#000"}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={isDarkMode ? "#aaa" : "#666"}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={searchInputStyle}
                                placeholder={t("manuals.searchPlaceholder")}
                                placeholderTextColor={
                                    isDarkMode ? "#666" : "#999"
                                }
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setSearchQuery("")}
                                    style={styles.clearButton}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color={isDarkMode ? "#666" : "#999"}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <ScrollView style={contentStyle}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#ff4500" />
                                <Text style={emptyStateStyle}>
                                    {t("manuals.loading")}
                                </Text>
                            </View>
                        ) : error ? (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={48}
                                    color={isDarkMode ? "#aaa" : "#666"}
                                />
                                <Text style={emptyStateStyle}>{error}</Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={fetchDocuments}
                                >
                                    <Text style={styles.retryButtonText}>
                                        {t("common.actions.retry")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : !filteredDocuments || filteredDocuments.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={48}
                                    color={isDarkMode ? "#aaa" : "#666"}
                                />
                                <Text style={emptyStateStyle}>
                                    {searchQuery
                                        ? t("manuals.noDocumentsMessage")
                                        : t("manuals.noDocuments")}
                                </Text>
                            </View>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={documentCardStyle}
                                    onPress={() => handleDocumentPress(doc)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.documentHeader}>
                                        <Text style={valueStyle} numberOfLines={1}>
                                            {doc.title}
                                        </Text>
                                        <Text style={labelStyle}>
                                            {new Date(doc.startDate).toLocaleDateString()}
                                        </Text>
                                    </View>

                                    <View style={styles.documentMeta}>
                                        <Text style={labelStyle}>
                                            {t("manuals.documentType")}:
                                        </Text>
                                        <Text style={valueStyle}>
                                            {t(`manuals.types.${doc.type}`)}
                                        </Text>
                                    </View>

                                    {doc.endDate && (
                                        <View style={styles.documentMeta}>
                                            <Text style={labelStyle}>
                                                {t("manuals.endDate")}:
                                            </Text>
                                            <Text style={valueStyle}>
                                                {new Date(doc.endDate).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.viewDetailsContainer}>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={isDarkMode ? "#aaa" : "#666"}
                                        />
                                        <Text style={labelStyle}>
                                            {t("manuals.viewDocument")}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
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
    title: {
        fontSize: 17,
        fontWeight: "bold",
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    searchContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
    },
    searchIcon: {
        position: "absolute",
        left: 12,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        paddingLeft: 40,
        paddingRight: 40,
        fontSize: 15,
        borderWidth: 1,
    },
    clearButton: {
        position: "absolute",
        right: 12,
        zIndex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    documentCard: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 14,
        lineHeight: 20,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyState: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: "#ff4500",
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    documentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    documentMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 8,
    },
    viewDetailsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 8,
    },
})
