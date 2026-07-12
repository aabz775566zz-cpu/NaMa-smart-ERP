import { getMessages } from '@erp-smart/i18n';

export default function MarketingHomePage() {
  const messages = getMessages('en');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">{messages.marketing.heroTitle}</h1>
      <p className="text-lg text-muted-foreground">{messages.marketing.heroSubtitle}</p>
      <div className="flex gap-4">
        <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
          {messages.marketing.getStarted}
        </button>
        <button className="rounded-md border px-4 py-2">{messages.marketing.learnMore}</button>
      </div>
    </main>
  );
}
