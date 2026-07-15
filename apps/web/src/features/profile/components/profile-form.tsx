'use client';

import type { UserProfile } from '@erp-smart/types';
import { Button, Card, CardContent, CardHeader, CardTitle, FormField, Input, toast } from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { useUpdateProfile } from '../hooks';

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const updateMutation = useUpdateProfile();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const { messages } = useLocale();
  const t = messages.profile;

  useEffect(() => {
    setFullName(profile.fullName);
    setPhone(profile.phone ?? '');
  }, [profile]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      setError(t.fullNameRequired);
      return;
    }
    setError(null);

    updateMutation.mutate(
      { fullName: fullName.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: () => toast({ title: t.profileUpdated }),
        onError: (err) => toast({ variant: 'destructive', title: t.updateProfileFailed, description: err.message }),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.personalInfo}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={messages.common.email} htmlFor="profile-email" description={t.emailChangeHint}>
            <Input id="profile-email" value={profile.email} disabled />
          </FormField>
          <FormField label={t.fullName} htmlFor="profile-full-name" required error={error ?? undefined}>
            <Input id="profile-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </FormField>
          <FormField label={messages.common.phone} htmlFor="profile-phone">
            <Input id="profile-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? messages.common.saving : messages.common.saveChanges}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
