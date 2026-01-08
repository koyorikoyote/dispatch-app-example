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
import { complaintDetailsApi, type CreateComplaintDetailRequest } from "../../api/complaintDetails"
import { filterContactInput } from "../../utils/contactValidation"
import { Picker } from "../Picker"

interface ComplaintDetailFormProps {
    onSuccess: () => void
    onDirtyChange?: (isDirty: boolean) => void
}

export function ComplaintDetailForm({ onSuccess, onDirtyChange }: ComplaintDetailFormProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const initialData: CreateComplaintDetailRequest = {
        complainerName: "",
        complainerContact: "",
        personInvolved: "",
        progressStatus: "OPEN",
        urgencyLevel: "",
        complaintContent: "",
    }

    const [formData, setFormData] = useState<CreateComplaintDetailRequest>(initialData)

    const checkIfDirty = (data: CreateComplaintDetailRequest) => {
        const isDirty = data.complainerName !== "" ||
            data.complainerContact !== "" ||
            data.personInvolved !== "" ||
            data.complaintContent !== ""
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

        if (!formData.complainerName?.trim()) {
            newErrors.complainerName = t("forms.complaintDetail.errors.nameRequired")
        }
        if (formData.complainerContact && formData.complainerContact.length < 10) {
            newErrors.complainerContact = t("forms.validation.minLength", { min: 10 })
        }
        if (!formData.complaintContent?.trim()) {
            newErrors.complaintContent = t("forms.complaintDetail.errors.contentRequired")
        }
        if (formData.complaintContent && formData.complaintContent.trim().length < 10) {
            newErrors.complaintContent = t("forms.validation.minLength", { min: 10 })
        }
        if (!formData.urgencyLevel) {
            newErrors.urgencyLevel = t("forms.complaintDetail.errors.urgencyRequired")
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm() || submitting) return

        try {
            setSubmitting(true)
            const submitData = {
                complainerName: formData.complainerName,
                complainerContact: formData.complainerContact || undefined,
                personInvolved: formData.personInvolved || undefined,
                urgencyLevel: formData.urgencyLevel,
                complaintContent: formData.complaintContent,
                progressStatus: "OPEN",
            }
            await complaintDetailsApi.createComplaintDetail(submitData)
            onSuccess()
        } catch (error: any) {
            console.error("Failed to create complaint detail:", error)
            setErrors({ submit: t("forms.complaintDetail.errors.submitFailed") })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContent}>
                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.complaintDetail.fields.complainerName")} *
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.complainerName}
                        onChangeText={(value) => {
                            const newData = { ...formData, complainerName: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.complaintDetail.placeholders.enterName")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                    {errors.complainerName && (
                        <Text style={errorStyle}>{errors.complainerName}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.complaintDetail.fields.complainerContact")}
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.complainerContact}
                        onChangeText={(value) => {
                            const filtered = filterContactInput(value)
                            const newData = { ...formData, complainerContact: filtered }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.complaintDetail.placeholders.enterContact")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        keyboardType="phone-pad"
                        editable={!submitting}
                    />
                    {errors.complainerContact && (
                        <Text style={errorStyle}>{errors.complainerContact}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.complaintDetail.fields.personInvolved")}
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.personInvolved}
                        onChangeText={(value) => {
                            const newData = { ...formData, personInvolved: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.complaintDetail.placeholders.enterPerson")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                </View>

                <Picker
                    label={t("forms.complaintDetail.fields.urgencyLevel")}
                    value={formData.urgencyLevel}
                    options={[
                        { label: t("enums.urgencyLevel.High"), value: "High" },
                        { label: t("enums.urgencyLevel.Medium"), value: "Medium" },
                        { label: t("enums.urgencyLevel.Low"), value: "Low" },
                    ]}
                    onChange={(value) => {
                        const newData = { ...formData, urgencyLevel: value }
                        setFormData(newData)
                        checkIfDirty(newData)
                    }}
                    placeholder={t("forms.complaintDetail.placeholders.enterUrgency")}
                    error={errors.urgencyLevel}
                    disabled={submitting}
                    required
                />

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.complaintDetail.fields.complaintContent")} *
                    </Text>
                    <TextInput
                        style={[inputStyle, styles.textArea]}
                        value={formData.complaintContent}
                        onChangeText={(value) => {
                            const newData = { ...formData, complaintContent: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.complaintDetail.placeholders.enterContent")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        multiline
                        numberOfLines={4}
                        editable={!submitting}
                    />
                    {errors.complaintContent && (
                        <Text style={errorStyle}>{errors.complaintContent}</Text>
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
