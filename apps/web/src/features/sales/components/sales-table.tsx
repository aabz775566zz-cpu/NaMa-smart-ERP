'use client';

import type { PaymentMethod, PaymentStatus, Sale } from '@erp-smart/types';
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
import { CheckCircle2, MoreHorizontal, XCircle } from 'lucide-react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';
import { useHasPermission } from '@/lib/store';

import { SaleStatusBadge } from './sale-status-badge';

export function SalesTable({
  sales,
  customerNameById,
  onComplete,
  onCancel,
}: {
  sales: Sale[];
  customerNameById: Map<string, string>;
  onComplete: (sale: Sale) => void;
  onCancel: (sale: Sale) => void;
}) {
  // complete() is gated by SALES:CREATE (not UPDATE) and cancel() by
  // SALES:DELETE — matches the real permission model in sales.controller.ts,
  // not an assumption carried over from Products/Customers.
  const canComplete = useHasPermission('SALES:CREATE');
  const canCancel = useHasPermission('SALES:DELETE');
  const canAct = canComplete || canCancel;
  const formatMoney = useFormatMoney();
  const { messages } = useLocale();
  const t = messages.sales;
  const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: messages.common.methodCash,
    CARD: messages.common.methodCard,
    TRANSFER: messages.common.methodTransfer,
    OTHER: messages.common.methodOther,
  };
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
            <TableHead>{t.customer}</TableHead>
            <TableHead>{t.total}</TableHead>
            <TableHead>{t.payment}</TableHead>
            <TableHead>{messages.common.status}</TableHead>
            {canAct ? <TableHead className="text-end">{messages.common.actions}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const isDraft = sale.status === 'DRAFT';
            return (
              <TableRow key={sale.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-foreground">
                  {sale.customerId ? (customerNameById.get(sale.customerId) ?? '—') : t.walkInCustomer}
                </TableCell>
                <TableCell className="font-medium tabular-nums text-foreground">{formatMoney(sale.totalAmount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    {METHOD_LABELS[sale.paymentMethod]}
                    <Badge variant="outline">{PAYMENT_STATUS_LABELS[sale.paymentStatus]}</Badge>
                  </span>
                </TableCell>
                <TableCell>
                  <SaleStatusBadge status={sale.status} />
                </TableCell>
                {canAct ? (
                  <TableCell className="text-end">
                    {isDraft ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{messages.common.openActions}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canComplete ? (
                            <DropdownMenuItem onClick={() => onComplete(sale)}>
                              <CheckCircle2 />
                              {t.complete}
                            </DropdownMenuItem>
                          ) : null}
                          {canCancel ? (
                            <DropdownMenuItem
                              onClick={() => onCancel(sale)}
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
