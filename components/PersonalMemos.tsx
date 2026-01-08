"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { styles } from "../styles/globalStyles"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { toJSTISOString } from "../utils/dateUtils"

interface Memo {
  id: string
  content: string
  createdAt: string
}

export function PersonalMemos() {
  const { isDarkMode } = useTheme()
  const { t } = useLanguage()
  const [memoText, setMemoText] = useState("")
  const [memos, setMemos] = useState<Memo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load memos from AsyncStorage on component mount
  useEffect(() => {
    loadMemos()
  }, [])

  const loadMemos = async () => {
    try {
      const storedMemos = await AsyncStorage.getItem('personal_memos')
      if (storedMemos) {
        setMemos(JSON.parse(storedMemos))
      }
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveMemos = async (newMemos: Memo[]) => {
    try {
      await AsyncStorage.setItem('personal_memos', JSON.stringify(newMemos))
    } catch (error) {
      console.error('Failed to save memos:', error)
      Alert.alert(t("common.status.error"), t("common.status.savingMemo"))
    }
  }

  // Theme-aware styles
  const containerStyle = {
    ...styles.memosContainer,
    backgroundColor: isDarkMode ? "#1a1a1b" : "#ffffff",
    flex: 1,
  }

  const memoTextInputStyle = {
    ...styles.memoTextInput,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    color: isDarkMode ? "#fff" : "#000",
    borderColor: isDarkMode ? "#333" : "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top' as const,
  }

  const memoItemStyle = {
    ...styles.memoItem,
    backgroundColor: isDarkMode ? "#2d2d2e" : "#f5f5f5",
    borderColor: isDarkMode ? "#444" : "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  }

  const memoContentStyle = {
    ...styles.memoContent,
    color: isDarkMode ? "#fff" : "#000",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  }

  const memoDateStyle = {
    ...styles.memoDate,
    color: isDarkMode ? "#666" : "#999",
    fontSize: 12,
  }

  const saveMemoButtonStyle = {
    backgroundColor: "#ff4500",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center' as const,
  }

  const saveMemoTextStyle = {
    color: "#fff",
    fontWeight: "bold" as const,
    fontSize: 16,
  }

  const handleSaveMemo = async () => {
    if (memoText.trim()) {
      const newMemo: Memo = {
        id: Date.now().toString(),
        content: memoText.trim(),
        createdAt: toJSTISOString(new Date()),
      }

      const updatedMemos = [newMemo, ...memos]
      setMemos(updatedMemos)
      await saveMemos(updatedMemos)
      setMemoText("")
    }
  }

  const handleDeleteMemo = async (memoId: string) => {
    Alert.alert(
      t("memos.deleteMemo"),
      t("memos.confirmDelete"),
      [
        { text: t("common.actions.cancel"), style: "cancel" },
        {
          text: t("common.actions.delete"),
          style: "destructive",
          onPress: async () => {
            const updatedMemos = memos.filter(memo => memo.id !== memoId)
            setMemos(updatedMemos)
            await saveMemos(updatedMemos)
          }
        }
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <View style={[containerStyle, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: isDarkMode ? "#ccc" : "#666" }}>
          {t("common.status.loading")}
        </Text>
      </View>
    )
  }

  return (
    <View style={containerStyle}>
      <View style={{ padding: 16 }}>
        <TextInput
          style={memoTextInputStyle}
          value={memoText}
          onChangeText={setMemoText}
          placeholder={t("memos.writeMemo")}
          placeholderTextColor={isDarkMode ? "#666" : "#999"}
          multiline
        />
        <TouchableOpacity
          style={saveMemoButtonStyle}
          onPress={handleSaveMemo}
          disabled={!memoText.trim()}
        >
          <Text style={saveMemoTextStyle}>{t("memos.saveMemo")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        {memos.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: isDarkMode ? "#666" : "#999", fontSize: 16 }}>
              {t("memos.noMemos")}
            </Text>
          </View>
        ) : (
          memos.map((memo) => (
            <TouchableOpacity
              key={memo.id}
              style={memoItemStyle}
              onLongPress={() => handleDeleteMemo(memo.id)}
            >
              <Text style={memoContentStyle}>{memo.content}</Text>
              <Text style={memoDateStyle}>{formatDate(memo.createdAt)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}
