import { getMessages } from '@erp-smart/i18n';

export default function HomePage() {
  const messages = getMessages('en');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">{messages.app.welcome}</h1>
      <p className="text-muted-foreground">{messages.app.placeholder}</p>
    </main>
  );
}
