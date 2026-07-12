import type { AssignableRoleKey, Company, Member, SystemRole } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

export interface UpdateCompanyInput {
  name?: string;
  businessType?: string;
  country?: string;
  currency?: string;
  logoUrl?: string;
}

export interface InviteMemberInput {
  email: string;
  roleKey: AssignableRoleKey;
}

export interface UpdateMemberInput {
  roleKey: AssignableRoleKey;
}

// GET /companies/me has no permission requirement — any authenticated user
// can view their own company. PATCH requires SETTINGS:UPDATE.
export function getCompany() {
  return apiClient.get<Company>('/companies/me');
}

export function updateCompany(input: UpdateCompanyInput) {
  return apiClient.patch<Company>('/companies/me', input);
}

// USERS:READ / CREATE / UPDATE / DELETE respectively — see companies.controller.ts.
export function listMembers() {
  return apiClient.get<Member[]>('/companies/me/members');
}

export function inviteMember(input: InviteMemberInput) {
  return apiClient.post<Member>('/companies/me/invitations', input);
}

export function resendInvite(membershipId: string) {
  return apiClient.post<void>(`/companies/me/members/${membershipId}/resend-invite`);
}

export function updateMemberRole(membershipId: string, input: UpdateMemberInput) {
  return apiClient.patch<Member>(`/companies/me/members/${membershipId}`, input);
}

export function removeMember(membershipId: string) {
  return apiClient.delete<void>(`/companies/me/members/${membershipId}`);
}

// No permission requirement — exposes only the 4 system role templates.
export function listRoles() {
  return apiClient.get<SystemRole[]>('/roles');
}
