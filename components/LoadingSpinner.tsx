"use client"

import React from "react"
import { View, ActivityIndicator, Text, StyleSheet } from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

interface LoadingSpinnerProps {
  size?: "small" | "large"
  color?: string
  text?: string
  style?: any
}

export function LoadingSpinner({ 
  size = "large", 
  color, 
  text, 
  style 
}: LoadingSpinnerProps) {
  const { isDarkMode } = useTheme()
  const { t } = useLanguage()
  
  const spinnerColor = color || "#ff4500"
  const defaultText = text || t("common.status.loading")
  
  const containerStyle = {
    ...styles.container,
    backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    ...style,
  }
  
  const textStyle = {
    ...styles.text,
    color: isDarkMode ? "#ccc" : "#666",
  }

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text !== null && (
        <Text style={textStyle}>{defaultText}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
})