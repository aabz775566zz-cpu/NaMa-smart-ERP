'use client';

import type { Supplier } from '@erp-smart/types';
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

import { useDeleteSupplier } from '../hooks';

export function DeleteSupplierDialog({
  supplier,
  open,
  onOpenChange,
}: {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { messages } = useLocale();
  const t = messages.suppliers;
  const deleteMutation = useDeleteSupplier();

  function handleConfirm() {
    if (!supplier) return;
    deleteMutation.mutate(supplier.id, {
      onSuccess: () => {
        toast({ title: t.supplierDeleted });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: t.deleteFailed, description: error.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.deleteSupplierTitle}</DialogTitle>
          <DialogDescription>
            {supplier ? t.deleteSupplierDescription.replace('{{name}}', supplier.name) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {messages.common.cancel}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? messages.common.deleting : messages.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
