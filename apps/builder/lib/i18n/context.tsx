'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Translation } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
  formatMessage: (key: string, values?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatRelativeTime: (date: Date | string | number) => string;
}

const translations: Record<Locale, Translation> = {
  en,
  fr,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'forms-locale';

// Browser language to our locale mapping
const browserLocaleMap: Record<string, Locale> = {
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
};

function detectLocale(): Locale {
  // Check URL parameter first
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam === 'en' || langParam === 'fr')) {
      return langParam as Locale;
    }
  }

  // Check localStorage
  if (typeof window !== 'undefined') {
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && (storedLocale === 'en' || storedLocale === 'fr')) {
      return storedLocale as Locale;
    }
  }

  // Check browser language
  if (typeof window !== 'undefined' && window.navigator) {
    const browserLang = window.navigator.language;
    const mappedLocale = browserLocaleMap[browserLang] || browserLocaleMap[browserLang.split('-')[0]];
    if (mappedLocale) {
      return mappedLocale;
    }
  }

  // Default to English
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const detectedLocale = detectLocale();
    setLocaleState(detectedLocale);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  };

  const t = translations[locale];

  const formatMessage = (key: string, values?: Record<string, string | number>): string => {
    let message = key;
    
    // Navigate through nested keys
    const keys = key.split('.');
    let current: any = t;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Key not found, return the key itself
        return key;
      }
    }
    
    if (typeof current === 'string') {
      message = current;
    } else {
      return key;
    }

    // Replace placeholders
    if (values) {
      Object.entries(values).forEach(([placeholder, value]) => {
        message = message.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
      });
    }

    return message;
  };

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', options).format(value);
  };

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', options).format(dateObj);
  };

  const formatCurrency = (value: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatRelativeTime = (date: Date | string | number): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t.time.just_now;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return minutes === 1 
        ? t.time.minute_ago 
        : t.time.minutes_ago.replace('{count}', String(minutes));
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return hours === 1 
        ? t.time.hour_ago 
        : t.time.hours_ago.replace('{count}', String(hours));
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return days === 1 
        ? t.time.day_ago 
        : t.time.days_ago.replace('{count}', String(days));
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return weeks === 1 
        ? t.time.week_ago 
        : t.time.weeks_ago.replace('{count}', String(weeks));
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return months === 1 
        ? t.time.month_ago 
        : t.time.months_ago.replace('{count}', String(months));
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return years === 1 
        ? t.time.year_ago 
        : t.time.years_ago.replace('{count}', String(years));
    }
  };

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    formatMessage,
    formatNumber,
    formatDate,
    formatCurrency,
    formatRelativeTime,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}