import React from "react"
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { usePathname } from "expo-router"

interface BottomNavigationProps {
    onSearchPress?: () => void
    onAddNewPress?: () => void
    onManualsPress?: () => void
    onSettingsPress?: () => void
}

export function BottomNavigation({
    onSearchPress,
    onAddNewPress,
    onManualsPress,
    onSettingsPress,
}: BottomNavigationProps) {
    const { isDarkMode } = useTheme()
    const pathname = usePathname()

    // Hide on login screen
    if (pathname === "/login") {
        return null
    }

    const containerStyle = {
        ...styles.container,
        backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
        borderTopColor: isDarkMode ? "#333" : "#ddd",
    }

    const iconColor = isDarkMode ? "#fff" : "#333"

    const handleSearchPress = () => {
        if (onSearchPress) {
            onSearchPress()
        }
    }

    const handleAddNewPress = () => {
        if (onAddNewPress) {
            onAddNewPress()
        }
    }

    const handleManualsPress = () => {
        if (onManualsPress) {
            onManualsPress()
        }
    }

    const handleSettingsPress = () => {
        if (onSettingsPress) {
            onSettingsPress()
        }
    }

    return (
        <View style={containerStyle}>
            <TouchableOpacity style={styles.navButton} onPress={handleSearchPress}>
                <Ionicons name="search" size={28} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={handleAddNewPress}>
                <Ionicons name="add-circle" size={28} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={handleManualsPress}>
                <Ionicons name="book" size={28} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={handleSettingsPress}>
                <Ionicons name="menu" size={28} color={iconColor} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        ...Platform.select({
            ios: {
                paddingBottom: 24,
            },
            android: {
                elevation: 8,
            },
            web: {
                position: "fixed" as any,
                boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
            },
        }),
    },
    navButton: {
        padding: 8,
        alignItems: "center",
        justifyContent: "center",
    },
})
