'use client';

import { Button, FormField, Input } from '@erp-smart/ui';

// Maps directly to ReportDateRangeDto's from/to/limit — @IsISO8601() accepts
// a bare YYYY-MM-DD date, which is exactly what <input type="date"> produces.
export function DateRangeFilter({
  from,
  to,
  limit,
  showLimit,
  onFromChange,
  onToChange,
  onLimitChange,
  onClear,
}: {
  from: string;
  to: string;
  limit?: string;
  showLimit?: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onLimitChange?: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <FormField label="From" htmlFor="report-from">
        <Input id="report-from" type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
      </FormField>
      <FormField label="To" htmlFor="report-to">
        <Input id="report-to" type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
      </FormField>
      {showLimit ? (
        <FormField label="Top N" htmlFor="report-limit">
          <Input
            id="report-limit"
            type="number"
            min="1"
            max="100"
            className="w-24"
            value={limit ?? ''}
            onChange={(event) => onLimitChange?.(event.target.value)}
          />
        </FormField>
      ) : null}
      <Button type="button" variant="outline" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
