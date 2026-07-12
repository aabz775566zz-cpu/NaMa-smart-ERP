'use client';

import type { PermissionKey } from '@erp-smart/types';
import { EmptyState } from '@erp-smart/ui';
import type { LucideIcon } from 'lucide-react';
import { ShieldAlert } from 'lucide-react';

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

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center">
      {allowed ? (
        <EmptyState icon={<Icon />} title={title} description={description} />
      ) : (
        <EmptyState
          icon={<ShieldAlert />}
          title="You don't have access to this section"
          description="Ask a company owner or manager if you need this permission."
        />
      )}
    </div>
  );
}
