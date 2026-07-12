import { IsIn } from 'class-validator';

import { InvitableRoleKey } from './invite-member.dto';

const ASSIGNABLE_ROLES = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE'] as const;

export class UpdateMemberDto {
  @IsIn(ASSIGNABLE_ROLES)
  roleKey!: InvitableRoleKey;
}
