'use client';

import { Button } from '@erp-smart/ui';
import { Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';

import { InvoicePrintView } from '@/features/invoices/components/invoice-print-view';
import { useInvoice } from '@/features/invoices/hooks';
import { BrandedLoader } from '@/components/branded-loader';
import { useLocale } from '@/lib/locale/locale-context';
import { useCompany } from '@/features/settings/hooks';
import { useAuthStore } from '@/lib/store';

/**
 * Deliberately a standalone route outside /dashboard, not a route nested
 * under the dashboard layout — a print/PDF page must never render the
 * sidebar/header chrome, and fighting that shell with print stylesheets is
 * more fragile than simply not mounting it. "Download PDF" reuses the
 * browser's own print-to-PDF (every modern browser's print dialog offers a
 * PDF destination) rather than a new server-side rendering dependency.
 */
export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const { data: company, isLoading: companyLoading } = useCompany();
  const { messages } = useLocale();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'idle' || invoiceLoading || companyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 print:hidden">
        <BrandedLoader />
      </div>
    );
  }

  if (status !== 'authenticated' || !invoice || !company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-2xl justify-end px-2 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer />
          {messages.invoice.print}
        </Button>
      </div>
      <InvoicePrintView invoice={invoice} company={company} />
    </div>
  );
}
