import { IsEmail, IsIn } from 'class-validator';

const INVITABLE_ROLES = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE'] as const;
export type InvitableRoleKey = (typeof INVITABLE_ROLES)[number];

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(INVITABLE_ROLES)
  roleKey!: InvitableRoleKey;
}
