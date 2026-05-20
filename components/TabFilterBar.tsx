"use client"

import { memo } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

interface TabFilters {
    inquiries: boolean
    daily_record: boolean
    interaction_records: boolean
    complaint_details: boolean
}

interface TabFilterBarProps {
    filters: TabFilters
    onFilterChange: (filterKey: keyof TabFilters, value: boolean) => void
}

export const TabFilterBar = memo(function TabFilterBar({ filters, onFilterChange }: TabFilterBarProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()

    const tabs = [
        {
            key: "inquiries" as keyof TabFilters,
            title: t("forms.inquiry.title"),
            icon: "help-circle-outline" as const,
        },
        {
            key: "daily_record" as keyof TabFilters,
            title: t("forms.dailyRecord.title"),
            icon: "calendar-outline" as const,
        },
        {
            key: "interaction_records" as keyof TabFilters,
            title: t("forms.interactionRecord.title"),
            icon: "people-outline" as const,
        },
        {
            key: "complaint_details" as keyof TabFilters,
            title: t("forms.complaintDetail.title"),
            icon: "alert-circle-outline" as const,
        },
    ]

    const handleToggle = (key: keyof TabFilters) => {
        onFilterChange(key, !filters[key])
    }

    return (
        <View style={styles.container}>
            <View style={styles.scrollContent}>
                {tabs.map((tab) => {
                    const isActive = filters[tab.key]
                    const tabStyle = {
                        ...styles.tab,
                        backgroundColor: isActive
                            ? "#3b82f6"
                            : isDarkMode
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.04)",
                        borderWidth: 1,
                        borderColor: isActive
                            ? "#3b82f6"
                            : isDarkMode
                                ? "rgba(255,255,255,0.12)"
                                : "rgba(0,0,0,0.10)",
                    }
                    const iconColor = isActive ? "#fff" : isDarkMode ? "#aaa" : "#666"
                    const textColor = isActive ? "#fff" : isDarkMode ? "#aaa" : "#666"

                    const textLength = tab.title.length
                    const fontSize = textLength > 11 ? 10 : textLength > 9 ? 11 : textLength > 7 ? 12 : 13

                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={tabStyle}
                            onPress={() => handleToggle(tab.key)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={16}
                                color={iconColor}
                                style={styles.tabIcon}
                            />
                            <View style={styles.textContainer}>
                                <Text
                                    style={[
                                        styles.tabText,
                                        { color: textColor, fontSize },
                                        isActive && styles.tabTextActive
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {tab.title}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    )
})

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        borderTopColor: "rgba(0, 0, 0, 0.1)",
    },
    scrollContent: {
        flexDirection: "row",
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 6,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        paddingVertical: 8,
        borderRadius: 18,
        minWidth: 0,
    },
    tabIcon: {
        marginRight: 3,
        flexShrink: 0,
    },
    textContainer: {
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 1,
        minWidth: 0,
    },
    tabText: {
        textAlign: "center",
    },
    tabTextActive: {
        fontWeight: "600",
    },
})
