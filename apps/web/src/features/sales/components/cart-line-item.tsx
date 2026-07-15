'use client';

import type { Product } from '@erp-smart/types';
import { Button, Input } from '@erp-smart/ui';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

export function CartLineItem({
  product,
  quantity,
  onQuantityChange,
  onRemove,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.sales;
  const formatMoney = useFormatMoney();
  const lineTotal = Number(product.sellingPrice) * quantity;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
        <p className="text-xs text-muted-foreground">{formatMoney(product.sellingPrice)} {t.each}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        >
          <Minus className="h-3.5 w-3.5" />
          <span className="sr-only">{t.decreaseQuantity}</span>
        </Button>
        <Input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next > 0) onQuantityChange(next);
          }}
          className="h-7 w-14 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onQuantityChange(quantity + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only">{t.increaseQuantity}</span>
        </Button>
      </div>
      <p className="w-20 shrink-0 text-end text-sm font-medium text-foreground">{formatMoney(lineTotal)}</p>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">{t.removeItem}</span>
      </Button>
    </div>
  );
}
