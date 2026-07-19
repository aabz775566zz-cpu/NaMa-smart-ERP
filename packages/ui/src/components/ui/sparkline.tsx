'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * Dependency-free SVG area sparkline. Colour comes entirely from
 * `currentColor`, so callers pick the voice with a text-* class
 * (`text-primary` for revenue, `text-accent-brand` for AI surfaces) and the
 * line + gradient fill follow — the component itself has no colour opinion.
 *
 * Time axis: oldest→newest, left-to-right — the same convention Arabic
 * stock and banking apps use, and SVG path geometry is inherently immune to
 * CSS `direction`, so the axis can never accidentally mirror under RTL.
 */
export function Sparkline({
  values,
  className,
  strokeWidth = 2,
}: {
  values: number[];
  className?: string;
  strokeWidth?: number;
}) {
  const gradientId = React.useId();

  if (values.length < 2) return null;

  const W = 100;
  const H = 32;
  // Inset so the stroke never clips at the viewBox edge on peak values.
  const PAD = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * W;
    // Flat series (including all-zero) draws as a calm baseline near the
    // bottom, not a mid-air line pretending to be data.
    const normalized = range === 0 ? 0 : (value - min) / range;
    const y = PAD + (1 - normalized) * (H - PAD * 2);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('block h-10 w-full', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
