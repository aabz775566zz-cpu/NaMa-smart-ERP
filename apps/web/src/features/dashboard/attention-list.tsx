'use client';

import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@erp-smart/ui';
import { CheckCircle2 } from 'lucide-react';

import { useInvoices } from '@/features/invoices/hooks';
import { isInvoiceOverdue } from '@/features/invoices/overdue';
import { useLowStock } from '@/features/inventory/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

import { LowStockSection } from './low-stock-section';
import { OverdueInvoicesSection } from './overdue-invoices-section';

export function AttentionList() {
  const permissions = usePermissions();
  const canViewInventory = permissions.includes('INVENTORY:READ');
  const canViewInvoices = permissions.includes('INVOICES:READ');
  const { messages } = useLocale();
  const t = messages.dashboard;

  const lowStockQuery = useLowStock({ enabled: canViewInventory });
  const invoicesQuery = useInvoices('ISSUED', { enabled: canViewInvoices });

  if (!canViewInventory && !canViewInvoices) return null;

  const overdueInvoices = (invoicesQuery.data ?? []).filter((invoice) => isInvoiceOverdue(invoice));

  const lowStockEmpty =
    !canViewInventory || (!lowStockQuery.isLoading && !lowStockQuery.isError && lowStockQuery.data?.length === 0);
  const overdueEmpty =
    !canViewInvoices || (!invoicesQuery.isLoading && !invoicesQuery.isError && overdueInvoices.length === 0);
  const anyQueryLoading =
    (canViewInventory && lowStockQuery.isLoading) || (canViewInvoices && invoicesQuery.isLoading);
  const nothingNeedsAttention = !anyQueryLoading && lowStockEmpty && overdueEmpty;

  return (
    <Card className="flex min-h-[26rem] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.attentionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        {nothingNeedsAttention ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <EmptyState
              icon={<CheckCircle2 />}
              title={t.nothingNeedsAttentionTitle}
              description={t.nothingNeedsAttentionDescription}
              tone="success"
              className="border-none"
            />
          </div>
        ) : (
          <>
            {canViewInventory ? (
              <LowStockSection
                products={lowStockQuery.data}
                isLoading={lowStockQuery.isLoading}
                isError={lowStockQuery.isError}
              />
            ) : null}
            {canViewInvoices ? (
              <OverdueInvoicesSection
                invoices={overdueInvoices}
                isLoading={invoicesQuery.isLoading}
                isError={invoicesQuery.isError}
              />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
