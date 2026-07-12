import { BadRequestException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toSafeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return this.toSafeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const isValid = user.passwordHash
      ? await argon2.verify(user.passwordHash, dto.currentPassword)
      : false;
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.activityLog.create({ data: { userId, action: 'PASSWORD_CHANGED' } }),
    ]);
  }

  private toSafeUser(user: User) {
    const { passwordHash, emailVerifyToken, passwordResetToken, ...safe } = user;
    return safe;
  }
}
