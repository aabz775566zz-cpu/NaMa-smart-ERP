'use client';

import { Button } from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

export type ReportSection = 'overview' | 'daily-close' | 'sales' | 'products' | 'customers' | 'inventory';

// No Tabs primitive exists in packages/ui — a plain button group is enough
// for switching between 5 report sections, so one wasn't added just for this.
export function ReportNav({ active, onChange }: { active: ReportSection; onChange: (section: ReportSection) => void }) {
  const { messages } = useLocale();
  const t = messages.reports;
  const SECTIONS: { key: ReportSection; label: string }[] = [
    { key: 'overview', label: t.navOverview },
    { key: 'daily-close', label: t.navDailyClose },
    { key: 'sales', label: t.navSales },
    { key: 'products', label: t.navProducts },
    { key: 'customers', label: t.navCustomers },
    { key: 'inventory', label: t.navInventory },
  ];

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
