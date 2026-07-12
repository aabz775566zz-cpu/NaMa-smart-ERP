// Deliberately NOT 'use client' — imported from both the server root layout
// (via next/headers cookies()) and client components (locale-context.tsx,
// language-switcher.tsx). A plain string constant re-exported from a 'use
// client' module becomes an opaque client reference when imported into a
// Server Component, which silently broke cookieStore.get() there — see
// git history for this file if that regresses again.
export const LOCALE_COOKIE_NAME = 'erp-smart-locale';
