"use client"

import { useState, useRef } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

export type DateFilterMode = "last7days" | "month" | "year"

export interface DateFilterState {
    mode: DateFilterMode
    month: number   // 1-12
    year: number
}

function getTodayLocal(): Date {
    return new Date()
}

export function getDefaultDateFilter(): DateFilterState {
    const now = getTodayLocal()
    return {
        mode: "last7days",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    }
}

/** Returns the [start, end] date range for a given filter state (inclusive, midnight boundaries). */
export function getDateRange(filter: DateFilterState): { start: Date; end: Date } {
    const now = getTodayLocal()
    if (filter.mode === "last7days") {
        const start = new Date(now)
        start.setDate(start.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        const end = new Date(now)
        end.setHours(23, 59, 59, 999)
        return { start, end }
    }
    if (filter.mode === "month") {
        const start = new Date(filter.year, filter.month - 1, 1, 0, 0, 0, 0)
        const end = new Date(filter.year, filter.month, 0, 23, 59, 59, 999)
        return { start, end }
    }
    // year
    const start = new Date(filter.year, 0, 1, 0, 0, 0, 0)
    const end = new Date(filter.year, 11, 31, 23, 59, 59, 999)
    return { start, end }
}

interface DateFilterWidgetProps {
    filter: DateFilterState
    onChange: (filter: DateFilterState) => void
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function DateFilterWidget({ filter, onChange }: DateFilterWidgetProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)
    const [panelTop, setPanelTop] = useState(0)
    const [panelLeft, setPanelLeft] = useState(0)
    const btnRef = useRef<any>(null)

    const now = getTodayLocal()
    const currentYear = now.getFullYear()
    // Show 3 years back and current year
    const years = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i)

    const colors = {
        bg: isDarkMode ? "#1f1f20" : "#f5f5f5",
        card: isDarkMode ? "#2d2d2e" : "#ffffff",
        border: isDarkMode ? "#3a3a3b" : "#e0e0e0",
        text: isDarkMode ? "#e0e0e0" : "#333",
        sub: isDarkMode ? "#888" : "#777",
        accent: "#3b82f6",
        chip: isDarkMode ? "#3a3a3b" : "#efefef",
        chipActive: "#3b82f6",
    }

    return (
        <>
            {/* Icon-only trigger */}
            <TouchableOpacity
                ref={btnRef}
                style={[
                    styles.iconBtn,
                    { backgroundColor: isDarkMode ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)" },
                ]}
                onPress={() => {
                    if (btnRef.current) {
                        btnRef.current.measure((_x: number, _y: number, _w: number, height: number, pageX: number, pageY: number) => {
                            setPanelTop(pageY + height + 6)
                            setPanelLeft(pageX)
                            setOpen(true)
                        })
                    } else {
                        setOpen(true)
                    }
                }}
                activeOpacity={0.7}
            >
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
            </TouchableOpacity>

            {/* Picker modal */}
            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
                statusBarTranslucent={Platform.OS === "android"}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View
                        style={[
                            styles.panel,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                position: "absolute",
                                top: panelTop,
                                left: panelLeft,
                                right: 16,
                            },
                        ]}
                    >
                        {/* Mode selector */}
                        <View style={styles.modeRow}>
                            {(["last7days", "month", "year"] as DateFilterMode[]).map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.modeBtn,
                                        {
                                            backgroundColor: filter.mode === m ? colors.chipActive : colors.chip,
                                            borderColor: filter.mode === m ? colors.chipActive : colors.border,
                                        },
                                    ]}
                                    onPress={() => onChange({ ...filter, mode: m })}
                                >
                                    <Text style={[styles.modeBtnText, { color: filter.mode === m ? "#fff" : colors.text }]}>
                                        {t(`dateFilter.${m}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Month picker */}
                        {filter.mode === "month" && (
                            <>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.monthRow}>
                                        {MONTH_SHORT.map((name, i) => {
                                            const active = filter.month === i + 1
                                            return (
                                                <TouchableOpacity
                                                    key={i}
                                                    style={[
                                                        styles.monthBtn,
                                                        { backgroundColor: active ? colors.chipActive : colors.chip, borderColor: active ? colors.chipActive : colors.border },
                                                    ]}
                                                    onPress={() => onChange({ ...filter, month: i + 1 })}
                                                >
                                                    <Text style={[styles.monthBtnText, { color: active ? "#fff" : colors.text }]}>{name}</Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* Year picker */}
                        {(filter.mode === "month" || filter.mode === "year") && (
                            <>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <View style={styles.yearRow}>
                                    {years.map((yr) => {
                                        const active = filter.year === yr
                                        return (
                                            <TouchableOpacity
                                                key={yr}
                                                style={[
                                                    styles.yearBtn,
                                                    { backgroundColor: active ? colors.chipActive : colors.chip, borderColor: active ? colors.chipActive : colors.border },
                                                ]}
                                                onPress={() => onChange({ ...filter, year: yr })}
                                            >
                                                <Text style={[styles.yearBtnText, { color: active ? "#fff" : colors.text }]}>{yr}</Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    iconBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    panel: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    modeRow: {
        flexDirection: "row",
        gap: 6,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
    },
    modeBtnText: {
        fontSize: 11,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    monthRow: {
        flexDirection: "row",
        gap: 5,
    },
    monthBtn: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: "center",
    },
    monthBtnText: {
        fontSize: 11,
        fontWeight: "500",
    },
    yearRow: {
        flexDirection: "row",
        gap: 6,
        flexWrap: "wrap",
    },
    yearBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: "center",
    },
    yearBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
})
