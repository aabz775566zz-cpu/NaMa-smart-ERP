import { IsEmail, IsIn } from 'class-validator';

const INVITABLE_ROLES = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE'] as const;
export type InvitableRoleKey = (typeof INVITABLE_ROLES)[number];

export class InviteMemberDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email!: string;

  @IsIn(INVITABLE_ROLES, { message: 'Please choose a valid role.' })
  roleKey!: InvitableRoleKey;
}
