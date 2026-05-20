"use client"

import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap
  title?: string
  message?: string
  actionText?: string
  onAction?: () => void
  style?: any
}

export function EmptyState({
  icon = "document-outline",
  title,
  message,
  actionText,
  onAction,
  style
}: EmptyStateProps) {
  const { isDarkMode } = useTheme()
  const { t } = useLanguage()

  const containerStyle = {
    ...styles.container,
    backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    ...style,
  }

  const titleStyle = {
    ...styles.title,
    color: isDarkMode ? "#fff" : "#000",
  }

  const messageStyle = {
    ...styles.message,
    color: isDarkMode ? "#aaa" : "#666",
  }

  const actionButtonStyle = {
    ...styles.actionButton,
    backgroundColor: "#ff4500",
  }

  return (
    <View style={containerStyle}>
      <Ionicons
        name={icon}
        size={64}
        color={isDarkMode ? "#444" : "#ddd"}
        style={styles.icon}
      />
      {title && <Text style={titleStyle}>{title}</Text>}
      {message && <Text style={messageStyle}>{message}</Text>}
      {actionText && onAction && (
        <TouchableOpacity style={actionButtonStyle} onPress={onAction}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// Specific empty state components
export function NoSubmissionsEmpty({ onCreateSubmission }: { onCreateSubmission?: () => void }) {
  const { t } = useLanguage()

  return (
    <EmptyState
      icon="document-text-outline"
      title={t("browse.noSubmissions")}
      message={t("browse.noSubmissionsMessage")}
      actionText={onCreateSubmission ? t("create.title") : undefined}
      onAction={onCreateSubmission}
    />
  )
}

export function NoUsersFoundEmpty({ searchQuery }: { searchQuery?: string }) {
  const { t } = useLanguage()

  return (
    <EmptyState
      icon="search"
      title={t("userSearch.noMatchingUsers")}
      message={searchQuery ? t("userSearch.noUsersFoundMessage").replace("{query}", searchQuery) : t("userSearch.tryAdjustingSearch")}
    />
  )
}

export function NoCommentsEmpty() {
  const { t } = useLanguage()

  return (
    <EmptyState
      icon="chatbubble-outline"
      title={t("submission.noComments")}
      message={t("submission.noCommentsMessage")}
      style={{ paddingVertical: 20 }}
    />
  )
}

export function OfflineEmpty() {
  const { t } = useLanguage()

  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={t("network.offline")}
      message={t("network.retryWhenOnline")}
      style={{ paddingVertical: 40 }}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})