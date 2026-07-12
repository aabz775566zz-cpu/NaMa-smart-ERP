import * as React from 'react';

import { cn } from '../../lib/utils';

// Generic, domain-agnostic brand mark — no knowledge of "ERP Smart"
// specifically. Callers pass their own wordmark text (see brandConfig in
// @erp-smart/branding) so packages/ui stays free of a dependency on the
// branding package, matching the existing generic-vs-domain split used
// throughout this design system. Colors come entirely from the primary/
// primary-foreground tokens, so the mark is automatically theme-aware.
export interface LogoMarkProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
  /** Use on a bg-primary surface (e.g. the auth brand panel) so the tile doesn't blend into its background. */
  inverted?: boolean;
}

const LogoMark = React.forwardRef<SVGSVGElement, LogoMarkProps>(
  ({ className, size = 28, inverted = false, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      <rect width="28" height="28" rx="8" className={inverted ? 'fill-primary-foreground' : 'fill-primary'} />
      <rect
        x="7"
        y="15"
        width="4"
        height="6"
        rx="1.5"
        className={inverted ? 'fill-primary' : 'fill-primary-foreground'}
      />
      <rect
        x="12"
        y="10"
        width="4"
        height="11"
        rx="1.5"
        className={inverted ? 'fill-primary' : 'fill-primary-foreground'}
      />
      <rect
        x="17"
        y="6"
        width="4"
        height="15"
        rx="1.5"
        className={inverted ? 'fill-primary' : 'fill-primary-foreground'}
      />
    </svg>
  ),
);
LogoMark.displayName = 'LogoMark';

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  markSize?: number;
  /** Wordmark text — pass brandConfig.productName from the calling app. Omit for icon-only. */
  wordmark?: string;
  wordmarkClassName?: string;
  inverted?: boolean;
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, markSize = 28, wordmark, wordmarkClassName, inverted = false, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
      <LogoMark size={markSize} inverted={inverted} />
      {wordmark ? (
        <span
          className={cn(
            'truncate text-base font-semibold tracking-tight',
            inverted ? 'text-primary-foreground' : 'text-foreground',
            wordmarkClassName,
          )}
        >
          {wordmark}
        </span>
      ) : null}
    </div>
  ),
);
Logo.displayName = 'Logo';

export { Logo, LogoMark };
