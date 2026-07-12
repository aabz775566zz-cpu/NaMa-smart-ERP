import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MailerService } from '../common/mailer/mailer.service';
import { generateRandomToken, hoursFromNow } from '../common/utils/tokens.util';
import { PrismaService } from '../prisma/prisma.service';
import { InvitableRoleKey, InviteMemberDto } from './dto/invite-member.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async getCompany(companyId: string) {
    return this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({ where: { id: companyId }, data: dto });
  }

  async listMembers(companyId: string) {
    return this.prisma.membership.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
        role: { select: { id: true, key: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(companyId: string, invitedByUserId: string, dto: InviteMemberDto) {
    const role = await this.prisma.role.findFirst({
      where: { companyId: null, key: dto.roleKey },
    });
    if (!role) {
      throw new BadRequestException('Unknown role.');
    }

    const normalizedEmail = dto.email.toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const existingMembership = await this.prisma.membership.findUnique({
        where: { userId_companyId: { userId: user.id, companyId } },
      });
      if (existingMembership) {
        throw new ConflictException('This person is already a member of the company.');
      }
    }

    const inviteToken = generateRandomToken();
    const inviteExpiresAt = hoursFromNow(72);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: normalizedEmail.split('@')[0],
          passwordResetToken: inviteToken,
          passwordResetExpiresAt: inviteExpiresAt,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: inviteToken, passwordResetExpiresAt: inviteExpiresAt },
      });
    }

    const membership = await this.prisma.membership.create({
      data: {
        userId: user.id,
        companyId,
        roleId: role.id,
        status: 'INVITED',
        invitedAt: new Date(),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: invitedByUserId,
        companyId,
        action: 'MEMBER_INVITED',
        metadata: { email: normalizedEmail, roleKey: dto.roleKey },
      },
    });

    await this.mailer.send(
      user.email,
      "You've been invited to join a company on ERP Smart",
      `Accept your invite with token: ${inviteToken}`,
    );

    return membership;
  }

  async updateMemberRole(
    companyId: string,
    membershipId: string,
    actingUserId: string,
    roleKey: InvitableRoleKey,
  ) {
    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.companyId !== companyId) {
      throw new NotFoundException('Membership not found.');
    }

    const role = await this.prisma.role.findFirst({
      where: { companyId: null, key: roleKey },
    });
    if (!role) {
      throw new BadRequestException('Unknown role.');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { roleId: role.id },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: actingUserId,
        companyId,
        action: 'MEMBER_ROLE_CHANGED',
        metadata: { membershipId, roleKey },
      },
    });

    return updated;
  }

  async removeMember(companyId: string, membershipId: string, actingUserId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { role: true },
    });
    if (!membership || membership.companyId !== companyId) {
      throw new NotFoundException('Membership not found.');
    }
    if (membership.role.key === 'OWNER') {
      throw new ForbiddenException('The company owner cannot be removed.');
    }

    await this.prisma.membership.delete({ where: { id: membershipId } });

    await this.prisma.activityLog.create({
      data: { userId: actingUserId, companyId, action: 'MEMBER_REMOVED', metadata: { membershipId } },
    });
  }
}
