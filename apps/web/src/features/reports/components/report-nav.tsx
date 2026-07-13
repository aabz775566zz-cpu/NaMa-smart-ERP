'use client';

import { Button } from '@erp-smart/ui';

export type ReportSection = 'overview' | 'daily-close' | 'sales' | 'products' | 'customers' | 'inventory';

const SECTIONS: { key: ReportSection; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'daily-close', label: 'Daily Close' },
  { key: 'sales', label: 'Sales' },
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
  { key: 'inventory', label: 'Inventory' },
];

// No Tabs primitive exists in packages/ui — a plain button group is enough
// for switching between 5 report sections, so one wasn't added just for this.
export function ReportNav({ active, onChange }: { active: ReportSection; onChange: (section: ReportSection) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SECTIONS.map((section) => (
        <Button
          key={section.key}
          type="button"
          variant={active === section.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(section.key)}
        >
          {section.label}
        </Button>
      ))}
    </div>
  );
}
