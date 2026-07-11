import type { Locale } from '@erp-smart/types';

/** All supported locales */
export const locales: Locale[] = ['en', 'ar'];

/** Default locale when none is specified */
export const defaultLocale: Locale = 'en';

/** Human-readable locale labels */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};
