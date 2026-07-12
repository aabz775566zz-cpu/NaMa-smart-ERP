import type { MembershipRoleKey } from './auth';

export type MembershipStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

/** Matches GET /companies/me and the body of PATCH /companies/me. */
export interface Company {
  id: string;
  name: string;
  businessType: string | null;
  country: string | null;
  currency: string;
  logoUrl: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
}

/** One entry of GET /companies/me/members — CompaniesService.listMembers()'s
 * `include` shape (user + role summaries), not the raw Membership model. */
export interface Member {
  id: string;
  userId: string;
  companyId: string;
  roleId: string;
  status: MembershipStatus;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  role: {
    id: string;
    key: MembershipRoleKey;
    name: string;
  };
}

/** Roles assignable via invite/role-change — OWNER is deliberately excluded
 * everywhere in CompaniesController (see InvitableRoleKey in the backend's
 * invite-member.dto.ts; the owner role can't be granted or reassigned). */
export type AssignableRoleKey = Exclude<MembershipRoleKey, 'OWNER'>;

/** One entry of GET /roles — RolesService.listSystemRoles()'s `include`
 * shape. Always the 4 system role templates (companyId: null). */
export interface SystemRole {
  id: string;
  companyId: null;
  key: MembershipRoleKey;
  name: string;
  isSystem: boolean;
  createdAt: string;
  permissions: Array<{
    roleId: string;
    permissionId: string;
    permission: {
      id: string;
      module: string;
      action: string;
    };
  }>;
}
