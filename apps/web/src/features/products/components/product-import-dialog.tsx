'use client';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp-smart/ui';
import { AlertTriangle, CheckCircle2, Download, FileUp, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type { ImportProductRow, ImportRowResult } from '../api';
import { categoriesKeys, productsKeys, useImportProducts } from '../hooks';

// Rows are sent to the server in chunks rather than one giant request — an
// awaited loop naturally yields to the event loop between chunks, so a
// 5000-row file never blocks the UI thread the way one huge synchronous
// request/response cycle would, and progress can be shown as it goes.
const CHUNK_SIZE = 200;
// The preview table renders at most this many rows — validating/parsing all
// 5000+ rows in memory is cheap, but mounting 5000 DOM rows is not. Every
// row is still validated and (if valid) imported; only the on-screen table
// is capped.
const MAX_PREVIEW_ROWS = 50;

const TEMPLATE_CSV =
  'name,sku,category,purchasePrice,sellingPrice,unit,openingQuantity,lowStockThreshold\n' +
  'Rice 10kg,RICE-10KG,Groceries,8,12,bag,50,10\n';

interface ParsedRow {
  index: number;
  data: ImportProductRow;
  errors: string[];
}

type Step = 'select' | 'preview' | 'importing' | 'done';

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function validateRow(raw: Record<string, string>, index: number, seenSkus: Set<string>): ParsedRow {
  const errors: string[] = [];
  const name = (raw.name ?? '').trim();
  if (!name) errors.push('Name is required.');

  const purchasePrice = parseNumber(raw.purchasePrice);
  if (purchasePrice === undefined || Number.isNaN(purchasePrice) || purchasePrice < 0) {
    errors.push('Purchase price must be a number ≥ 0.');
  }
  const sellingPrice = parseNumber(raw.sellingPrice);
  if (sellingPrice === undefined || Number.isNaN(sellingPrice) || sellingPrice < 0) {
    errors.push('Selling price must be a number ≥ 0.');
  }

  const openingQuantityRaw = parseNumber(raw.openingQuantity);
  if (openingQuantityRaw !== undefined && (Number.isNaN(openingQuantityRaw) || !Number.isInteger(openingQuantityRaw) || openingQuantityRaw < 0)) {
    errors.push('Opening quantity must be a whole number ≥ 0.');
  }
  const lowStockRaw = parseNumber(raw.lowStockThreshold);
  if (lowStockRaw !== undefined && (Number.isNaN(lowStockRaw) || !Number.isInteger(lowStockRaw) || lowStockRaw < 0)) {
    errors.push('Low stock threshold must be a whole number ≥ 0.');
  }

  const sku = raw.sku?.trim() || undefined;
  if (sku) {
    if (seenSkus.has(sku)) {
      errors.push(`Duplicate SKU "${sku}" elsewhere in this file.`);
    }
    seenSkus.add(sku);
  }

  return {
    index,
    errors,
    data: {
      name,
      sku,
      category: raw.category?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      purchasePrice: purchasePrice ?? 0,
      sellingPrice: sellingPrice ?? 0,
      unit: raw.unit?.trim() || undefined,
      openingQuantity: openingQuantityRaw,
      lowStockThreshold: lowStockRaw,
    },
  };
}

export function ProductImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<Step>('select');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ImportRowResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportProducts();
  const queryClient = useQueryClient();

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidRows = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);

  function reset() {
    setStep('select');
    setFileName('');
    setRows([]);
    setParseError(null);
    setProgress({ done: 0, total: 0 });
    setResults([]);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setParseError(result.errors[0].message);
          return;
        }
        const seenSkus = new Set<string>();
        const parsed = result.data.map((raw, i) => validateRow(raw, i, seenSkus));
        setRows(parsed);
        setStep('preview');
      },
      error: (error) => setParseError(error.message),
    });

    // Allow re-selecting the same file name after a reset.
    event.target.value = '';
  }

  function handleDownloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    setStep('importing');
    setProgress({ done: 0, total: validRows.length });
    const allResults: ImportRowResult[] = invalidRows.map((r) => ({
      row: r.index,
      success: false,
      name: r.data.name || `Row ${r.index + 1}`,
      error: r.errors.join(' '),
    }));

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE).map((r) => r.data);
      try {
        const chunkResults = await importMutation.mutateAsync(chunk);
        allResults.push(...chunkResults);
      } catch (error) {
        chunk.forEach((row) =>
          allResults.push({
            row: -1,
            success: false,
            name: row.name,
            error: error instanceof Error ? error.message : 'Import request failed.',
          }),
        );
      }
      setProgress({ done: Math.min(i + CHUNK_SIZE, validRows.length), total: validRows.length });
    }

    setResults(allResults);
    setStep('done');
    queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
  }

  const successCount = results.filter((r) => r.success).length;
  const failureResults = results.filter((r) => !r.success);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import products from CSV</DialogTitle>
          <DialogDescription>
            Bulk-add products from a spreadsheet — supports large catalogs, validates before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pe-1">
          {step === 'select' ? (
            <div className="space-y-4">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download />
                Download CSV template
              </Button>
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Required columns: <span className="font-medium text-foreground">name, purchasePrice, sellingPrice</span>.
                  Optional: sku, category, unit, openingQuantity, lowStockThreshold, description.
                </p>
                <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
                  <Upload />
                  Choose CSV file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {parseError ? <p className="text-sm font-medium text-destructive">{parseError}</p> : null}
            </div>
          ) : null}

          {step === 'preview' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{fileName}</span> — {rows.length} rows found.
              </p>
              <div className="flex gap-2">
                <Badge variant="success">{validRows.length} ready to import</Badge>
                {invalidRows.length > 0 ? <Badge variant="destructive">{invalidRows.length} have errors</Badge> : null}
              </div>

              <div className="max-h-80 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, MAX_PREVIEW_ROWS).map((row) => (
                      <TableRow key={row.index}>
                        <TableCell className="text-muted-foreground">{row.index + 1}</TableCell>
                        <TableCell className="font-medium text-foreground">{row.data.name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{row.data.sellingPrice}</TableCell>
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <Badge variant="success">Valid</Badge>
                          ) : (
                            <span className="text-xs text-destructive">{row.errors.join(' ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > MAX_PREVIEW_ROWS ? (
                <p className="text-xs text-muted-foreground">
                  Showing the first {MAX_PREVIEW_ROWS} of {rows.length} rows — all {rows.length} will be validated and
                  imported.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 'importing' ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Importing {progress.done} of {progress.total}…
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : null}

          {step === 'done' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  <span className="font-medium text-foreground">{successCount}</span> products created.
                </span>
              </div>
              {failureResults.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span>
                      <span className="font-medium text-foreground">{failureResults.length}</span> rows failed.
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {failureResults.map((result, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-muted-foreground">
                              {result.row >= 0 ? result.row + 1 : '—'}
                            </TableCell>
                            <TableCell>{result.name}</TableCell>
                            <TableCell className="text-xs text-destructive">{result.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {step === 'preview' ? (
            <>
              <Button variant="outline" onClick={reset}>
                Choose a different file
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                Import {validRows.length} products
              </Button>
            </>
          ) : step === 'done' ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
