'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * The "hero chart" primitive — a bigger, richer sibling of Sparkline for the
 * one or two places per page that earn a full data visualization (dashboard
 * revenue trend, a report's headline series). Adds horizontal gridlines, a
 * gradient area fill, and a glowing marker on the last point — the visual
 * vocabulary premium dashboards (Linear insights, Stripe, Vercel analytics)
 * all share. Colour comes entirely from `currentColor`; callers set the
 * voice with a text-* class exactly like Sparkline.
 *
 * Time axis is oldest→newest, left-to-right, unaffected by CSS `direction`
 * (SVG path geometry) — same convention as Sparkline, for the same reason.
 */
export function AreaChart({
  values,
  labels,
  className,
  strokeWidth = 2.5,
  gridLines = 3,
}: {
  values: number[];
  /** Optional x-axis labels, same length as values — rendered sparse
   * (first/middle/last) beneath the chart, not one per point. */
  labels?: string[];
  className?: string;
  strokeWidth?: number;
  gridLines?: number;
}) {
  const gradientId = React.useId();

  if (values.length < 2) return null;

  const W = 300;
  const H = 96;
  const PAD_Y = 6;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;

  const points = values.map((value, i) => {
    const x = (i / (values.length - 1)) * W;
    const normalized = (value - min) / range;
    const y = PAD_Y + (1 - normalized) * (H - PAD_Y * 2);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];

  const gridYs = Array.from({ length: gridLines }, (_, i) => (H / (gridLines + 1)) * (i + 1));

  const sparseLabels =
    labels && labels.length >= 2
      ? [labels[0], labels[Math.floor((labels.length - 1) / 2)], labels[labels.length - 1]]
      : null;

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="block h-28 w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridYs.map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2={W}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

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

        {/* Glow halo + solid dot on the latest value — "today", the one
            point on the line that matters most right now. */}
        <circle cx={last.x} cy={last.y} r="7" fill="currentColor" opacity="0.18" />
        <circle cx={last.x} cy={last.y} r="3" fill="currentColor" className="dark:drop-shadow-[0_0_6px_currentColor]" />
      </svg>
      {sparseLabels ? (
        <div className="mt-1 flex justify-between text-[0.65rem] text-muted-foreground/70">
          {sparseLabels.map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
