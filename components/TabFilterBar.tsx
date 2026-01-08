"use client"

import { memo } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
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
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {tabs.map((tab) => {
                    const isActive = filters[tab.key]
                    const tabStyle = {
                        ...styles.tab,
                        backgroundColor: isActive ? "#3b82f6" : "transparent",
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
            </ScrollView>
        </View>
    )
})

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0, 0, 0, 0.1)",
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 8,
        flexGrow: 1,
        justifyContent: "center",
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 18,
        width: 90,
    },
    tabIcon: {
        marginRight: 4,
        flexShrink: 0,
    },
    textContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    tabText: {
        textAlign: "center",
    },
    tabTextActive: {
        fontWeight: "600",
    },
})
