'use client';

import { Button, FormField, Input } from '@erp-smart/ui';

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const PRESETS: Array<{ label: string; range: () => { from: string; to: string } }> = [
  {
    label: 'Today',
    range: () => {
      const today = new Date();
      return { from: isoDate(today), to: isoDate(today) };
    },
  },
  {
    label: 'This week',
    range: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { from: isoDate(start), to: isoDate(now) };
    },
  },
  {
    label: 'This month',
    range: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: isoDate(start), to: isoDate(now) };
    },
  },
  {
    label: 'Last month',
    range: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: isoDate(start), to: isoDate(end) };
    },
  },
  {
    label: 'This year',
    range: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: isoDate(start), to: isoDate(now) };
    },
  },
];

// Maps directly to ReportDateRangeDto's from/to/limit — @IsISO8601() accepts
// a bare YYYY-MM-DD date, which is exactly what <input type="date"> produces
// and what the presets above compute.
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
  function applyPreset(range: { from: string; to: string }) {
    onFromChange(range.from);
    onToChange(range.to);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(preset.range())}
          >
            {preset.label}
          </Button>
        ))}
      </div>
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
    </div>
  );
}
