import { brandConfig } from '@erp-smart/branding';
import { getLocaleConfig, resolveLocale } from '@erp-smart/i18n';
import { Button, Logo } from '@erp-smart/ui';
import { Boxes, ShieldCheck, Users } from 'lucide-react';
import { cookies } from 'next/headers';

import { LanguageSwitcher } from '@/components/language-switcher';

const LOCALE_COOKIE_NAME = 'erp-smart-locale';

const FEATURES = [
  { icon: Boxes, titleKey: 'valueProp1' as const },
  { icon: Users, titleKey: 'valueProp2' as const },
  { icon: ShieldCheck, titleKey: 'valueProp3' as const },
];

export default async function MarketingHomePage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const { messages } = getLocaleConfig(locale);

  return (
    <main className="flex min-h-screen flex-col items-center gap-16 p-4 py-12 text-center">
      <div className="flex w-full max-w-5xl items-center justify-between">
        <Logo markSize={32} wordmark={brandConfig.productName} wordmarkClassName="text-lg" />
        <LanguageSwitcher locale={locale} />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="max-w-xl space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{messages.marketing.heroTitle}</h1>
          <p className="text-lg text-muted-foreground">{messages.marketing.heroSubtitle}</p>
        </div>
        <div className="flex gap-4">
          <Button size="lg" asChild>
            <a href={`${brandConfig.webAppUrl}/register`}>{messages.marketing.getStarted}</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">{messages.marketing.learnMore}</a>
          </Button>
        </div>
      </div>

      <div id="features" className="grid w-full max-w-4xl scroll-mt-8 grid-cols-1 gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, titleKey }) => (
          <div key={titleKey} className="flex flex-col items-center gap-3 rounded-lg border border-border p-6 text-start sm:items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-foreground">{messages.auth[titleKey]}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
