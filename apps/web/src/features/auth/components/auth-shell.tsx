import { brandConfig } from '@erp-smart/branding';
import { Logo } from '@erp-smart/ui';
import { Check } from 'lucide-react';

const VALUE_PROPS = [
  'Track products, stock, and sales in one place',
  'Invite your team with role-based permissions',
  'A clear financial picture, always up to date',
];

/**
 * Shared shell for every auth-flow screen (login, register, forgot/reset
 * password, verify-email, accept-invite). Purely a layout wrapper — form
 * logic/mutations stay entirely in each page. Two columns on lg+: the
 * page's own Card on the start side, a branded panel on the end side;
 * collapses to a single centered column (with a small inline wordmark) on
 * smaller screens.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      <div className="flex w-full flex-col items-center justify-center gap-8 p-4 lg:w-1/2">
        <div className="lg:hidden">
          <Logo wordmark={brandConfig.productName} />
        </div>
        {children}
      </div>
      <div className="relative hidden w-1/2 flex-col justify-center gap-10 overflow-hidden bg-primary px-16 lg:flex">
        <Logo markSize={36} wordmark={brandConfig.productName} wordmarkClassName="text-xl" inverted />
        <div className="space-y-5">
          <p className="text-3xl font-semibold leading-snug text-primary-foreground">{brandConfig.tagline}</p>
          <ul className="space-y-3">
            {VALUE_PROPS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-primary-foreground/80">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
