import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CompaniesService } from './companies.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@UseGuards(PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMyCompany(@CurrentUser('companyId') companyId: string) {
    return this.companiesService.getCompany(companyId);
  }

  @RequirePermission('SETTINGS:UPDATE')
  @Patch('me')
  updateMyCompany(@CurrentUser('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateCompany(companyId, dto);
  }

  @RequirePermission('USERS:READ')
  @Get('me/members')
  listMembers(@CurrentUser('companyId') companyId: string) {
    return this.companiesService.listMembers(companyId);
  }

  @RequirePermission('USERS:CREATE')
  @Post('me/invitations')
  inviteMember(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.companiesService.inviteMember(companyId, userId, dto);
  }

  @RequirePermission('USERS:CREATE')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @Post('me/members/:membershipId/resend-invite')
  resendInvite(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.companiesService.resendInvite(companyId, membershipId, userId);
  }

  @RequirePermission('USERS:UPDATE')
  @Patch('me/members/:membershipId')
  updateMember(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.companiesService.updateMemberRole(companyId, membershipId, userId, dto.roleKey);
  }

  @RequirePermission('USERS:DELETE')
  @Delete('me/members/:membershipId')
  removeMember(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.companiesService.removeMember(companyId, membershipId, userId);
  }
}
