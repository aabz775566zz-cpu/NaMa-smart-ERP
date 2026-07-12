'use client';

import { useCompany } from '@/features/settings/hooks';

// Numbers are always formatted with Western digits/grouping regardless of
// UI language — a common, deliberate SaaS choice (Arabic-locale products
// still show "1,234.50" for money, not Arabic-Indic digits) so figures stay
// unambiguous across languages. Only the currency symbol/position varies,
// driven by the company's own currency setting, not the UI locale.
const NUMBER_LOCALE = 'en-US';

/**
 * Formats a money value (Prisma Decimal serialized as a string, or a plain
 * number) as a real currency string — symbol, thousands separators, fixed
 * decimals — via the platform's built-in Intl.NumberFormat rather than a
 * hand-rolled formatter. Falls back to a plain grouped number prefixed with
 * the raw currency code if the code isn't a currency Intl recognizes.
 */
export function formatMoney(value: string | number, currencyCode: string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return String(value);

  try {
    return new Intl.NumberFormat(NUMBER_LOCALE, { style: 'currency', currency: currencyCode }).format(amount);
  } catch {
    const plain = new Intl.NumberFormat(NUMBER_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${currencyCode} ${plain}`;
  }
}

// Curated, not exhaustive — Intl.NumberFormat accepts any valid ISO 4217
// code, this list just gives the company-settings currency field a safe
// dropdown instead of free text (which too easily produces a code
// Intl.NumberFormat doesn't recognize, falling back to the plain-number
// path in formatMoney above).
export const CURRENCY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'YER', label: 'Yemeni Rial (YER)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'EGP', label: 'Egyptian Pound (EGP)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'QAR', label: 'Qatari Riyal (QAR)' },
  { code: 'KWD', label: 'Kuwaiti Dinar (KWD)' },
  { code: 'JOD', label: 'Jordanian Dinar (JOD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
];

const DEFAULT_CURRENCY = 'USD';

/** Binds formatMoney to the current company's currency setting. */
export function useFormatMoney() {
  const { data: company } = useCompany();
  const currencyCode = company?.currency ?? DEFAULT_CURRENCY;
  return (value: string | number) => formatMoney(value, currencyCode);
}
