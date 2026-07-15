'use client';

import type { Product } from '@erp-smart/types';
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

import { useDeleteProduct } from '../hooks';

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { messages } = useLocale();
  const t = messages.products;
  const deleteMutation = useDeleteProduct();

  function handleConfirm() {
    if (!product) return;
    deleteMutation.mutate(product.id, {
      onSuccess: () => {
        toast({ title: t.productDeleted });
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
          <DialogTitle>{t.deleteProductTitle}</DialogTitle>
          <DialogDescription>
            {product ? t.deleteProductDescription.replace('{{name}}', product.name) : null}
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
