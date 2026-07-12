import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, MembershipRoleKey, PermissionKey, PlatformRole } from '@erp-smart/types';
import type { Membership, User } from '@prisma/client';
import * as argon2 from 'argon2';
import type { Request, Response } from 'express';

import { MailerService } from '../common/mailer/mailer.service';
import { generateRandomToken, hashToken, hoursFromNow } from '../common/utils/tokens.util';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_MS, refreshCookieOptions } from './auth.constants';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    const isValid = user?.passwordHash ? await argon2.verify(user.passwordHash, password) : false;

    if (!user || !isValid || user.status !== 'ACTIVE') {
      await this.prisma.activityLog.create({
        data: { userId: user?.id, action: 'LOGIN_FAILED', metadata: { email: normalizedEmail } },
      });
      return null;
    }

    return user;
  }

  async register(dto: RegisterDto, res: Response) {
    const normalizedEmail = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const ownerRole = await this.prisma.role.findFirst({
      where: { companyId: null, key: 'OWNER' },
    });
    if (!ownerRole) {
      throw new InternalServerErrorException(
        'System roles are not seeded. Run `npm run db:seed` and try again.',
      );
    }

    const passwordHash = await argon2.hash(dto.password);
    const emailVerifyToken = generateRandomToken();
    const emailVerifyExpiresAt = hoursFromNow(24);

    const { user, membership } = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          businessType: dto.businessType,
          country: dto.country,
          currency: dto.currency ?? 'USD',
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: dto.fullName,
          emailVerifyToken,
          emailVerifyExpiresAt,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: { userId: user.id, companyId: company.id, action: 'USER_REGISTERED' },
      });

      return { user, company, membership };
    });

    await this.mailer.sendVerificationEmail(user.email, emailVerifyToken);

    const payload = await this.buildJwtPayload(user, membership);
    return this.issueTokens(user, payload, res);
  }

  async login(user: User, req: Request, res: Response) {
    const membership = await this.getPrimaryMembership(user.id);
    if (!membership) {
      throw new ForbiddenException('No active company membership found for this account.');
    }

    const payload = await this.buildJwtPayload(user, membership);
    await this.prisma.activityLog.create({
      data: { userId: user.id, companyId: membership.companyId, action: 'LOGIN_SUCCESS' },
    });

    return this.issueTokens(user, payload, res, req);
  }

  async refresh(req: Request, res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      throw new UnauthorizedException('Missing refresh token.');
    }

    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (stored.revokedAt) {
      // A rotated-out token was reused: treat as a possible theft and kill every
      // active session for this user rather than trusting the presented token.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    const membership = await this.getPrimaryMembership(user.id);
    if (!membership) {
      throw new ForbiddenException('No active company membership found for this account.');
    }

    const payload = await this.buildJwtPayload(user, membership);
    return this.issueTokens(user, payload, res, req);
  }

  async logout(req: Request, res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });
  }

  async switchCompany(userId: string, companyId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You are not an active member of this company.');
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const payload = await this.buildJwtPayload(user, membership);
    return { accessToken: this.jwtService.sign(payload), user: payload };
  }

  // Authenticated (unlike register's initial send) — the user is already
  // logged in at this point since verification isn't a login gate, just a
  // trust signal. Silently no-ops if already verified rather than erroring,
  // so a stale "resend" click from an old tab is harmless.
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.isEmailVerified) {
      return { alreadyVerified: true };
    }

    const emailVerifyToken = generateRandomToken();
    const emailVerifyExpiresAt = hoursFromNow(24);
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken, emailVerifyExpiresAt },
    });

    await this.mailer.sendVerificationEmail(user.email, emailVerifyToken);
    return { alreadyVerified: false };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({ where: { emailVerifyToken: token } });
    if (!user || !user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
      throw new BadRequestException('Verification link is invalid or has expired.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiresAt: null },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always behave the same way whether or not the account exists, so this
    // endpoint can't be used to enumerate registered emails.
    if (user) {
      const token = generateRandomToken();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiresAt: hoursFromNow(1) },
      });
      await this.mailer.sendPasswordResetEmail(user.email, token);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired.');
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.activityLog.create({ data: { userId: user.id, action: 'PASSWORD_RESET' } }),
    ]);
  }

  async acceptInvite(token: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Invite link is invalid or has expired.');
    }

    const passwordHash = await argon2.hash(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          isEmailVerified: true,
        },
      }),
      this.prisma.membership.updateMany({
        where: { userId: user.id, status: 'INVITED' },
        data: { status: 'ACTIVE', joinedAt: new Date() },
      }),
      this.prisma.activityLog.create({ data: { userId: user.id, action: 'INVITE_ACCEPTED' } }),
    ]);
  }

  private async getPrimaryMembership(userId: string) {
    return this.prisma.membership.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async buildJwtPayload(user: User, membership: Membership): Promise<JwtPayload> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id: membership.roleId },
      include: { permissions: { include: { permission: true } } },
    });

    return {
      sub: user.id,
      email: user.email,
      companyId: membership.companyId,
      roleId: role.id,
      roleKey: role.key as MembershipRoleKey,
      permissions: role.permissions.map(
        (rp) => `${rp.permission.module}:${rp.permission.action}` as PermissionKey,
      ),
      platformRole: user.platformRole as PlatformRole,
    };
  }

  private async issueTokens(user: User, payload: JwtPayload, res: Response, req?: Request) {
    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = generateRandomToken(40);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: req?.headers['user-agent'],
        ipAddress: req?.ip,
      },
    });

    res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, refreshCookieOptions(expiresAt));

    return { accessToken, user: payload };
  }
}
