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
import { inquiriesApi, type CreateInquiryRequest } from "../../api/inquiries"
import { DatePicker } from "../DatePicker"
import { filterContactInput } from "../../utils/contactValidation"

interface InquiryFormProps {
    onSuccess: () => void
    onDirtyChange?: (isDirty: boolean) => void
}

export function InquiryForm({ onSuccess, onDirtyChange }: InquiryFormProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const initialDateValue = new Date().toISOString().split("T")[0]
    const initialData: CreateInquiryRequest = {
        dateOfInquiry: initialDateValue,
        inquirerName: "",
        inquirerContact: "",
        typeOfInquiry: "",
        inquiryContent: "",
        progressStatus: "OPEN",
    }

    const [formData, setFormData] = useState<CreateInquiryRequest>(initialData)

    const checkIfDirty = (data: CreateInquiryRequest) => {
        const isDirty = data.dateOfInquiry !== initialDateValue ||
            data.inquirerName !== "" ||
            data.inquirerContact !== "" ||
            data.typeOfInquiry !== "" ||
            data.inquiryContent !== ""
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

        if (!formData.dateOfInquiry) {
            newErrors.dateOfInquiry = t("forms.inquiry.errors.dateRequired")
        }
        if (!formData.inquirerName?.trim()) {
            newErrors.inquirerName = t("forms.inquiry.errors.nameRequired")
        }
        if (!formData.inquirerContact?.trim()) {
            newErrors.inquirerContact = t("forms.inquiry.errors.contactRequired")
        }
        if (formData.inquirerContact && formData.inquirerContact.length < 2) {
            newErrors.inquirerContact = t("forms.validation.minLength", { min: 2 })
        }
        if (!formData.typeOfInquiry) {
            newErrors.typeOfInquiry = t("forms.inquiry.errors.typeRequired")
        }
        if (!formData.inquiryContent?.trim()) {
            newErrors.inquiryContent = t("forms.inquiry.errors.contentRequired")
        }
        if (formData.inquiryContent && formData.inquiryContent.trim().length < 2) {
            newErrors.inquiryContent = t("forms.validation.minLength", { min: 2 })
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm() || submitting) return

        try {
            setSubmitting(true)
            const submitData = {
                dateOfInquiry: formData.dateOfInquiry,
                inquirerName: formData.inquirerName,
                inquirerContact: formData.inquirerContact,
                typeOfInquiry: formData.typeOfInquiry,
                inquiryContent: formData.inquiryContent,
                progressStatus: "OPEN",
            }
            await inquiriesApi.createInquiry(submitData)
            onSuccess()
        } catch (error: any) {
            console.error("Failed to create inquiry:", error)
            setErrors({ submit: t("forms.inquiry.errors.submitFailed") })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContent}>
                <DatePicker
                    label={`${t("forms.inquiry.fields.dateOfInquiry")} *`}
                    value={formData.dateOfInquiry}
                    onChange={(value) => {
                        const newData = { ...formData, dateOfInquiry: value }
                        setFormData(newData)
                        checkIfDirty(newData)
                    }}
                    error={errors.dateOfInquiry}
                    disabled={submitting}
                />

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.inquiry.fields.inquirerName")} *
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.inquirerName}
                        onChangeText={(value) => {
                            const newData = { ...formData, inquirerName: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.inquiry.placeholders.enterName")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                    {errors.inquirerName && (
                        <Text style={errorStyle}>{errors.inquirerName}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.inquiry.fields.inquirerContact")} *
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.inquirerContact}
                        onChangeText={(value) => {
                            const filtered = filterContactInput(value)
                            const newData = { ...formData, inquirerContact: filtered }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.inquiry.placeholders.enterContact")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        keyboardType="phone-pad"
                        editable={!submitting}
                    />
                    {errors.inquirerContact && (
                        <Text style={errorStyle}>{errors.inquirerContact}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.inquiry.fields.typeOfInquiry")} *
                    </Text>
                    <TextInput
                        style={inputStyle}
                        value={formData.typeOfInquiry}
                        onChangeText={(value) => {
                            const newData = { ...formData, typeOfInquiry: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.inquiry.placeholders.enterType")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        editable={!submitting}
                    />
                    {errors.typeOfInquiry && (
                        <Text style={errorStyle}>{errors.typeOfInquiry}</Text>
                    )}
                </View>

                <View style={styles.field}>
                    <Text style={labelStyle}>
                        {t("forms.inquiry.fields.inquiryContent")} *
                    </Text>
                    <TextInput
                        style={[inputStyle, styles.textArea]}
                        value={formData.inquiryContent}
                        onChangeText={(value) => {
                            const newData = { ...formData, inquiryContent: value }
                            setFormData(newData)
                            checkIfDirty(newData)
                        }}
                        placeholder={t("forms.inquiry.placeholders.enterContent")}
                        placeholderTextColor={isDarkMode ? "#666" : "#999"}
                        multiline
                        numberOfLines={4}
                        editable={!submitting}
                    />
                    {errors.inquiryContent && (
                        <Text style={errorStyle}>{errors.inquiryContent}</Text>
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
