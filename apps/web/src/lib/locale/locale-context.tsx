'use client';

import type { Locale } from '@erp-smart/types';
import type { Messages } from '@erp-smart/i18n';
import { createContext, useContext } from 'react';

import { LOCALE_COOKIE_NAME } from './constants';

export { LOCALE_COOKIE_NAME };

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Value is resolved server-side (see app/layout.tsx, which reads the locale
 * cookie via next/headers before render) and handed down as-is — there is
 * no client-only state here, so hydration always matches the server render
 * exactly. Switching locale (see LanguageSwitcher) sets the cookie and
 * reloads the page rather than mutating this context live: a reload
 * guarantees every already-rendered string, direction, and layout updates
 * together, with no partial-RTL/partial-LTR in-between state to get wrong.
 */
export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}

/** Sets the locale cookie and reloads so the server re-renders everything
 * (html dir/lang, every message string) consistently from the first byte. */
export function setLocaleCookie(locale: Locale) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${oneYear};SameSite=Lax`;
  window.location.reload();
}
