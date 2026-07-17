'use client';

import { buttonVariants } from '@erp-smart/ui';
import { Package, ShoppingCart, UserPlus } from 'lucide-react';
import Link from 'next/link';

import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

const ACTIONS = [
  { labelKey: 'newSale', href: '/dashboard/sales', icon: ShoppingCart, permission: 'SALES:CREATE' },
  { labelKey: 'newCustomer', href: '/dashboard/customers', icon: UserPlus, permission: 'CUSTOMERS:CREATE' },
  { labelKey: 'newProduct', href: '/dashboard/products', icon: Package, permission: 'PRODUCTS:CREATE' },
] as const;

// Deliberately not another bordered Card: the greeting header, this action
// row, KpiOverview, and AttentionList already stack as four surfaces on this
// page — boxing every one of them reads as a wall of cards. A plain row of
// outline buttons sits as a lightweight control bar directly under the page
// title, the same relationship a toolbar has to the content below it,
// consistent with how Button's own hover/focus/active states already look
// everywhere else in the app.
export function QuickActions() {
  const permissions = usePermissions();
  const { messages } = useLocale();
  const t = messages.dashboard.quickActions;

  const visible = ACTIONS.filter((action) => permissions.includes(action.permission));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {visible.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}
        >
          <action.icon className="h-4 w-4 text-primary" />
          {t[action.labelKey]}
        </Link>
      ))}
    </div>
  );
}
