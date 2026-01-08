"use client"

import { useState, useEffect, useRef } from "react"
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useNetworkStatus } from "../hooks/useNetworkStatus"
import { searchApi } from "../api/search"
import type { SearchResult } from "../types/records"
import { NotificationDetailDialog } from "./NotificationDetailDialog"
import type { Notification } from "../types/notifications"
import { DatePicker } from "./DatePicker"

interface SearchDialogProps {
    visible: boolean
    onClose: () => void
}

export function SearchDialog({ visible, onClose }: SearchDialogProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { isOnline } = useNetworkStatus()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedResult, setSelectedResult] = useState<Notification | null>(null)
    const [detailDialogVisible, setDetailDialogVisible] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [dateRangeError, setDateRangeError] = useState<string | null>(null)
    const searchAbortControllerRef = useRef<AbortController | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (searchAbortControllerRef.current) {
                searchAbortControllerRef.current.abort()
            }
        }
    }, [])

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

    const resultCardStyle = {
        ...styles.resultCard,
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

    const performSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([])
            setError(null)
            setDateRangeError(null)
            setSearching(false)
            return
        }

        if (!isOnline) {
            setError(t("search.offlineSearch"))
            setSearching(false)
            return
        }

        // Validate date range
        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)

            // Check for invalid dates
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                setDateRangeError(t("errors.general"))
                setSearching(false)
                return
            }

            if (start > end) {
                setDateRangeError(t("search.invalidDateRange"))
                setSearching(false)
                return
            }
        }

        setSearching(true)

        // Cancel previous search
        if (searchAbortControllerRef.current) {
            searchAbortControllerRef.current.abort()
        }

        // Create new abort controller
        searchAbortControllerRef.current = new AbortController()

        try {
            setError(null)
            setDateRangeError(null)

            const response = await searchApi.search({
                q: searchQuery.trim(),
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                page: 1,
                limit: 50,
            })

            const results = Array.isArray(response) ? response : (response.data || [])
            setSearchResults(results)
        } catch (err: any) {
            // Ignore aborted requests
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return
            }

            console.error("Search failed:", err)

            // Network error handling
            if (err.code === "NETWORK_ERROR" || !err.response) {
                setError(t("network.noConnection"))
            } else if (err.response?.status >= 500) {
                setError(t("errors.serverError"))
            } else if (err.response?.status === 401) {
                setError(t("errors.unauthorized"))
            } else {
                setError(t("search.failedToSearch"))
            }
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }

    const handleSearch = () => {
        performSearch()
    }

    const handleResultClick = (result: SearchResult) => {
        // Convert SearchResult to Notification format for detail dialog
        const notification: Notification = {
            id: result.recordId,
            tableName: result.tableName as any,
            recordId: result.recordId,
            updatedAt: result.recordData.updatedAt || new Date().toISOString(),
            lastMessage: result.preview,
            recordData: result.recordData,
            messageReplyId: 0, // Not applicable for search results
        }

        setSelectedResult(notification)
        setDetailDialogVisible(true)
    }

    const handleCloseDetailDialog = () => {
        setDetailDialogVisible(false)
        setSelectedResult(null)
    }

    const getTableDisplayName = (tableName: string) => {
        const key = `search.types.${tableName}` as any
        return t(key) || tableName
    }

    const renderEmptyState = () => {
        if (error) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color={isDarkMode ? "#aaa" : "#666"}
                    />
                    <Text style={emptyStateStyle}>{error}</Text>
                </View>
            )
        }

        if (!searchQuery.trim()) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Ionicons
                        name="search-outline"
                        size={48}
                        color={isDarkMode ? "#aaa" : "#666"}
                    />
                    <Text style={emptyStateStyle}>
                        {t("search.enterKeywords")}
                    </Text>
                </View>
            )
        }

        if ((!searchResults || searchResults.length === 0) && !searching) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Ionicons
                        name="document-outline"
                        size={48}
                        color={isDarkMode ? "#aaa" : "#666"}
                    />
                    <Text style={emptyStateStyle}>{t("search.noResults")}</Text>
                    <Text style={[emptyStateStyle, styles.emptyStateSubtext]}>
                        {t("search.noResultsMessage")}
                    </Text>
                </View>
            )
        }

        return null
    }

    const renderSearchResult = (result: SearchResult) => (
        <TouchableOpacity
            key={`${result.tableName}-${result.recordId}`}
            style={resultCardStyle}
            onPress={() => handleResultClick(result)}
            activeOpacity={0.7}
        >
            <View style={styles.resultHeader}>
                <Text style={labelStyle}>
                    {String(getTableDisplayName(result.tableName) || "")}
                </Text>
            </View>

            {Boolean(result.matchedFields && result.matchedFields.length > 0) && (
                <View style={styles.matchedFieldsContainer}>
                    <Text style={labelStyle}>{String(t("search.matchedFields") || "")}</Text>
                    <Text style={valueStyle}>
                        {String(result.matchedFields.length || "")}
                    </Text>
                </View>
            )}

            <View style={styles.previewContainer}>
                <Text style={labelStyle}>{String(t("search.preview") || "")}</Text>
                <Text style={valueStyle} numberOfLines={2}>
                    {String(result.preview || "No preview")}
                </Text>
            </View>

            <View style={styles.viewDetailsContainer}>
                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDarkMode ? "#aaa" : "#666"}
                />
                <Text style={labelStyle}>{String(t("search.viewDetails") || "")}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <>
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
                                <Text style={titleStyle}>{t("search.title")}</Text>
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
                                    placeholder={t("search.searchPlaceholder")}
                                    placeholderTextColor={
                                        isDarkMode ? "#666" : "#999"
                                    }
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                    autoFocus
                                />
                                {Boolean(searchQuery.length > 0) && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSearchQuery("")
                                            setSearchResults([])
                                            setError(null)
                                        }}
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

                            <TouchableOpacity
                                style={[
                                    styles.searchButton,
                                    {
                                        backgroundColor: searching
                                            ? "#999"
                                            : "#ff4500",
                                    },
                                ]}
                                onPress={handleSearch}
                                disabled={searching || !searchQuery.trim()}
                            >
                                {searching ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Ionicons
                                        name="search"
                                        size={20}
                                        color="#fff"
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateFilterContainer}>
                            <View style={styles.datePickerRow}>
                                <View style={styles.datePickerWrapper}>
                                    <DatePicker
                                        value={startDate}
                                        onChange={setStartDate}
                                        label={t("search.startDate")}
                                        maxDate={endDate || undefined}
                                    />
                                </View>
                                <View style={styles.datePickerWrapper}>
                                    <DatePicker
                                        value={endDate}
                                        onChange={setEndDate}
                                        label={t("search.endDate")}
                                        minDate={startDate || undefined}
                                    />
                                </View>
                                {Boolean(startDate || endDate) && (
                                    <TouchableOpacity
                                        style={styles.clearDatesButton}
                                        onPress={() => {
                                            setStartDate("")
                                            setEndDate("")
                                            setDateRangeError(null)
                                        }}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={24}
                                            color={isDarkMode ? "#aaa" : "#666"}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {Boolean(dateRangeError) && (
                                <Text style={styles.dateRangeError}>
                                    {dateRangeError}
                                </Text>
                            )}
                        </View>

                        {Boolean(searchResults && searchResults.length > 0) && (
                            <View style={styles.resultsHeader}>
                                <Text style={labelStyle}>
                                    {t("search.resultsCount", {
                                        count: searchResults.length,
                                    })}
                                </Text>
                            </View>
                        )}

                        <ScrollView style={contentStyle}>
                            {Boolean(searching) && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator
                                        size="large"
                                        color="#ff4500"
                                    />
                                    <Text style={emptyStateStyle}>
                                        {t("search.searching")}
                                    </Text>
                                </View>
                            )}
                            {Boolean(!searching && searchResults && searchResults.length > 0) && (
                                <View>
                                    {searchResults.map(renderSearchResult)}
                                </View>
                            )}
                            {Boolean(!searching && (!searchResults || searchResults.length === 0)) && (
                                renderEmptyState()
                            )}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {Boolean(selectedResult) && (
                <NotificationDetailDialog
                    notification={selectedResult}
                    visible={detailDialogVisible}
                    onClose={handleCloseDetailDialog}
                    onMarkAsRead={async () => {
                        // No-op for search results
                    }}
                />
            )}
        </>
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
        gap: 8,
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
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    resultsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    resultCard: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
    },
    resultHeader: {
        marginBottom: 8,
    },
    matchedFieldsContainer: {
        marginBottom: 8,
    },
    previewContainer: {
        marginBottom: 8,
    },
    viewDetailsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4,
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
    emptyStateSubtext: {
        fontSize: 14,
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    dateFilterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    datePickerRow: {
        flexDirection: "row",
        gap: 8,
    },
    datePickerWrapper: {
        flex: 1,
    },
    dateRangeError: {
        fontSize: 12,
        color: "#ff4444",
        marginTop: 4,
        marginLeft: 4,
    },
    clearDatesButton: {
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "flex-end",
        marginBottom: 8,
        padding: 4,
    },
})
