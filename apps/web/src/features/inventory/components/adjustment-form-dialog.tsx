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
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import type { AdjustableMovementType, CreateAdjustmentInput } from '../api';
import { useCreateAdjustment } from '../hooks';

const ADJUSTABLE_TYPES: AdjustableMovementType[] = ['PURCHASE', 'ADJUSTMENT', 'RETURN'];

type FormErrors = Partial<Record<'productId' | 'quantityChange', string>>;

// Only PURCHASE/ADJUSTMENT/RETURN are creatable here — matches
// CreateInventoryAdjustmentDto exactly. PURCHASE/RETURN must be positive
// (backend rejects a negative quantityChange for those types with 400);
// ADJUSTMENT can go either direction (e.g. a negative correction for
// shrinkage/damage), so its input allows a signed value.
export function AdjustmentFormDialog({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}) {
  const { messages } = useLocale();
  const t = messages.inventory;
  const TYPE_LABELS: Record<AdjustableMovementType, string> = {
    PURCHASE: t.typePurchase,
    ADJUSTMENT: t.typeAdjustment,
    RETURN: t.typeReturn,
  };
  const createMutation = useCreateAdjustment();

  const [productId, setProductId] = useState('');
  const [type, setType] = useState<AdjustableMovementType>('PURCHASE');
  const [quantityChange, setQuantityChange] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setProductId('');
      setType('PURCHASE');
      setQuantityChange('');
      setNote('');
      setErrors({});
    }
  }, [open]);

  const requiresPositive = type === 'PURCHASE' || type === 'RETURN';

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!productId) nextErrors.productId = t.selectProductError;

    const qty = Number(quantityChange);
    if (quantityChange.trim() === '' || !Number.isInteger(qty) || qty === 0) {
      nextErrors.quantityChange = t.nonZeroError;
    } else if (requiresPositive && qty < 0) {
      nextErrors.quantityChange = t.positiveQuantityError.replace('{{type}}', TYPE_LABELS[type]);
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const input: CreateAdjustmentInput = {
      productId,
      type,
      quantityChange: Number(quantityChange),
      note: note.trim() || undefined,
    };

    createMutation
      .mutateAsync(input)
      .then(() => {
        toast({ title: t.adjustmentRecorded });
        onOpenChange(false);
      })
      .catch((error: Error) => {
        toast({ variant: 'destructive', title: t.adjustmentFailed, description: error.message });
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.newAdjustmentTitle}</DialogTitle>
          <DialogDescription>{t.newAdjustmentDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={messages.common.product} htmlFor="adjustment-product" required error={errors.productId}>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="adjustment-product">
                <SelectValue placeholder={t.selectProduct} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` (${product.sku})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.type} htmlFor="adjustment-type">
              <Select value={type} onValueChange={(value) => setType(value as AdjustableMovementType)}>
                <SelectTrigger id="adjustment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTABLE_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={requiresPositive ? t.quantity : t.quantityChangeSigned}
              htmlFor="adjustment-quantity"
              required
              error={errors.quantityChange}
              description={requiresPositive ? undefined : t.quantityChangeHint}
            >
              <Input
                id="adjustment-quantity"
                type="number"
                step="1"
                min={requiresPositive ? '1' : undefined}
                value={quantityChange}
                onChange={(event) => setQuantityChange(event.target.value)}
              />
            </FormField>
          </div>

          <FormField label={messages.common.note} htmlFor="adjustment-note">
            <Textarea id="adjustment-note" value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? messages.common.saving : t.recordAdjustment}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
