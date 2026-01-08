"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { View, ScrollView, RefreshControl, StyleSheet, AppState, AppStateStatus, TouchableOpacity, Text, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useRefresh } from "../contexts/RefreshContext"
import { submissionsApi } from "../api/submissions"
import type { SubmissionRecord } from "../types/records"
import { EmptyState } from "../components/EmptyState"
import { NotificationCardSkeleton } from "../components/SkeletonLoader"
import { TabFilterBar } from "../components/TabFilterBar"
import { SubmissionCard } from "../components/SubmissionCard"
import { SubmissionDetailDialog } from "../components/SubmissionDetailDialog"
import {
    type TabFilters,
    DEFAULT_TAB_FILTERS,
    saveToggleStates,
    loadToggleStates
} from "../utils/statePersistence"

export default function SubmissionsPage() {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { refreshTrigger } = useRefresh()
    const [submissions, setSubmissions] = useState<SubmissionRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tabFilters, setTabFilters] = useState<TabFilters>(DEFAULT_TAB_FILTERS)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null)
    const [showDetailDialog, setShowDetailDialog] = useState(false)
    const appState = useRef(AppState.currentState)
    const PAGE_LIMIT = 20

    const containerStyle = {
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    }

    useEffect(() => {
        loadTabFilters()
        fetchSubmissions()

        const subscription = AppState.addEventListener("change", handleAppStateChange)

        return () => {
            subscription.remove()
        }
    }, [])

    useEffect(() => {
        if (refreshTrigger > 0) {
            refreshSubmissions()
        }
    }, [refreshTrigger])

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            refreshSubmissions()
        }
        appState.current = nextAppState
    }

    const loadTabFilters = async () => {
        try {
            const filters = await loadToggleStates()
            setTabFilters(filters)
        } catch (error) {
            console.error("Failed to load tab filters:", error)
            setTabFilters(DEFAULT_TAB_FILTERS)
        }
    }

    const saveTabFilters = async (filters: TabFilters) => {
        try {
            await saveToggleStates(filters)
        } catch (error) {
            console.error("Failed to save tab filters:", error)
        }
    }

    const fetchSubmissions = async (page: number = 1, append: boolean = false) => {
        try {
            setError(null)
            if (append) {
                setLoadingMore(true)
            }

            const response = await submissionsApi.fetchSubmissions({
                page,
                limit: PAGE_LIMIT
            }, false)

            const newSubmissions = response.data || []

            if (append) {
                setSubmissions(prev => [...prev, ...newSubmissions])
            } else {
                setSubmissions(newSubmissions)
            }

            // Update pagination state
            if (response.pagination) {
                setTotalPages(response.pagination.totalPages)
                setHasMore(page < response.pagination.totalPages)
                console.log(`[Submissions Page] Pagination: ${response.pagination.total} total, ${response.pagination.totalPages} pages`)
            } else {
                setHasMore(false)
            }

            setCurrentPage(page)
        } catch (err: any) {
            console.error("Failed to fetch submissions:", err)

            // Network error handling
            if (err.code === "NETWORK_ERROR" || !err.response) {
                setError(t("network.noConnection"))
            } else if (err.response?.status >= 500) {
                setError(t("errors.serverError"))
            } else if (err.response?.status === 401) {
                setError(t("errors.unauthorized"))
            } else {
                setError(err.message || t("submissions.failedToLoad"))
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
            setLoadingMore(false)
        }
    }

    const refreshSubmissions = useCallback(async () => {
        // Invalidate cache on refresh
        await submissionsApi.invalidateCache()
        setCurrentPage(1)
        setHasMore(true)
        fetchSubmissions(1, false)
    }, [])

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        // Invalidate cache on manual refresh
        await submissionsApi.invalidateCache()
        setCurrentPage(1)
        setHasMore(true)
        fetchSubmissions(1, false)
    }, [])

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            const nextPage = currentPage + 1
            fetchSubmissions(nextPage, true)
        }
    }, [loadingMore, hasMore, loading, currentPage])

    const handleFilterChange = useCallback((filterKey: keyof TabFilters, value: boolean) => {
        // Validate filter key
        if (!['inquiries', 'daily_record', 'interaction_records', 'complaint_details'].includes(filterKey)) {
            console.error("Invalid filter key:", filterKey)
            return
        }

        const newFilters = { ...tabFilters, [filterKey]: value }
        setTabFilters(newFilters)
        saveTabFilters(newFilters)
    }, [tabFilters])

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((submission) => {
            return tabFilters[submission.tableName]
        })
    }, [submissions, tabFilters])

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
                    onAction={fetchSubmissions}
                />
            </View>
        )
    }

    return (
        <View style={containerStyle}>
            <TabFilterBar
                filters={tabFilters}
                onFilterChange={handleFilterChange}
            />
            {filteredSubmissions.length === 0 ? (
                <EmptyState
                    icon="document-text-outline"
                    title={t("submissions.noSubmissions")}
                    message={t("submissions.noSubmissionsMessage")}
                />
            ) : (
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
                    {filteredSubmissions.map((submission) => (
                        <SubmissionCard
                            key={`${submission.tableName}-${submission.recordId}`}
                            submission={submission}
                            onPress={() => {
                                setSelectedSubmission(submission)
                                setShowDetailDialog(true)
                            }}
                        />
                    ))}

                    {hasMore && !loading && filteredSubmissions.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.loadMoreButton,
                                { backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5" }
                            ]}
                            onPress={handleLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <ActivityIndicator color="#ff4500" size="small" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="chevron-down"
                                        size={20}
                                        color={isDarkMode ? "#fff" : "#000"}
                                    />
                                    <Text
                                        style={[
                                            styles.loadMoreText,
                                            { color: isDarkMode ? "#fff" : "#000" }
                                        ]}
                                    >
                                        {t("common.actions.loadMore")}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}

            <SubmissionDetailDialog
                visible={showDetailDialog}
                submission={selectedSubmission}
                onClose={() => {
                    setShowDetailDialog(false)
                    setSelectedSubmission(null)
                }}
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
    loadMoreButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 20,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 8,
    },
})
