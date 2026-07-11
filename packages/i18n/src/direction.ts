import type { Locale } from '@erp-smart/types';

/** Returns text direction for a given locale */
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Returns true if the locale uses right-to-left layout */
export function isRtl(locale: Locale): boolean {
  return getDirection(locale) === 'rtl';
}
