import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '@erp-smart/types';

import { SUPER_ADMIN_KEY } from '../decorators/require-super-admin.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (user?.platformRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Platform admin access required.');
    }
    return true;
  }
}
