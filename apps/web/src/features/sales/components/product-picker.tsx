'use client';

import type { Product } from '@erp-smart/types';
import { Badge, Input } from '@erp-smart/ui';
import { Package, Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { useFormatMoney } from '@/lib/format/money';
import { useLocale } from '@/lib/locale/locale-context';

const MAX_RESULTS = 8;

/**
 * Search-as-you-type, click-to-add product picker — the actual bottleneck
 * fix for Phase 5 (the old flow was one non-searchable <Select> per line).
 * Enter adds the top match and clears the field: a barcode scanner behaves
 * like a keyboard that types the code then presses Enter, so this same
 * input doubles as a scan target today with zero extra integration work —
 * no new Product field or backend change needed until real scanner
 * hardware is in scope.
 */
export function ProductPicker({
  products,
  onSelect,
  autoFocus,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const { messages } = useLocale();
  const t = messages.sales;
  const formatMoney = useFormatMoney();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (product) =>
          product.status === 'ACTIVE' &&
          (product.name.toLowerCase().includes(q) || (product.sku?.toLowerCase().includes(q) ?? false)),
      )
      .slice(0, MAX_RESULTS);
  }, [products, query]);

  function handleSelect(product: Product) {
    onSelect(product);
    setQuery('');
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      handleSelect(results[0]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          autoFocus={autoFocus}
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          className="ps-9"
        />
      </div>
      {results.length > 0 ? (
        <div className="max-h-56 overflow-y-auto rounded-md border border-border">
          {results.map((product) => {
            const outOfStock = product.quantityOnHand <= 0;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-start last:border-b-0 hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sku ? `${product.sku} · ` : ''}
                    {formatMoney(product.sellingPrice)}
                  </p>
                </div>
                <Badge variant={outOfStock ? 'destructive' : 'outline'} className="shrink-0">
                  {outOfStock
                    ? t.outOfStock
                    : t.inStock.replace('{{quantity}}', String(product.quantityOnHand)).replace('{{unit}}', product.unit)}
                </Badge>
              </button>
            );
          })}
        </div>
      ) : query.trim() ? (
        <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          {t.noMatchingProducts}
        </p>
      ) : null}
    </div>
  );
}
