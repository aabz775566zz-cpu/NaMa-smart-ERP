import type { Locale } from '@erp-smart/types';

import ar from '../messages/ar.json';
import en from '../messages/en.json';

const messages: Record<Locale, typeof en> = {
  en,
  ar,
};

/** Load message catalog for a locale */
export function getMessages(locale: Locale) {
  return messages[locale] ?? messages.en;
}

export type Messages = typeof en;
