import type { MembershipRoleKey } from '@erp-smart/types';

import { useLocale } from './locale-context';

// Role names returned by the API (Role.name, e.g. "Owner") are DB-seeded and
// English-only — they must never be rendered directly, or the UI mixes
// languages when Arabic is active. This maps the fixed role-key enum to a
// translated label instead, ignoring the backend-provided name for display.
export function useRoleLabels(): Record<MembershipRoleKey, string> {
  const { messages } = useLocale();
  const t = messages.settings;
  return {
    OWNER: t.roleOwner,
    MANAGER: t.roleManager,
    ACCOUNTANT: t.roleAccountant,
    EMPLOYEE: t.roleEmployee,
  };
}
