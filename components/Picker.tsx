import React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

interface PickerOption {
    label: string
    value: string
}

interface PickerProps {
    label: string
    value: string | undefined
    options: PickerOption[]
    onChange: (value: string) => void
    placeholder?: string
    error?: string
    disabled?: boolean
    required?: boolean
}

export function Picker({
    label,
    value,
    options,
    onChange,
    placeholder,
    error,
    disabled = false,
    required = false,
}: PickerProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [modalVisible, setModalVisible] = React.useState(false)

    const selectedOption = value ? options.find((opt) => opt.value === value) : undefined
    const displayValue = selectedOption ? selectedOption.label : placeholder

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

    const modalStyle = {
        ...styles.modalContent,
        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    }

    const optionStyle = {
        ...styles.option,
        borderBottomColor: isDarkMode ? "#333" : "#eee",
    }

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setModalVisible(false)
    }

    return (
        <View style={styles.container}>
            <Text style={labelStyle}>
                {label} {required && "*"}
            </Text>
            <TouchableOpacity
                style={inputStyle}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}
            >
                <Text
                    style={{
                        color: selectedOption
                            ? isDarkMode
                                ? "#fff"
                                : "#000"
                            : isDarkMode
                                ? "#666"
                                : "#999",
                    }}
                >
                    {displayValue}
                </Text>
            </TouchableOpacity>
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={modalStyle}>
                        <Text
                            style={{
                                ...styles.modalTitle,
                                color: isDarkMode ? "#fff" : "#000",
                            }}
                        >
                            {label}
                        </Text>
                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={optionStyle}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <Text
                                        style={{
                                            ...styles.optionText,
                                            color: isDarkMode ? "#fff" : "#000",
                                            fontWeight:
                                                option.value === value ? "bold" : "normal",
                                        }}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>{t("common.actions.close")}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        color: "#ff4444",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "70%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },
    optionsList: {
        maxHeight: 300,
    },
    option: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    optionText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "#3b82f6",
        borderRadius: 8,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
})
