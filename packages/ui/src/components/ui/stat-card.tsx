import * as React from 'react';

import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';

// Domain-agnostic labeled-metric card — no knowledge of Reports/Sales/etc.
// itself, just label + value + optional icon/description.
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, icon, description, ...props }, ref) => (
    <Card ref={ref} className={cn(className)} {...props}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon ? <div className="text-muted-foreground [&_svg]:size-4">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  ),
);
StatCard.displayName = 'StatCard';

export { StatCard };
