'use client';

import type { Sale } from '@erp-smart/types';
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

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

import { useCancelSale } from '../hooks';

// There is no DELETE /sales/:id — a sale can only be cancelled (DRAFT ->
// CANCELLED via POST /sales/:id/cancel), never removed. Named for what the
// backend actually does rather than reusing the Products/Customers "delete"
// naming.
export function CancelSaleDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { messages } = useLocale();
  const t = messages.sales;
  const cancelMutation = useCancelSale();
  const formatMoney = useFormatMoney();

  function handleConfirm() {
    if (!sale) return;
    cancelMutation.mutate(sale.id, {
      onSuccess: () => {
        toast({ title: t.saleCancelled });
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
          <DialogTitle>{t.cancelSaleTitle}</DialogTitle>
          <DialogDescription>
            {sale
              ? t.cancelSaleDescription.replace('{{amount}}', formatMoney(sale.totalAmount))
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.keepSale}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? t.cancelling : t.cancelSaleTitle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
