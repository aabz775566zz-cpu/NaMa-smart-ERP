'use client';

import { getMessages } from '@erp-smart/i18n';
import { Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@erp-smart/ui';
import Link from 'next/link';

import { useLogout } from '@/features/auth';
import { useAuthStore, useCurrentUser } from '@/lib/store';

// This is a Step 1 foundation-verification view, not the product's real
// landing/home experience — it exists to prove the API client, auth store,
// silent-refresh-on-boot flow, and design-system primitives all work
// together end to end. The dashboard shell (Step 2) replaces the
// authenticated case; this page's job here is purely diagnostic.
export default function HomePage() {
  const messages = getMessages('en');
  const status = useAuthStore((state) => state.status);
  const user = useCurrentUser();
  const logoutMutation = useLogout();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{messages.app.welcome}</h1>
        <p className="text-muted-foreground">{messages.app.placeholder}</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Foundation session check</CardTitle>
          <CardDescription>Verifies the API client, auth store, and silent-refresh flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' || status === 'idle' ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{user.email.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.email}</p>
                  <Badge variant="secondary">{user.roleKey}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{user.permissions.length} permissions on this session</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Create a company</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
