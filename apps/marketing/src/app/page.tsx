import { brandConfig } from '@erp-smart/branding';
import { getMessages } from '@erp-smart/i18n';
import { Button, Logo } from '@erp-smart/ui';

export default function MarketingHomePage() {
  const messages = getMessages('en');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <Logo markSize={36} wordmark={brandConfig.productName} wordmarkClassName="text-xl" />
      <div className="max-w-xl space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">{messages.marketing.heroTitle}</h1>
        <p className="text-lg text-muted-foreground">{messages.marketing.heroSubtitle}</p>
      </div>
      <div className="flex gap-4">
        <Button size="lg">{messages.marketing.getStarted}</Button>
        <Button size="lg" variant="outline">
          {messages.marketing.learnMore}
        </Button>
      </div>
    </main>
  );
}
