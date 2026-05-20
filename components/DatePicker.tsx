"use client"

import { useState } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

interface DatePickerProps {
    value: string
    onChange: (date: string) => void
    label: string
    error?: string
    disabled?: boolean
    minDate?: string
    maxDate?: string
}

export function DatePicker({ value, onChange, label, error, disabled, minDate, maxDate }: DatePickerProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [showPicker, setShowPicker] = useState(false)

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date()
        const parts = dateStr.split("-")
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }

    const [selectedDate, setSelectedDate] = useState(() => {
        if (value) return parseDate(value)
        return new Date()
    })

    const inputStyle = {
        ...styles.input,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
        color: isDarkMode ? "#fff" : "#000",
        borderColor: error ? "#ff4444" : isDarkMode ? "#444" : "#ddd",
    }

    const labelStyle = {
        ...styles.label,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const handleConfirm = () => {
        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
        const day = String(selectedDate.getDate()).padStart(2, "0")
        const dateStr = `${year}-${month}-${day}`
        onChange(dateStr)
        setShowPicker(false)
    }

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return t("datePicker.selectDate")
        const parts = dateStr.split("-")
        return `${parts[0]}/${parts[1]}/${parts[2]}`
    }

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    const changeMonth = (delta: number) => {
        const newDate = new Date(selectedDate)
        newDate.setMonth(newDate.getMonth() + delta)
        setSelectedDate(newDate)
    }

    const renderCalendar = () => {
        const year = selectedDate.getFullYear()
        const month = selectedDate.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const today = new Date()
        const selectedDay = selectedDate.getDate()

        const days = []
        const dayNames = [
            t("datePicker.dayNames.sun"),
            t("datePicker.dayNames.mon"),
            t("datePicker.dayNames.tue"),
            t("datePicker.dayNames.wed"),
            t("datePicker.dayNames.thu"),
            t("datePicker.dayNames.fri"),
            t("datePicker.dayNames.sat")
        ]

        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = day === selectedDay
            const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()

            const currentDate = new Date(year, month, day)
            const minDateObj = minDate ? parseDate(minDate) : null
            const maxDateObj = maxDate ? parseDate(maxDate) : null

            const isDisabled = Boolean(
                (minDateObj && currentDate < minDateObj) ||
                (maxDateObj && currentDate > maxDateObj)
            )

            days.push(
                <TouchableOpacity
                    key={day}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay,
                        isToday && !isSelected && styles.todayDay,
                        isDisabled && styles.disabledDay,
                    ]}
                    onPress={() => {
                        if (isDisabled) return
                        const newDate = new Date(year, month, day)
                        setSelectedDate(newDate)
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        onChange(dateStr)
                        setShowPicker(false)
                    }}
                    disabled={isDisabled}
                >
                    <Text
                        style={[
                            styles.dayText,
                            { color: isDarkMode ? "#fff" : "#000" },
                            isSelected && styles.selectedDayText,
                            isToday && !isSelected && styles.todayDayText,
                            isDisabled && styles.disabledDayText,
                        ]}
                    >
                        {day}
                    </Text>
                </TouchableOpacity>
            )
        }

        return (
            <View>
                <View style={styles.dayNamesRow}>
                    {dayNames.map((name) => (
                        <View key={name} style={styles.dayNameCell}>
                            <Text style={[styles.dayNameText, { color: isDarkMode ? "#aaa" : "#666" }]}>
                                {name}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={styles.daysGrid}>{days}</View>
            </View>
        )
    }

    const monthNames = [
        t("datePicker.monthNames.january"),
        t("datePicker.monthNames.february"),
        t("datePicker.monthNames.march"),
        t("datePicker.monthNames.april"),
        t("datePicker.monthNames.may"),
        t("datePicker.monthNames.june"),
        t("datePicker.monthNames.july"),
        t("datePicker.monthNames.august"),
        t("datePicker.monthNames.september"),
        t("datePicker.monthNames.october"),
        t("datePicker.monthNames.november"),
        t("datePicker.monthNames.december")
    ]

    return (
        <View style={styles.container}>
            <Text style={labelStyle}>{label}</Text>
            <TouchableOpacity
                style={inputStyle}
                onPress={() => !disabled && setShowPicker(true)}
                disabled={disabled}
            >
                <Text style={{ color: isDarkMode ? "#fff" : "#000", fontSize: 14 }}>
                    {formatDisplayDate(value)}
                </Text>
                <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={isDarkMode ? "#aaa" : "#666"}
                />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={showPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPicker(false)}
                >
                    <TouchableOpacity
                        style={[styles.pickerContainer, { backgroundColor: isDarkMode ? "#1a1a1b" : "#fff" }]}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Text style={[styles.headerButton, { color: "#666" }]}>{t("datePicker.cancel")}</Text>
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
                                {t("datePicker.selectDateTitle")}
                            </Text>
                            <TouchableOpacity onPress={handleConfirm}>
                                <Text style={[styles.headerButton, { color: "#3b82f6" }]}>{t("datePicker.done")}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.monthNavigation}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                                <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
                            </TouchableOpacity>
                            <Text style={[styles.monthYearText, { color: isDarkMode ? "#fff" : "#000" }]}>
                                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                                <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#fff" : "#000"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.calendarScroll}>
                            {renderCalendar()}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
    },
    input: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    errorText: {
        fontSize: 12,
        color: "#ff4444",
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0)",
    },
    pickerContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: 600,
        maxWidth: 450,
        width: "100%",
        alignSelf: "center",
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0, 0, 0, 0.1)",
    },
    headerButton: {
        fontSize: 16,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "bold",
    },
    monthNavigation: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    navButton: {
        padding: 8,
    },
    monthYearText: {
        fontSize: 18,
        fontWeight: "600",
    },
    calendarScroll: {
        paddingHorizontal: 16,
    },
    dayNamesRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    dayNameCell: {
        width: `${100 / 7}%`,
        alignItems: "center",
        paddingVertical: 8,
    },
    dayNameText: {
        fontSize: 12,
        fontWeight: "600",
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        minHeight: 288,
    },
    dayCell: {
        width: `${100 / 7}%`,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        padding: 4,
    },
    selectedDay: {
        backgroundColor: "#3b82f6",
        borderRadius: 8,
    },
    todayDay: {
        borderWidth: 2,
        borderColor: "#3b82f6",
        borderRadius: 8,
    },
    dayText: {
        fontSize: 16,
    },
    selectedDayText: {
        color: "#fff",
        fontWeight: "bold",
    },
    todayDayText: {
        color: "#3b82f6",
        fontWeight: "600",
    },
    disabledDay: {
        opacity: 0.3,
    },
    disabledDayText: {
        color: "#999",
    },
})
