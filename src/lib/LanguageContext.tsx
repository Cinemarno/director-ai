'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { translations, Language, TranslationKey } from './i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'fr'
  const savedLanguage = localStorage.getItem('directorAI_language') as Language | null
  if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
    return savedLanguage
  }
  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'en') return 'en'
  return 'fr'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = useCallback((lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('directorAI_language', lang)
    }
    setLanguageState(lang)
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
