"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform, NativeModules } from "react-native"

// Import JSON locale files
import enTranslations from "../locales/en.json"
import jaTranslations from "../locales/ja.json"
import type { TranslationKey, TranslationVars, TranslationFunction } from "../types/translations"

// Define the supported languages
export type Language = "en" | "ja"

// Define the context type
interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: TranslationFunction
  // Backward compatibility properties
  language: Language
  toggleLanguage: () => void
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation files mapping
const translations = {
  en: enTranslations,
  ja: jaTranslations
}


// Helper function to get the device's language
const getDeviceLanguage = (): Language => {
  // For iOS
  if (Platform.OS === 'ios') {
    const locale = 
      NativeModules.SettingsManager.settings.AppleLocale || 
      NativeModules.SettingsManager.settings.AppleLanguages[0] // iOS 13+
    
    return locale.startsWith('ja') ? 'ja' : 'en'
  } 
  // For Android
  else if (Platform.OS === 'android') {
    const locale = NativeModules.I18nManager.localeIdentifier
    return locale.startsWith('ja') ? 'ja' : 'en'
  } 
  // For web
  else if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const browserLang = navigator.language || (navigator as any).userLanguage
    return browserLang.startsWith('ja') ? 'ja' : 'en'
  }
  
  // Default fallback
  return 'en'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  // Load saved language preference or detect device language
  useEffect(() => {
    loadLanguage()
  }, [])

  const loadLanguage = async () => {
    try {
      const storedLanguage = await AsyncStorage.getItem("language")
      if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ja')) {
        setLangState(storedLanguage as Language)
      } else {
        // Use device language if no stored preference
        const deviceLang = getDeviceLanguage()
        setLangState(deviceLang)
        // Save the detected language
        await AsyncStorage.setItem("language", deviceLang)
      }
    } catch (error) {
      console.error("Failed to load language preference:", error)
      // Default to English in case of error
      setLangState('en')
    }
  }

  const setLang = async (newLanguage: Language) => {
    setLangState(newLanguage)
    try {
      await AsyncStorage.setItem("language", newLanguage)
    } catch (error) {
      console.error("Failed to save language preference:", error)
    }
  }

  // Translation function with hierarchical key resolution and variable interpolation
  const t: TranslationFunction = (key: TranslationKey, vars?: TranslationVars): string => {
    const keys = key.split('.')
    let value: any = translations[lang]
    let foundInCurrentLang = true
    
    // Try to find the key in current language
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        foundInCurrentLang = false
        break
      }
    }
    
    // If not found in current language, try English fallback
    if (!foundInCurrentLang || typeof value !== 'string') {
      value = translations.en
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          // Log comprehensive warning in development mode for missing keys
          if (__DEV__) {
            console.warn(`🌐 Translation key missing: "${key}"`)
            console.warn(`   - Not found in current language: ${lang}`)
            console.warn(`   - Not found in fallback language: en`)
            console.warn(`   - Available keys at this level:`, Object.keys(value || {}))
          }
          return key // Return key if not found in fallback either
        }
      }
    }
    
    if (typeof value !== 'string') {
      if (__DEV__) {
        console.warn(`🌐 Translation key "${key}" does not resolve to string, got:`, typeof value)
      }
      return key
    }
    
    // Log warning if key was found in fallback but not current language
    if (!foundInCurrentLang && __DEV__) {
      console.warn(`🌐 Translation key "${key}" missing in ${lang}, using English fallback`)
    }
    
    // Handle variable interpolation with {{variable}} syntax
    if (vars) {
      let text = value
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{{${k}}}`, String(v))
      }
      return text
    }
    
    return value
  }

  // Backward compatibility function
  const toggleLanguage = () => {
    const newLanguage: Language = lang === 'en' ? 'ja' : 'en'
    setLang(newLanguage)
  }

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLang, 
      t,
      // Backward compatibility properties
      language: lang,
      toggleLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}