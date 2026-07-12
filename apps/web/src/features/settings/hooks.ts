'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as settingsApi from './api';
import type { InviteMemberInput, UpdateCompanyInput, UpdateMemberInput } from './api';

export const settingsKeys = {
  all: ['settings'] as const,
  company: () => [...settingsKeys.all, 'company'] as const,
  members: () => [...settingsKeys.all, 'members'] as const,
  roles: () => [...settingsKeys.all, 'roles'] as const,
};

export function useCompany() {
  return useQuery({ queryKey: settingsKeys.company(), queryFn: settingsApi.getCompany });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => settingsApi.updateCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.company() });
    },
  });
}

// `enabled` lets the page skip this request entirely for roles without
// USERS:READ, instead of firing a request that's certain to 403.
export function useMembers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settingsKeys.members(),
    queryFn: settingsApi.listMembers,
    enabled: options?.enabled ?? true,
  });
}

export function useRoles() {
  return useQuery({ queryKey: settingsKeys.roles(), queryFn: settingsApi.listRoles });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => settingsApi.inviteMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.members() });
    },
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (membershipId: string) => settingsApi.resendInvite(membershipId),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, input }: { membershipId: string; input: UpdateMemberInput }) =>
      settingsApi.updateMemberRole(membershipId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.members() });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => settingsApi.removeMember(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.members() });
    },
  });
}
