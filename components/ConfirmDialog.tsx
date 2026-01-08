"use client"

import {
    View,
    Modal,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native"
import { useTheme } from "../contexts/ThemeContext"

interface ConfirmDialogProps {
    visible: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { isDarkMode } = useTheme()

    const overlayStyle = {
        ...styles.overlay,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    }

    const dialogStyle = {
        ...styles.dialog,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    }

    const titleStyle = {
        ...styles.title,
        color: isDarkMode ? "#fff" : "#000",
    }

    const messageStyle = {
        ...styles.message,
        color: isDarkMode ? "#ccc" : "#666",
    }

    const cancelButtonStyle = {
        ...styles.button,
        ...styles.cancelButton,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    }

    const cancelTextStyle = {
        ...styles.buttonText,
        color: isDarkMode ? "#fff" : "#000",
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={overlayStyle}>
                <View style={dialogStyle}>
                    <Text style={titleStyle}>{title}</Text>
                    <Text style={messageStyle}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={cancelButtonStyle}
                            onPress={onCancel}
                        >
                            <Text style={cancelTextStyle}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={onConfirm}
                        >
                            <Text style={[styles.buttonText, styles.confirmText]}>
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    dialog: {
        width: "100%",
        maxWidth: 400,
        borderRadius: 12,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.1)",
    },
    confirmButton: {
        backgroundColor: "#ef4444",
    },
    buttonText: {
        fontSize: 15,
        fontWeight: "600",
    },
    confirmText: {
        color: "#fff",
    },
})
