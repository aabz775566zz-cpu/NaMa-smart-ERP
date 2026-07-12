'use client';

import { EmptyState, Skeleton } from '@erp-smart/ui';

import { ChangePasswordForm } from '@/features/profile/components/change-password-form';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { useProfile } from '@/features/profile/hooks';

export default function ProfilePage() {
  const profileQuery = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and account security.</p>
      </div>

      {profileQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : profileQuery.isError || !profileQuery.data ? (
        <EmptyState
          title="Couldn't load your profile"
          description={profileQuery.error instanceof Error ? profileQuery.error.message : 'Please try again.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProfileForm profile={profileQuery.data} />
          <ChangePasswordForm />
        </div>
      )}
    </div>
  );
}
