"use client"

import { useState } from "react"
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native"
import { useTheme } from "../../contexts/ThemeContext"
import { useLanguage } from "../../contexts/LanguageContext"
import { interactionRecordsApi, type CreateInteractionRecordRequest } from "../../api/interactionRecords"
import { Picker } from "../Picker"

interface InteractionRecordFormProps {
    onSuccess: () => void
    onDirtyChange?: (isDirty: boolean) => void
}

export function InteractionRecordForm({ onSuccess, onDirtyChange }: InteractionRecordFormProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const initialData: CreateInteractionRecordRequest = {
        type: "DISCUSSION",
        description: "",
        status: "IN_PROGRESS",
        name: "",
        title: "",
        location: "",
        means: "",
        responseDetails: "",
    }

    const [formData, setFormData] = useState<CreateInteractionRecordRequest>(initialData)

    const checkIfDirty = (data: CreateInteractionRecordRequest) => {
        const isDirty = data.description !== "" ||
            data.name !== "" ||
            data.title !== "" ||
            data.location !== "" ||
            data.means !== "" ||
            data.responseDetails !== ""
        onDirtyChange?.(isDirty)
    }

    const inputStyle = {
        ...styles.input,
        backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
        color: isDarkMode ? "#fff" : "#000",
        borderColor: isDarkMode ? "#444" : "#ddd",
    }

    const labelStyle = {
        ...styles.label,
        color: isDarkMode ? "#aaa" : "#666",
    }

    const errorStyle = {
        ...styles.errorText,
        color: "#ff4444",
    }

    const submitButtonStyle = {
        ...styles.submitButton,
        backgroundColor: submitting ? "#999" : "#3b82f6",
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.description?.trim()) {
            newErrors.description = t("forms.interactionRecord.errors.descriptionRequired")
        }
        if (formData.description && formData.description.trim().length < 10) {
            newErrors.description = t("forms.validation.minLength", { min: 10 })
        }
        if (formData.responseDetails && formData.responseDetails.trim().length < 10) {
            newErrors.responseDetails = t("forms.validation.minLength", { min: 10 })
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm() || submitting) return

        try {
            setSubmitting(true)
            const submitData = {
                type: "DISCUSSION",
                description: formData.description,
                status: "IN_PROGRESS",
                name: formData.name || undefined,
                title: formData.title || undefined,
                location: formData.location || undefined,
                means: formData.means || undefined,
                responseDetails: formData.responseDetails || undefined,
            }
            await interactionRecordsApi.createInteractionRecord(submitData)
            onSuccess()
        } catch (error: any) {
            console.error("Failed to create interaction record:", error)
            setErrors({ submit: t("forms.interactionRecord.errors.submitFailed") })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContent}>
                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.interactionRecord.fields.name")}
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.name}
                        onChangeText={(value) => {
                            const newData = { ...formData, name: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.interactionRecord.placeholders.enterName")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.interactionRecord.fields.title")}
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.title}
                        onChangeText={(value) => {
                            const newData = { ...formData, title: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.interactionRecord.placeholders.enterTitle")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.interactionRecord.fields.description")} *
                    </Text>
                    <TextInput
                        style={[inputStyle, styles.textArea]}
                        value={formData.description}
                        onChangeText={(value) => {
                            const newData = { ...formData, description: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.interactionRecord.placeholders.enterDescription")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        multiline
                        numberOfLines={4}
                        editable={!submitting}
                    />
                    {errors.description && (
                        <Text style={errorStyle}>{errors.description}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.interactionRecord.fields.location")}
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.location}
                        onChangeText={(value) => {
                            const newData = { ...formData, location: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.interactionRecord.placeholders.enterLocation")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                </View>

                <Picker
                    label={t("forms.interactionRecord.fields.means")}
                    value={formData.means}
                    options={[
                        { label: t("enums.interactionMeans.FACE_TO_FACE"), value: "FACE_TO_FACE" },
                        { label: t("enums.interactionMeans.ONLINE"), value: "ONLINE" },
                        { label: t("enums.interactionMeans.PHONE"), value: "PHONE" },
                        { label: t("enums.interactionMeans.EMAIL"), value: "EMAIL" },
                    ]}
                    onChange={(value) => {
                        const newData = { ...formData, means: value }
                        setFormData(newData)
                        checkIfDirty(newData)
                    }}
                    placeholder={t("forms.interactionRecord.placeholders.enterMeans")}
                    disabled={submitting}
                />

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.interactionRecord.fields.responseDetails")}
                    </Text>
                    <TextInput
                        style={[inputStyle, styles.textArea]}
                        value={formData.responseDetails}
                        onChangeText={(value) => {
                            const newData = { ...formData, responseDetails: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.interactionRecord.placeholders.enterResponse")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        multiline
                        numberOfLines={4}
                        editable={!submitting}
                    />
                    {errors.responseDetails && (
                        <Text style={errorStyle}>{errors.responseDetails}</Text>
                    )}
                </View>

                {errors.submit && (
                    <Text style={[errorStyle, styles.submitError]}>
                        {errors.submit}
                    </Text>
                )}

                <TouchableOpacity
                    style={submitButtonStyle}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {t("common.actions.submit")}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    formContent: {
        padding: 20,
    },
    field: {
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
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    submitError: {
        textAlign: "center",
        marginBottom: 12,
    },
    submitButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
})
