'use client';

import type { PaymentStatus, PurchaseInvoice } from '@erp-smart/types';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp-smart/ui';
import { Banknote, CheckCircle2, MoreHorizontal, XCircle } from 'lucide-react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

import { PurchaseInvoiceStatusBadge } from './purchase-invoice-status-badge';

export function PurchaseInvoicesTable({
  purchaseInvoices,
  supplierNameById,
  onReceive,
  onCancel,
  onMarkPaid,
}: {
  purchaseInvoices: PurchaseInvoice[];
  supplierNameById: Map<string, string>;
  onReceive: (purchaseInvoice: PurchaseInvoice) => void;
  onCancel: (purchaseInvoice: PurchaseInvoice) => void;
  onMarkPaid: (purchaseInvoice: PurchaseInvoice) => void;
}) {
  // receive()/cancel() are gated PURCHASES:CREATE/DELETE (mirrors
  // SalesController's complete()/cancel() split); markPaid() is gated
  // PURCHASES:UPDATE (mirrors InvoicesController's markPaid()) — matches the
  // real permission model in purchase-invoices.controller.ts.
  const canReceive = useHasPermission('PURCHASES:CREATE');
  const canCancel = useHasPermission('PURCHASES:DELETE');
  const canMarkPaid = useHasPermission('PURCHASES:UPDATE');
  const canAct = canReceive || canCancel || canMarkPaid;
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.purchaseInvoices;
  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PAID: messages.common.paymentStatusPaid,
    PARTIAL: messages.common.paymentStatusPartial,
    UNPAID: messages.common.paymentStatusUnpaid,
  };

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{messages.common.date}</TableHead>
            <TableHead>{t.supplier}</TableHead>
            <TableHead>{t.total}</TableHead>
            <TableHead>{t.payment}</TableHead>
            <TableHead>{messages.common.status}</TableHead>
            {canAct ? <TableHead className="text-end">{messages.common.actions}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseInvoices.map((purchaseInvoice) => {
            const isDraft = purchaseInvoice.status === 'DRAFT';
            const isReceived = purchaseInvoice.status === 'RECEIVED';
            const canOfferMarkPaid = canMarkPaid && isReceived && purchaseInvoice.paymentStatus !== 'PAID';
            const hasRowActions = (canReceive && isDraft) || (canCancel && isDraft) || canOfferMarkPaid;

            return (
              <TableRow key={purchaseInvoice.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(purchaseInvoice.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-foreground">
                  {supplierNameById.get(purchaseInvoice.supplierId) ?? '—'}
                </TableCell>
                <TableCell className="font-medium tabular-nums text-foreground">
                  {formatMoney(purchaseInvoice.totalAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Badge variant="outline">{PAYMENT_STATUS_LABELS[purchaseInvoice.paymentStatus]}</Badge>
                </TableCell>
                <TableCell>
                  <PurchaseInvoiceStatusBadge status={purchaseInvoice.status} />
                </TableCell>
                {canAct ? (
                  <TableCell className="text-end">
                    {hasRowActions ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{messages.common.openActions}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canReceive && isDraft ? (
                            <DropdownMenuItem onClick={() => onReceive(purchaseInvoice)}>
                              <CheckCircle2 />
                              {t.receive}
                            </DropdownMenuItem>
                          ) : null}
                          {canOfferMarkPaid ? (
                            <DropdownMenuItem onClick={() => onMarkPaid(purchaseInvoice)}>
                              <Banknote />
                              {t.markPaid}
                            </DropdownMenuItem>
                          ) : null}
                          {canCancel && isDraft ? (
                            <DropdownMenuItem
                              onClick={() => onCancel(purchaseInvoice)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle />
                              {messages.common.cancel}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
