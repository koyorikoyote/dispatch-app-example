"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { View, StyleSheet, Dimensions, Animated, Platform } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { saveNavigationState, loadNavigationState } from "../utils/statePersistence"
import { useTheme } from "../contexts/ThemeContext"
import { useSwipe } from "../contexts/SwipeContext"

interface SwipeablePagesProps {
    initialPage?: "notifications" | "submissions"
    children: [ReactNode, ReactNode]
}

export function SwipeablePages({
    initialPage = "notifications",
    children,
}: SwipeablePagesProps) {
    const { isDarkMode } = useTheme()
    const { setSwipeInProgress } = useSwipe()
    const pages = ["submissions", "notifications"]
    const initialIndex = pages.indexOf(initialPage)
    const [currentPageIndex, setCurrentPageIndex] = useState(initialIndex >= 0 ? initialIndex : 1)
    const [containerWidth, setContainerWidth] = useState(0)
    const [isInitialized, setIsInitialized] = useState(false)
    const translateX = useRef(new Animated.Value(0)).current
    const currentIndexRef = useRef(initialIndex >= 0 ? initialIndex : 1)
    const containerRef = useRef<any>(null)
    const hasSetInitialPosition = useRef(false)

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
                            } else if (currentIndexRef.current === pages.length - 1 && deltaX < 0) {
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
        const subscription = Dimensions.addEventListener("change", () => {
            if (containerWidth > 0) {
                translateX.setValue(-currentIndexRef.current * containerWidth)
            }
        })
        return () => subscription?.remove()
    }, [containerWidth])

    useEffect(() => {
        loadPageIndex()
    }, [])

    useEffect(() => {
        const clampedIndex = Math.max(0, Math.min(pages.length - 1, currentPageIndex))
        if (clampedIndex !== currentPageIndex) {
            setCurrentPageIndex(clampedIndex)
            return
        }

        currentIndexRef.current = clampedIndex
        if (containerWidth > 0) {
            if (!hasSetInitialPosition.current) {
                translateX.setValue(-clampedIndex * containerWidth)
                hasSetInitialPosition.current = true
            } else {
                Animated.spring(translateX, {
                    toValue: -clampedIndex * containerWidth,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 10,
                }).start()
            }
        }
    }, [currentPageIndex, containerWidth, pages.length])

    useEffect(() => {
        savePageIndex(currentPageIndex)
    }, [currentPageIndex])

    const loadPageIndex = async () => {
        try {
            const savedIndex = await loadNavigationState()
            if (savedIndex !== null && savedIndex >= 0 && savedIndex < pages.length) {
                setCurrentPageIndex(savedIndex)
                currentIndexRef.current = savedIndex
            }
        } catch (error) {
            console.error("Failed to load page index:", error)
        } finally {
            setIsInitialized(true)
        }
    }

    const savePageIndex = async (index: number) => {
        try {
            await saveNavigationState(index)
        } catch (error) {
            console.error("Failed to save page index:", error)
        }
    }

    const panGesture = Gesture.Pan()
        .runOnJS(Platform.OS !== "web")
        .activeOffsetX([-5, 5])
        .failOffsetY([-30, 30])
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
                (currentIndexRef.current === pages.length - 1 && movement < 0)) {
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
                } else if (translation < 0 && currentIndexRef.current < pages.length - 1) {
                    newIndex = currentIndexRef.current + 1
                }
            }

            newIndex = Math.max(0, Math.min(pages.length - 1, newIndex))

            if (Math.abs(translation) > 30 || Math.abs(velocity) > 300) {
                setSwipeInProgress(true)
            }

            if (newIndex !== currentIndexRef.current) {
                setCurrentPageIndex(newIndex)
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
                const clampedIndex = Math.max(0, Math.min(pages.length - 1, currentIndexRef.current))
                if (clampedIndex !== currentIndexRef.current) {
                    currentIndexRef.current = clampedIndex
                    setCurrentPageIndex(clampedIndex)
                }
                Animated.spring(translateX, {
                    toValue: -clampedIndex * containerWidth,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }).start(() => {
                    setTimeout(() => setSwipeInProgress(false), 30)
                })
            } else {
                setTimeout(() => setSwipeInProgress(false), 30)
            }
        })

    const containerStyle = {
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    }

    return (
        <View style={containerStyle}>
            <View
                ref={containerRef}
                style={styles.swipeableContainer}
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            styles.pagesWrapper,
                            {
                                width: containerWidth * pages.length,
                                transform: [{ translateX }],
                                opacity: isInitialized ? 1 : 0,
                            },
                        ]}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                    >
                        {children.map((child, index) => (
                            <View
                                key={pages[index]}
                                style={[styles.pageContainer, { width: containerWidth }]}
                            >
                                {child}
                            </View>
                        ))}
                    </Animated.View>
                </GestureDetector>
            </View>
            <View style={styles.pageIndicatorContainer} pointerEvents="none">
                {pages.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.pageIndicator,
                            {
                                backgroundColor:
                                    index === currentPageIndex
                                        ? "#3b82f6"
                                        : isDarkMode
                                            ? "#444"
                                            : "#ddd",
                            },
                        ]}
                    />
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    swipeableContainer: {
        flex: 1,
        overflow: "hidden",
        // @ts-ignore - web-only CSS property
        touchAction: "pan-y",
    },
    pagesWrapper: {
        flexDirection: "row",
        height: "100%",
        // @ts-ignore - web-only CSS property
        touchAction: "pan-y",
    },
    pageContainer: {
        height: "100%",
    },
    pageIndicatorContainer: {
        position: "absolute",
        bottom: 72,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        alignSelf: "center",
    },
    pageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
})
