"use client"

import { useState } from "react"
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useNetworkStatus } from "../hooks/useNetworkStatus"
import { authApi } from "../api/auth"

interface ChangePasswordDialogProps {
    visible: boolean
    onClose: () => void
}

export function ChangePasswordDialog({ visible, onClose }: ChangePasswordDialogProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { isOnline } = useNetworkStatus()

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

    const inputStyle = {
        ...styles.input,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
        color: isDarkMode ? "#fff" : "#000",
        borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
    }

    const labelStyle = {
        ...styles.label,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const handleClose = () => {
        // Reset form on close
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setError(null)
        setSuccessMessage(null)
        onClose()
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccessMessage(null)

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(t("auth.errors.emptyFields"))
            return
        }

        if (newPassword !== confirmPassword) {
            setError(t("auth.changePassword.passwordsDoNotMatch"))
            return
        }

        if (newPassword.length < 6) {
            setError(t("auth.changePassword.passwordTooShort"))
            return
        }

        if (!isOnline) {
            setError(t("network.noConnection"))
            return
        }

        setIsSubmitting(true)

        try {
            await authApi.changePassword({ currentPassword, newPassword })
            setSuccessMessage(t("auth.changePassword.success"))

            // Auto close after 2 seconds
            setTimeout(() => {
                handleClose()
            }, 2000)

        } catch (err: any) {
            console.error("Change password failed:", err)
            let errorMsg = err.message || t("errors.general");
            if (errorMsg.includes("Incorrect current password")) {
                errorMsg = t("auth.changePassword.incorrectCurrentPassword");
            } else if (errorMsg.includes("Network error") || errorMsg.includes("No internet")) {
                errorMsg = t("network.noConnection");
            } else if (errorMsg.includes("Invalid credentials") || errorMsg.includes("User not found")) {
                errorMsg = t("auth.errors.invalidCredentials");
            }
            setError(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={overlayStyle}
                activeOpacity={1}
                onPress={handleClose}
            >
                <TouchableOpacity
                    style={dialogStyle}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={headerStyle}>
                        <View style={styles.headerLeft}>
                            <Text style={titleStyle}>{t("auth.changePassword.title")}</Text>
                        </View>
                        <TouchableOpacity
                            style={closeButtonStyle}
                            onPress={handleClose}
                            disabled={isSubmitting}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color={isDarkMode ? "#fff" : "#000"}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {Boolean(error) && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#ff4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {Boolean(successMessage) && (
                            <View style={styles.successContainer}>
                                <Ionicons name="checkmark-circle" size={20} color="#00C851" />
                                <Text style={styles.successText}>{successMessage}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={labelStyle}>{t("auth.changePassword.currentPassword")}</Text>
                            <TextInput
                                style={inputStyle}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                editable={!isSubmitting && !successMessage}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={labelStyle}>{t("auth.changePassword.newPassword")}</Text>
                            <TextInput
                                style={inputStyle}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                editable={!isSubmitting && !successMessage}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={labelStyle}>{t("auth.changePassword.confirmPassword")}</Text>
                            <TextInput
                                style={inputStyle}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!isSubmitting && !successMessage}
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor: (isSubmitting || !!successMessage)
                                        ? "#999"
                                        : "#ff4500",
                                }
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !!successMessage}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {t("common.actions.submit")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
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
        maxWidth: 500,
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
    content: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 68, 68, 0.1)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        color: "#ff4444",
        fontSize: 14,
        flex: 1,
    },
    successContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 200, 81, 0.1)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    successText: {
        color: "#00C851",
        fontSize: 14,
        flex: 1,
    },
    submitButton: {
        height: 48,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
})
