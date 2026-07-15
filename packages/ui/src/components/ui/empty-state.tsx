import * as React from 'react';

import { cn } from '../../lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Any icon element, sized via the [&_svg] rule below — domain-agnostic,
   * the feature layer decides what icon fits its own empty list. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** 'success' reads the empty state as a genuinely good outcome (e.g.
   * "nothing needs attention") rather than a neutral/error one. Defaults
   * to 'default', which is byte-for-byte identical to today's rendering. */
  tone?: 'default' | 'success';
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, tone = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
      {...props}
    >
      {icon ? (
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full [&_svg]:size-6',
            tone === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
