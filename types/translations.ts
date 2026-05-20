// TypeScript types for translation key validation
import type enTranslations from '../locales/en.json'

// Utility type to create dot-notation paths from nested object
type DotNotation<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}.${DotNotation<T[K]>}`
    : K
  : never

// Translation key type based on the English locale structure
export type TranslationKey = DotNotation<typeof enTranslations>

// Type for translation variables
export type TranslationVars = Record<string, string | number>

// Type for the translation function
export type TranslationFunction = (
  key: TranslationKey,
  vars?: TranslationVars
) => string