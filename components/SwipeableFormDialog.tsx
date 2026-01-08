"use client"

import { useState, useRef, useEffect } from "react"
import {
    View,
    Modal,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Text,
    ScrollView,
    Animated,
} from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useRefresh } from "../contexts/RefreshContext"
import { ConfirmDialog } from "./ConfirmDialog"
import { InquiryForm } from "./forms/InquiryForm"
import { DailyRecordForm } from "./forms/DailyRecordForm"
import { InteractionRecordForm } from "./forms/InteractionRecordForm"
import { ComplaintDetailForm } from "./forms/ComplaintDetailForm"

interface SwipeableFormDialogProps {
    visible: boolean
    onClose: () => void
    initialForm?: "inquiries" | "daily_record" | "interaction_records" | "complaint_details"
}

export function SwipeableFormDialog({
    visible,
    onClose,
    initialForm = "daily_record",
}: SwipeableFormDialogProps) {
    const { isDarkMode } = useTheme()
    const { t } = useLanguage()
    const { triggerRefresh } = useRefresh()

    const forms = ["inquiries", "daily_record", "interaction_records", "complaint_details"]
    const initialIndex = forms.indexOf(initialForm)
    const [currentFormIndex, setCurrentFormIndex] = useState(initialIndex >= 0 ? initialIndex : 1)
    const [dimensions, setDimensions] = useState(Dimensions.get("window"))
    const [containerWidth, setContainerWidth] = useState(0)
    const translateX = useRef(new Animated.Value(0)).current
    const currentIndexRef = useRef(currentFormIndex)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const containerRef = useRef<any>(null)

    useEffect(() => {
        if (typeof document !== 'undefined' && containerRef.current) {
            const element = containerRef.current
            if (element && element.style) {
                element.style.touchAction = 'pan-y'
                element.style.webkitUserSelect = 'none'
                element.style.userSelect = 'none'
                element.style.overscrollBehaviorX = 'none'
            }
        }

        if (typeof document !== 'undefined') {
            let touchStartX = 0
            let touchStartY = 0

            const preventDefaultTouch = (e: TouchEvent) => {
                if (e.touches.length === 1) {
                    const touch = e.touches[0]
                    const target = e.target as HTMLElement
                    if (target && containerRef.current && containerRef.current.contains(target)) {
                        touchStartX = touch.clientX
                        touchStartY = touch.clientY
                    }
                }
            }

            const preventDefaultMove = (e: TouchEvent) => {
                if (e.touches.length === 1) {
                    const touch = e.touches[0]
                    const target = e.target as HTMLElement
                    if (target && containerRef.current && containerRef.current.contains(target)) {
                        const deltaX = touch.clientX - touchStartX
                        const deltaY = touch.clientY - touchStartY
                        const absDeltaX = Math.abs(deltaX)
                        const absDeltaY = Math.abs(deltaY)

                        if (absDeltaX > absDeltaY && absDeltaX > 5) {
                            if (currentIndexRef.current === 0 && deltaX > 0) {
                                e.preventDefault()
                                e.stopPropagation()
                            } else if (currentIndexRef.current === forms.length - 1 && deltaX < 0) {
                                e.preventDefault()
                                e.stopPropagation()
                            } else if (absDeltaX > 10) {
                                e.preventDefault()
                            }
                        }
                    }
                }
            }

            document.addEventListener('touchstart', preventDefaultTouch, { passive: true })
            document.addEventListener('touchmove', preventDefaultMove, { passive: false })

            return () => {
                document.removeEventListener('touchstart', preventDefaultTouch)
                document.removeEventListener('touchmove', preventDefaultMove)
            }
        }
    }, [])

    useEffect(() => {
        const subscription = Dimensions.addEventListener("change", ({ window }) => {
            setDimensions(window)
        })
        return () => subscription?.remove()
    }, [])

    useEffect(() => {
        if (visible) {
            const newIndex = forms.indexOf(initialForm)
            if (newIndex >= 0) {
                setCurrentFormIndex(newIndex)
                currentIndexRef.current = newIndex
                if (containerWidth > 0) {
                    translateX.setValue(-newIndex * containerWidth)
                }
            }
        }
    }, [visible, initialForm, containerWidth])

    useEffect(() => {
        currentIndexRef.current = currentFormIndex
        if (containerWidth > 0) {
            Animated.spring(translateX, {
                toValue: -currentFormIndex * containerWidth,
                useNativeDriver: true,
                tension: 50,
                friction: 10,
            }).start()
        }
    }, [currentFormIndex, containerWidth])


    const handleFormSuccess = () => {
        setHasUnsavedChanges(false)
        triggerRefresh()
        onClose()
    }

    const handleDirtyChange = (isDirty: boolean) => {
        setHasUnsavedChanges(isDirty)
    }

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowConfirmDialog(true)
        } else {
            onClose()
        }
    }

    const handleConfirmDiscard = () => {
        setShowConfirmDialog(false)
        setHasUnsavedChanges(false)
        onClose()
    }

    const switchToForm = (index: number) => {
        if (index === currentFormIndex) return
        setCurrentFormIndex(index)
    }

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-20, 20])
        .maxPointers(1)
        .minDistance(0)
        .onBegin(() => {
            if (typeof window !== 'undefined' && window.history) {
                const state = window.history.state
                if (state) {
                    window.history.replaceState({ ...state, preventBack: true }, '')
                }
            }
        })
        .onUpdate((event) => {
            if (containerWidth === 0) return
            const baseOffset = -currentIndexRef.current * containerWidth
            let movement = event.translationX

            if ((currentIndexRef.current === 0 && movement > 0) ||
                (currentIndexRef.current === forms.length - 1 && movement < 0)) {
                movement = movement * 0.3
            }

            translateX.setValue(baseOffset + movement)
        })
        .onEnd((event) => {
            if (containerWidth === 0) return

            const threshold = containerWidth * 0.25
            const velocity = event.velocityX
            const translation = event.translationX

            let newIndex = currentIndexRef.current

            if (Math.abs(translation) > threshold || Math.abs(velocity) > 500) {
                if (translation > 0 && currentIndexRef.current > 0) {
                    newIndex = currentIndexRef.current - 1
                } else if (translation < 0 && currentIndexRef.current < forms.length - 1) {
                    newIndex = currentIndexRef.current + 1
                }
            }

            if (newIndex !== currentIndexRef.current) {
                setCurrentFormIndex(newIndex)
            } else {
                Animated.spring(translateX, {
                    toValue: -currentIndexRef.current * containerWidth,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }).start()
            }
        })
        .onFinalize(() => {
            if (containerWidth > 0) {
                Animated.spring(translateX, {
                    toValue: -currentIndexRef.current * containerWidth,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }).start()
            }
        })

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

    const getFormTitle = (formType: string) => {
        switch (formType) {
            case "inquiries":
                return t("forms.inquiry.title")
            case "daily_record":
                return t("forms.dailyRecord.title")
            case "interaction_records":
                return t("forms.interactionRecord.title")
            case "complaint_details":
                return t("forms.complaintDetail.title")
            default:
                return ""
        }
    }

    const getFormIcon = (formType: string) => {
        switch (formType) {
            case "inquiries":
                return "help-circle-outline"
            case "daily_record":
                return "calendar-outline"
            case "interaction_records":
                return "people-outline"
            case "complaint_details":
                return "alert-circle-outline"
            default:
                return "document-outline"
        }
    }

    const renderForm = (formType: string) => {
        switch (formType) {
            case "inquiries":
                return <InquiryForm onSuccess={handleFormSuccess} onDirtyChange={handleDirtyChange} />
            case "daily_record":
                return <DailyRecordForm onSuccess={handleFormSuccess} onDirtyChange={handleDirtyChange} />
            case "interaction_records":
                return <InteractionRecordForm onSuccess={handleFormSuccess} onDirtyChange={handleDirtyChange} />
            case "complaint_details":
                return <ComplaintDetailForm onSuccess={handleFormSuccess} onDirtyChange={handleDirtyChange} />
            default:
                return null
        }
    }

    const dialogWidth = Math.min(dimensions.width - 50, 600)
    const tabContainerPadding = 24
    const tabGap = 6
    const numTabs = 4
    const calculatedTabWidth = Math.floor((dialogWidth - tabContainerPadding - (tabGap * (numTabs - 1))) / numTabs)


    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={styles.gestureRoot}>
                <View style={overlayStyle}>
                    <TouchableOpacity
                        style={styles.overlayTouchable}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                    <View style={dialogStyle}>
                        <View style={headerStyle}>
                            <View style={styles.headerLeft}>
                                <Text style={titleStyle}>
                                    {t("forms.swipeableDialog.title")}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={closeButtonStyle}
                                onPress={handleClose}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={isDarkMode ? "#fff" : "#000"}
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.tabsContainer}
                            contentContainerStyle={styles.tabsContent}
                        >
                            {forms.map((form, index) => {
                                const isActive = index === currentFormIndex
                                const tabStyle = {
                                    ...styles.tab,
                                    width: calculatedTabWidth,
                                    backgroundColor: isActive
                                        ? "#3b82f6"
                                        : isDarkMode
                                            ? "rgba(255, 255, 255, 0.05)"
                                            : "rgba(0, 0, 0, 0.05)",
                                    borderColor: isActive
                                        ? "#3b82f6"
                                        : isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "rgba(0, 0, 0, 0.1)",
                                }
                                const tabTextStyle = {
                                    ...styles.tabText,
                                    color: isActive
                                        ? "#fff"
                                        : isDarkMode
                                            ? "#aaa"
                                            : "#666",
                                    fontWeight: (isActive ? "600" : "400") as "600" | "400",
                                }

                                return (
                                    <TouchableOpacity
                                        key={form}
                                        style={tabStyle}
                                        onPress={() => switchToForm(index)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={getFormIcon(form) as any}
                                            size={16}
                                            color={isActive ? "#fff" : isDarkMode ? "#aaa" : "#666"}
                                            style={styles.tabIcon}
                                        />
                                        <Text style={tabTextStyle} numberOfLines={1} ellipsizeMode="tail">
                                            {getFormTitle(form)}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </ScrollView>

                        <View style={styles.indicatorContainer}>
                            {forms.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicator,
                                        {
                                            backgroundColor:
                                                index === currentFormIndex
                                                    ? "#3b82f6"
                                                    : isDarkMode
                                                        ? "#444"
                                                        : "#ddd",
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        <View
                            ref={containerRef}
                            style={styles.swipeableContainer}
                            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                        >
                            <GestureDetector gesture={panGesture}>
                                <Animated.View
                                    style={[
                                        styles.formsWrapper,
                                        {
                                            width: containerWidth * forms.length,
                                            transform: [{ translateX }],
                                        },
                                    ]}
                                    onStartShouldSetResponder={() => true}
                                    onMoveShouldSetResponder={() => true}
                                >
                                    {forms.map((form, index) => (
                                        <View
                                            key={form}
                                            style={[styles.formContainer, { width: containerWidth }]}
                                        >
                                            {Math.abs(index - currentFormIndex) <= 1 && renderForm(form)}
                                        </View>
                                    ))}
                                </Animated.View>
                            </GestureDetector>
                        </View>
                    </View>
                </View>
            </GestureHandlerRootView>

            <ConfirmDialog
                visible={showConfirmDialog}
                title={t("forms.swipeableDialog.confirmTitle")}
                message={t("forms.swipeableDialog.confirmDiscard")}
                confirmText={t("common.actions.discard")}
                cancelText={t("common.actions.cancel")}
                onConfirm={handleConfirmDiscard}
                onCancel={() => setShowConfirmDialog(false)}
            />
        </Modal>
    )
}


const styles = StyleSheet.create({
    gestureRoot: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
        marginTop: -20,
    },
    overlayTouchable: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    dialog: {
        width: "100%",
        maxWidth: 600,
        height: "90%",
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
    tabsContainer: {
        maxHeight: 52,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0, 0, 0, 0.1)",
    },
    tabsContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
    },
    tabIcon: {
        marginRight: 5,
        flexShrink: 0,
    },
    tabText: {
        fontSize: 13,
        flex: 1,
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 6,
        gap: 6,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    swipeableContainer: {
        flex: 1,
        overflow: "hidden",
        // @ts-ignore - web-only CSS property
        touchAction: "pan-y",
    },
    formsWrapper: {
        flexDirection: "row",
        height: "100%",
        // @ts-ignore - web-only CSS property
        touchAction: "pan-y",
    },
    formContainer: {
        height: "100%",
    },
})
