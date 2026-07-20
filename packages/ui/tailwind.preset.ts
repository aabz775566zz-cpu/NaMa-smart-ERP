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
        // Iris — the dedicated AI colour (Constitution ch.7, 15). Distinct
        // from `accent` above (a neutral warm hover-surface tint used by
        // Button/Select/DropdownMenu/Sidebar). Reserved solely for surfaces
        // where the product's intelligence is present; never decorative.
        'accent-brand': {
          DEFAULT: 'hsl(var(--accent-brand))',
          foreground: 'hsl(var(--accent-brand-foreground))',
        },
        // The nav rail's own surface: same as card in light, a step darker
        // than the page in dark so content reads as lifted (Golden Night).
        sidebar: 'hsl(var(--sidebar))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Warm Clarity elevation (Constitution ch.4, 14). A cool-black shadow
      // reads as grey and foreign on a warm Bone surface; ours are tinted
      // with warm Ink so light and shadow belong to the same world. Geometry
      // matches Tailwind's default scale; only the colour is warmed, and the
      // whole scale is deliberately soft — premium light is gentle, not heavy.
      // (`shadow-xs` also fills the gap Tailwind 3.x leaves — it has no `xs`.)
      boxShadow: {
        xs: '0 1px 2px 0 hsl(30 45% 12% / 0.05)',
        sm: '0 1px 3px 0 hsl(30 45% 12% / 0.07), 0 1px 2px -1px hsl(30 45% 12% / 0.07)',
        DEFAULT: '0 1px 3px 0 hsl(30 45% 12% / 0.08), 0 1px 2px -1px hsl(30 45% 12% / 0.06)',
        md: '0 4px 8px -2px hsl(30 45% 12% / 0.08), 0 2px 4px -2px hsl(30 45% 12% / 0.05)',
        lg: '0 12px 20px -4px hsl(30 45% 12% / 0.10), 0 4px 8px -4px hsl(30 45% 12% / 0.06)',
        xl: '0 20px 28px -6px hsl(30 45% 12% / 0.12), 0 8px 12px -6px hsl(30 45% 12% / 0.07)',
        // Golden Night (dark mode) additions. `card-dark` is the premium
        // dark-surface treatment: a 1px warm inner highlight along the top
        // edge (light catching the rim) over a true black drop — the classic
        // lifted-glass reading. The glows are Saffron/Iris lamplight for the
        // few surfaces allowed to shine: primary CTAs, the ask-bar, the hero.
        'card-dark': 'inset 0 1px 0 0 hsl(40 40% 96% / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.5)',
        'glow-primary': '0 0 32px -6px hsl(var(--primary) / 0.45)',
        'glow-primary-sm': '0 0 18px -4px hsl(var(--primary) / 0.35)',
        'glow-iris': '0 0 28px -6px hsl(var(--accent-brand) / 0.4)',
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
