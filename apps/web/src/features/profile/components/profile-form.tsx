'use client';

import type { UserProfile } from '@erp-smart/types';
import { Button, Card, CardContent, CardHeader, CardTitle, FormField, Input, toast } from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useUpdateProfile } from '../hooks';

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const updateMutation = useUpdateProfile();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile.fullName);
    setPhone(profile.phone ?? '');
  }, [profile]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    setError(null);

    updateMutation.mutate(
      { fullName: fullName.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: () => toast({ title: 'Profile updated' }),
        onError: (err) => toast({ variant: 'destructive', title: 'Failed to update profile', description: err.message }),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Personal information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" htmlFor="profile-email" description="Contact support to change your email.">
            <Input id="profile-email" value={profile.email} disabled />
          </FormField>
          <FormField label="Full name" htmlFor="profile-full-name" required error={error ?? undefined}>
            <Input id="profile-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </FormField>
          <FormField label="Phone" htmlFor="profile-phone">
            <Input id="profile-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
