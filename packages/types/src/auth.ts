export type MembershipRoleKey = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE';

export type PlatformRole = 'USER' | 'SUPER_ADMIN';

export type PermissionModule =
  | 'PRODUCTS'
  | 'CUSTOMERS'
  | 'SALES'
  | 'INVENTORY'
  | 'INVOICES'
  | 'USERS'
  | 'SETTINGS'
  | 'REPORTS'
  | 'SUPPLIERS'
  | 'PURCHASES';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';

export type PermissionKey = `${PermissionModule}:${PermissionAction}`;

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roleId: string;
  roleKey: MembershipRoleKey;
  permissions: PermissionKey[];
  platformRole: PlatformRole;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  companyId: string;
  roleId: string;
  roleKey: MembershipRoleKey;
  permissions: PermissionKey[];
  platformRole: PlatformRole;
}
