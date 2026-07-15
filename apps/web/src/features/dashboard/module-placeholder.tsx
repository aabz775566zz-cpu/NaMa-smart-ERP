'use client';

import type { PermissionKey } from '@erp-smart/types';
import { EmptyState } from '@erp-smart/ui';
import type { LucideIcon } from 'lucide-react';
import { ShieldAlert } from 'lucide-react';

import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

/**
 * Placeholder content for dashboard routes whose real feature work lands in
 * a later step. Still enforces permission visibility so a user who navigates
 * directly to a URL not in their nav sees a clear access message rather than
 * a confusing flash before the backend would 403 the underlying API calls.
 */
export function ModulePlaceholderPage({
  title,
  description,
  icon: Icon,
  requiredPermission,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  requiredPermission?: PermissionKey;
}) {
  const permissions = usePermissions();
  const allowed = !requiredPermission || permissions.includes(requiredPermission);
  const { messages } = useLocale();

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      {allowed ? (
        <EmptyState icon={<Icon />} title={title} description={description} />
      ) : (
        <EmptyState
          icon={<ShieldAlert />}
          title={messages.common.accessDeniedTitle}
          description={messages.common.accessDeniedDescription}
        />
      )}
    </div>
  );
}
