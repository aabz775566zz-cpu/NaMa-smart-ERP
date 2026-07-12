'use client';

import type { Company, InvoiceDetail } from '@erp-smart/types';
import { getDirection } from '@erp-smart/i18n';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

/**
 * The actual invoice document — used both by the dedicated print route
 * (apps/web/src/app/invoices/[id]/print) and could be reused inline later.
 * Deliberately plain, print-first markup: no shadcn Card/Table primitives,
 * since those carry app-chrome styling (shadows, hover states) that has no
 * place on a printed page. Logical CSS properties throughout so the whole
 * layout — including which side the logo sits on — mirrors correctly in
 * Arabic without any direction-conditional branching.
 */
export function InvoicePrintView({ invoice, company }: { invoice: InvoiceDetail; company: Company }) {
  const { messages, locale } = useLocale();
  const direction = getDirection(locale);
  const formatMoney = useFormatMoney();
  const t = messages.invoice;

  const customer = invoice.sale.customer;
  const issueDate = new Date(invoice.issueDate).toLocaleDateString(direction === 'rtl' ? 'en-GB' : 'en-US');

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-neutral-900 print:p-0" dir={direction}>
      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-6">
        <div className="flex items-center gap-3">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.name} className="h-14 w-14 rounded object-contain" />
          ) : null}
          <div>
            <p className="text-lg font-bold">{company.name}</p>
            {company.country ? <p className="text-xs text-neutral-500">{company.country}</p> : null}
          </div>
        </div>
        <div className="text-end">
          <p className="text-2xl font-bold tracking-tight">{t.title}</p>
          <p className="mt-1 text-sm text-neutral-600">
            {t.invoiceNumber}: <span className="font-medium text-neutral-900">{invoice.invoiceNumber}</span>
          </p>
          <p className="text-sm text-neutral-600">
            {t.issueDate}: <span className="font-medium text-neutral-900">{issueDate}</span>
          </p>
        </div>
      </header>

      <section className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.billTo}</p>
        {customer ? (
          <div className="mt-1 text-sm">
            <p className="font-medium">{customer.name}</p>
            {customer.phone ? <p className="text-neutral-600">{customer.phone}</p> : null}
            {customer.address ? <p className="text-neutral-600">{customer.address}</p> : null}
          </div>
        ) : (
          <p className="mt-1 text-sm font-medium">{t.walkInCustomer}</p>
        )}
      </section>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-start text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-2 text-start font-semibold">{t.product}</th>
            <th className="py-2 text-end font-semibold">{t.quantity}</th>
            <th className="py-2 text-end font-semibold">{t.unitPrice}</th>
            <th className="py-2 text-end font-semibold">{t.lineTotal}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.sale.items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100">
              <td className="py-2">{item.product.name}</td>
              <td className="py-2 text-end">{item.quantity}</td>
              <td className="py-2 text-end">{formatMoney(item.unitPrice)}</td>
              <td className="py-2 text-end font-medium">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ms-auto mt-6 w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>{t.subtotal}</span>
          <span>{formatMoney(invoice.sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>{t.discount}</span>
          <span>-{formatMoney(invoice.sale.discountTotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>{t.tax}</span>
          <span>{formatMoney(invoice.sale.taxTotal)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-900 pt-1.5 text-base font-bold">
          <span>{t.grandTotal}</span>
          <span>{formatMoney(invoice.totalAmount)}</span>
        </div>
        <div className="pt-1 text-end text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {invoice.status === 'PAID' ? t.paymentStatusPaid : t.paymentStatusIssued}
        </div>
      </div>

      <footer className="mt-12 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-500">
        {t.thankYou}
      </footer>
    </div>
  );
}
