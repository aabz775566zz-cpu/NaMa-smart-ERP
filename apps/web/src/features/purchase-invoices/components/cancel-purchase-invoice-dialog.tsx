'use client';

import type { PurchaseInvoice } from '@erp-smart/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

import { useCancelPurchaseInvoice } from '../hooks';

// There is no DELETE /purchase-invoices/:id — a purchase invoice can only be
// cancelled (DRAFT -> CANCELLED via POST /:id/cancel), never removed.
// Mirrors CancelSaleDialog exactly.
export function CancelPurchaseInvoiceDialog({
  purchaseInvoice,
  open,
  onOpenChange,
}: {
  purchaseInvoice: PurchaseInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { messages } = useLocale();
  const t = messages.purchaseInvoices;
  const cancelMutation = useCancelPurchaseInvoice();

  function handleConfirm() {
    if (!purchaseInvoice) return;
    cancelMutation.mutate(purchaseInvoice.id, {
      onSuccess: () => {
        toast({ title: t.purchaseInvoiceCancelled });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: t.cancelFailed, description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.cancelPurchaseInvoiceTitle}</DialogTitle>
          <DialogDescription>{t.cancelPurchaseInvoiceDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.keepPurchaseInvoice}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? t.cancelling : t.cancelPurchaseInvoiceTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
