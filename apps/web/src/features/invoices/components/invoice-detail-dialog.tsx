'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@erp-smart/ui';
import { Printer } from 'lucide-react';

import { useCompany } from '@/features/settings/hooks';
import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

import { useInvoice, useMarkInvoicePaid } from '../hooks';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { WhatsAppShareButton } from './whatsapp-share-button';

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: invoice, isLoading } = useInvoice(open ? invoiceId : null);
  const canUpdate = useHasPermission('INVOICES:UPDATE');
  const markPaidMutation = useMarkInvoicePaid();
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.invoices;
  const { data: company } = useCompany();

  function handleMarkPaid() {
    if (!invoice) return;
    markPaidMutation.mutate(invoice.id, {
      onSuccess: () => toast({ title: t.markedPaid }),
      onError: (error) => {
        toast({ variant: 'destructive', title: t.markPaidFailed, description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{invoice ? invoice.invoiceNumber : messages.invoice.title}</DialogTitle>
          <DialogDescription>
            {invoice
              ? t.issuedOn.replace('{{date}}', new Date(invoice.issueDate).toLocaleDateString())
              : t.loadingDetails}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !invoice ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {invoice.sale.customer ? invoice.sale.customer.name : messages.invoice.walkInCustomer}
              </span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{messages.invoice.product}</TableHead>
                    <TableHead>{messages.invoice.quantity}</TableHead>
                    <TableHead>{messages.invoice.unitPrice}</TableHead>
                    <TableHead>{messages.invoice.lineTotal}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatMoney(item.unitPrice)}</TableCell>
                      <TableCell>{formatMoney(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{messages.invoice.subtotal}</span>
                <span>{formatMoney(invoice.sale.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{messages.invoice.discount}</span>
                <span>-{formatMoney(invoice.sale.discountTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{messages.invoice.tax}</span>
                <span>{formatMoney(invoice.sale.taxTotal)}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>{t.total}</span>
                <span>{formatMoney(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {invoice ? (
          <DialogFooter>
            {company ? (
              <WhatsAppShareButton
                variant="outline"
                phone={invoice.sale.customer?.phone}
                companyName={company.name}
                invoiceNumber={invoice.invoiceNumber}
                total={formatMoney(invoice.totalAmount)}
              />
            ) : null}
            <Button
              variant="outline"
              onClick={() => window.open(`/invoices/${invoice.id}/print`, '_blank', 'noopener,noreferrer')}
            >
              <Printer />
              {messages.invoice.print} / {messages.invoice.downloadPdf}
            </Button>
            {canUpdate && invoice.status === 'ISSUED' ? (
              <Button onClick={handleMarkPaid} disabled={markPaidMutation.isPending}>
                {markPaidMutation.isPending ? t.marking : t.markPaid}
              </Button>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
