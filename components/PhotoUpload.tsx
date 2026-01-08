"use client"

import { useState } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { apiClient } from "../api/client"

interface PhotoUploadProps {
    currentPhoto?: string | null
    onPhotoChange: (photoUrl: string | null) => void
    disabled?: boolean
}

export function PhotoUpload({
    currentPhoto,
    onPhotoChange,
    disabled = false,
}: PhotoUploadProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const pickImage = async () => {
        if (disabled || uploading) return

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

            if (!permissionResult.granted) {
                Alert.alert(
                    t("photoUpload.errors.permissionDenied"),
                    t("photoUpload.errors.permissionRequired")
                )
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri)
            }
        } catch (err) {
            console.error("Error picking image:", err)
            setError(t("photoUpload.errors.pickFailed"))
        }
    }

    const takePhoto = async () => {
        if (disabled || uploading) return

        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

            if (!permissionResult.granted) {
                Alert.alert(
                    t("photoUpload.errors.permissionDenied"),
                    t("photoUpload.errors.cameraPermissionRequired")
                )
                return
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri)
            }
        } catch (err) {
            console.error("Error taking photo:", err)
            setError(t("photoUpload.errors.captureFailed"))
        }
    }

    const uploadImage = async (uri: string) => {
        setUploading(true)
        setError(null)

        try {
            // Fetch the image as a blob
            const response = await fetch(uri)
            const blob = await response.blob()

            // Create FormData for backend upload
            const formData = new FormData()
            formData.append('photo', blob, 'photo.jpg')

            // Get auth token
            const token = await apiClient.getAuthToken()
            if (!token) {
                throw new Error('No authentication token available')
            }

            // Upload through backend API (bypasses CORS for Electron/web)
            const uploadResponse = await fetch(`${apiClient.getBaseUrl()}/mobile/uploads/daily-records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            })

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text()
                throw new Error(`Upload failed: ${uploadResponse.status}`)
            }

            const result = await uploadResponse.json()

            if (!result.success || !result.data?.filePath) {
                throw new Error('Invalid response from server')
            }

            onPhotoChange(result.data.filePath)
        } catch (err) {
            console.error("Error uploading image:", err)
            setError(t("photoUpload.errors.uploadFailed"))
        } finally {
            setUploading(false)
        }
    }

    const removePhoto = () => {
        if (disabled || uploading) return

        Alert.alert(
            t("photoUpload.confirmRemove.title"),
            t("photoUpload.confirmRemove.message"),
            [
                {
                    text: t("common.actions.cancel"),
                    style: "cancel",
                },
                {
                    text: t("common.actions.remove"),
                    style: "destructive",
                    onPress: () => {
                        onPhotoChange(null)
                        setError(null)
                    },
                },
            ]
        )
    }

    const containerStyle = {
        ...styles.container,
        borderColor: isDarkMode ? "#444" : "#ddd",
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    }

    const labelStyle = {
        ...styles.label,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const buttonStyle = {
        ...styles.button,
        backgroundColor: isDarkMode ? "#3b82f6" : "#3b82f6",
        opacity: disabled || uploading ? 0.5 : 1,
    }

    const removeButtonStyle = {
        ...styles.removeButton,
        backgroundColor: isDarkMode ? "#dc2626" : "#dc2626",
    }

    return (
        <View style={styles.wrapper}>
            <Text style={labelStyle}>{t("photoUpload.labels.photo")}</Text>

            {currentPhoto && (
                <View style={containerStyle}>
                    <Image
                        source={{ uri: currentPhoto }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    {!disabled && !uploading && (
                        <TouchableOpacity
                            style={styles.removeIconButton}
                            onPress={removePhoto}
                        >
                            <Ionicons name="close-circle" size={32} color="#dc2626" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {!currentPhoto && !uploading && (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[buttonStyle, styles.buttonHalf]}
                        onPress={takePhoto}
                        disabled={disabled || uploading}
                    >
                        <Ionicons name="camera" size={20} color="#fff" />
                        <Text style={styles.buttonText}>
                            {t("photoUpload.actions.takePhoto")}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[buttonStyle, styles.buttonHalf]}
                        onPress={pickImage}
                        disabled={disabled || uploading}
                    >
                        <Ionicons name="images" size={20} color="#fff" />
                        <Text style={styles.buttonText}>
                            {t("photoUpload.actions.choosePhoto")}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentPhoto && !uploading && (
                <TouchableOpacity
                    style={removeButtonStyle}
                    onPress={removePhoto}
                    disabled={disabled}
                >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.buttonText}>
                        {t("photoUpload.actions.removePhoto")}
                    </Text>
                </TouchableOpacity>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {uploading && (
                <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={[styles.statusText, { color: isDarkMode ? "#aaa" : "#666" }]}>
                        {t("photoUpload.status.uploading")}
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    container: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 8,
    },
    image: {
        width: "100%",
        height: 200,
        borderRadius: 8,
    },
    removeIconButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#fff",
        borderRadius: 16,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 8,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    buttonHalf: {
        flex: 1,
    },
    removeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    errorText: {
        color: "#dc2626",
        fontSize: 12,
        marginTop: 8,
    },
    uploadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 8,
    },
    statusText: {
        fontSize: 12,
    },
})
