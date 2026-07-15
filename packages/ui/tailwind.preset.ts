import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/** Shared Tailwind preset — apps consume via `presets: [uiPreset]` */
export default {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        // A 5th brand color (violet), distinct from `accent` above — that
        // one is a neutral hover-surface tint consumed by Button/Select/
        // DropdownMenu/Sidebar, not a brand color. Keeping them separate
        // means this doesn't recolor every hover state in the app.
        'accent-brand': {
          DEFAULT: 'hsl(var(--accent-brand))',
          foreground: 'hsl(var(--accent-brand-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Tailwind 3.x's default `boxShadow` scale has no `xs` key (that alias
      // only exists in Tailwind v4's renamed scale) — confirmed by
      // inspecting `tailwindcss/defaultTheme` at the installed 3.4.19.
      // Added here so `shadow-xs` (Card's subtle resting elevation) actually
      // resolves instead of silently producing no CSS.
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
      },
      // `--font-sans` is set by next/font/google (Inter) in each app's root
      // layout — see apps/web & apps/marketing layout.tsx. Falls back to the
      // system stack if that variable is ever absent (e.g. a consumer that
      // doesn't load the font), so nothing breaks if it's missing.
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
} satisfies Config;
