'use client';

import type { Invoice } from '@erp-smart/types';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp-smart/ui';
import { CheckCircle2, Eye } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

import { InvoiceStatusBadge } from './invoice-status-badge';

export function InvoicesTable({
  invoices,
  onView,
  onMarkPaid,
}: {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
}) {
  const canUpdate = useHasPermission('INVOICES:UPDATE');

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Issue date</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
              </TableCell>
              <TableCell className="font-medium text-foreground">{invoice.totalAmount}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onView(invoice)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View invoice</span>
                  </Button>
                  {canUpdate && invoice.status === 'ISSUED' ? (
                    <Button variant="ghost" size="icon" onClick={() => onMarkPaid(invoice)}>
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="sr-only">Mark as paid</span>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
