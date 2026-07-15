'use client';

import type { Product } from '@erp-smart/types';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@erp-smart/ui';
import { AlertTriangle } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';

export function LowStockPanel({ products }: { products: Product[] }) {
  const { messages } = useLocale();
  const t = messages.inventory;
  if (products.length === 0) return null;

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <CardTitle className="text-base">{t.lowStockCount.replace('{{count}}', String(products.length))}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {product.name}
                {product.sku ? <span className="text-muted-foreground"> ({product.sku})</span> : null}
              </span>
              <Badge variant="warning">
                {product.quantityOnHand} / {product.lowStockThreshold} {t.onHand}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
