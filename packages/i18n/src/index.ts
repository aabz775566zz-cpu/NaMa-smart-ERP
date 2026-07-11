import type { Locale } from '@erp-smart/types';

import { defaultLocale, localeLabels, locales } from './config';
import { getDirection, isRtl } from './direction';
import { getMessages } from './messages';

export { defaultLocale, localeLabels, locales } from './config';
export { getDirection, isRtl } from './direction';
export { getMessages } from './messages';
export type { Messages } from './messages';

/** Check whether a string is a supported locale */
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** Resolve locale from a raw value, falling back to default */
export function resolveLocale(value: string | undefined): Locale {
  if (value && isValidLocale(value)) {
    return value;
  }
  return defaultLocale;
}

/** Bundle locale metadata for layout initialization */
export function getLocaleConfig(locale: Locale) {
  return {
    locale,
    direction: getDirection(locale),
    isRtl: isRtl(locale),
    messages: getMessages(locale),
    label: localeLabels[locale],
  };
}
