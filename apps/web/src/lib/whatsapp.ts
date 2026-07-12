/**
 * wa.me share-link generation — the "simplest high-value" WhatsApp
 * integration: no API keys, no Meta business verification, no backend
 * involvement at all. Deliberately kept this way for now; a future WhatsApp
 * Business API integration (auto-send, delivery receipts, template
 * messages) would layer on top of this same message-building logic rather
 * than replace it, so message composition lives in one place regardless of
 * which transport eventually sends it.
 */

/** Strips everything but digits — wa.me wants a bare international number,
 * no "+", no spaces/dashes. Returns null if nothing usable remains, so
 * callers can hide/disable the share action rather than build a dead link. */
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 6 ? digits : null;
}

export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const digits = normalizePhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  // wa.me works without a number too — it just opens the contact/chat
  // picker instead of a specific chat — so a missing/invalid number
  // degrades gracefully rather than blocking the share entirely.
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/** Replaces {{key}} tokens in an i18n message template — the message
 * catalogs use this convention (see packages/i18n/messages/*.json's
 * invoice.whatsAppMessage) since the project has no full i18n library. */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}
