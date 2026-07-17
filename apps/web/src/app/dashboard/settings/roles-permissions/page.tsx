'use client';

import type { SystemRole } from '@erp-smart/types';
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton } from '@erp-smart/ui';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

import { useRoles } from '@/features/settings/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';
import { usePermissions } from '@/lib/store';

// Module/action are technical RBAC identifiers (PRODUCTS, CREATE, ...). This
// is an admin screen; we render them as clean Title-Case labels + badges
// rather than translating every module×action pair. Role *names* are
// localized via useRoleLabels, which is what actually matters for language.
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function groupByModule(role: SystemRole): Array<{ module: string; actions: string[] }> {
  const map = new Map<string, string[]>();
  for (const entry of role.permissions) {
    const { module, action } = entry.permission;
    const actions = map.get(module) ?? [];
    actions.push(action);
    map.set(module, actions);
  }
  return Array.from(map.entries())
    .map(([module, actions]) => ({ module, actions: actions.sort() }))
    .sort((a, b) => a.module.localeCompare(b.module));
}

export default function RolesPermissionsPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('USERS:READ');
  const { messages } = useLocale();
  const roleLabels = useRoleLabels();
  const rolesQuery = useRoles();

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  if (!canRead) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<ShieldAlert />}
          title={messages.common.accessDeniedTitle}
          description={messages.common.accessDeniedDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{messages.nav.rolesPermissions}</h1>
        <p className="text-sm text-muted-foreground">{messages.modules.rolesPermissions.description}</p>
      </div>

      {rolesQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : rolesQuery.isError ? (
        <EmptyState
          title={messages.common.error}
          description={rolesQuery.error instanceof Error ? rolesQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roles.map((role) => {
            const grouped = groupByModule(role);
            return (
              <Card key={role.id}>
                <CardHeader className="flex-row items-center gap-2.5 space-y-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-base">{roleLabels[role.key]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {grouped.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                  ) : (
                    grouped.map(({ module, actions }) => (
                      <div key={module} className="flex flex-wrap items-center gap-2">
                        <span className="min-w-[7rem] text-sm font-medium text-foreground">{titleCase(module)}</span>
                        <span className="flex flex-wrap gap-1.5">
                          {actions.map((action) => (
                            <Badge key={action} variant="secondary" className="text-[0.7rem] font-normal">
                              {titleCase(action)}
                            </Badge>
                          ))}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
