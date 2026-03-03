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
import { dailyRecordsApi, type CreateDailyRecordRequest } from "../../api/dailyRecords"
import { PhotoUpload } from "../PhotoUpload"
import { filterContactInput } from "../../utils/contactValidation"
import { Picker } from "../Picker"

interface DailyRecordFormProps {
    onSuccess: () => void
    onDirtyChange?: (isDirty: boolean) => void
}

export function DailyRecordForm({ onSuccess, onDirtyChange }: DailyRecordFormProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const initialData: CreateDailyRecordRequest = {
        conditionStatus: "",
        feedbackContent: "",
        contactNumber: "",
        photo: undefined,
    }

    const [formData, setFormData] = useState<CreateDailyRecordRequest>(initialData)

    const checkIfDirty = (data: CreateDailyRecordRequest) => {
        const isDirty = data.conditionStatus !== "" ||
            data.feedbackContent !== "" ||
            data.contactNumber !== "" ||
            data.photo !== undefined
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

        if (!formData.conditionStatus) {
            newErrors.conditionStatus = t("forms.dailyRecord.errors.conditionRequired")
        }
        if (!formData.feedbackContent?.trim()) {
            newErrors.feedbackContent = t("forms.dailyRecord.errors.feedbackRequired")
        }
        if (formData.feedbackContent && formData.feedbackContent.trim().length < 2) {
            newErrors.feedbackContent = t("forms.validation.minLength", { min: 2 })
        }
        if (formData.contactNumber && formData.contactNumber.length < 2) {
            newErrors.contactNumber = t("forms.validation.minLength", { min: 2 })
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm() || submitting) return

        try {
            setSubmitting(true)
            const submitData = {
                conditionStatus: formData.conditionStatus,
                feedbackContent: formData.feedbackContent,
                contactNumber: formData.contactNumber || undefined,
                photo: formData.photo || undefined,
            }
            await dailyRecordsApi.createDailyRecord(submitData)
            onSuccess()
        } catch (error: any) {
            console.error("Failed to create daily record:", error)
            setErrors({ submit: t("forms.dailyRecord.errors.submitFailed") })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContent}>
                <Picker
                    label={t("forms.dailyRecord.fields.conditionStatus")}
                    value={formData.conditionStatus}
                    options={[
                        { label: t("enums.conditionStatus.Excellent"), value: "Excellent" },
                        { label: t("enums.conditionStatus.Good"), value: "Good" },
                        { label: t("enums.conditionStatus.Fair"), value: "Fair" },
                        { label: t("enums.conditionStatus.Poor"), value: "Poor" },
                    ]}
                    onChange={(value) => {
                        const newData = { ...formData, conditionStatus: value }
                        setFormData(newData)
                        checkIfDirty(newData)
                    }}
                    placeholder={t("forms.dailyRecord.placeholders.enterCondition")}
                    error={errors.conditionStatus}
                    disabled={submitting}
                    required
                />

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.dailyRecord.fields.feedbackContent")} *
                    </Text>
                    <TextInput
                        style={[inputStyle, styles.textArea]}
                        value={formData.feedbackContent}
                        onChangeText={(value) => {
                            const newData = { ...formData, feedbackContent: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.dailyRecord.placeholders.enterFeedback")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        multiline
                        numberOfLines={4}
                        editable={!submitting}
                    />
                    {errors.feedbackContent && (
                        <Text style={errorStyle}>{errors.feedbackContent}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.dailyRecord.fields.contactNumber")}
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.contactNumber}
                        onChangeText={(value) => {
                            const filtered = filterContactInput(value)
                            const newData = { ...formData, contactNumber: filtered }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.dailyRecord.placeholders.enterContact")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        keyboardType="phone-pad"
                        editable={!submitting}
                    />
                    {errors.contactNumber && (
                        <Text style={errorStyle}>{errors.contactNumber}</Text>
                    )}
                </View>

                <PhotoUpload
                    currentPhoto={formData.photo}
                    onPhotoChange={(photoUrl) => {
                        const newData = { ...formData, photo: photoUrl || undefined }
                        setFormData(newData)
                        checkIfDirty(newData)
                    }}
                    disabled={submitting}
                />

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
        </ScrollView>
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
