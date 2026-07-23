import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { PermissionKey } from '@erp-smart/types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

// No @RequirePermission here — the global JwtAuthGuard still requires
// authentication, but access control for *what the assistant can retrieve*
// happens per-tool inside AiService, not at this endpoint. Any authenticated
// user can open the chat; what they can ask about is bounded by their own
// existing permissions, same as talking to a human colleague.
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('permissions') permissions: PermissionKey[],
    @Body() dto: SendChatMessageDto,
  ) {
    return this.aiService.chat(companyId, userId, permissions, dto);
  }

  @Get('conversations')
  listConversations(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Query() query: ListConversationsDto,
  ) {
    return this.aiService.listConversations(companyId, userId, query);
  }

  @Get('conversations/:id')
  getConversation(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query() query: ListConversationsDto,
  ) {
    return this.aiService.getConversation(companyId, userId, id, query);
  }

  @Delete('conversations/:id')
  deleteConversation(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.deleteConversation(companyId, userId, id);
  }

  // No static @RequirePermission here — this route can execute any current
  // or future propose_* action, each gated by its own requiredPermission
  // (see AiToolRegistryService). AiService.confirmAction() looks up the
  // specific tool that produced this action and checks the caller's
  // permissions against that, the same way availableTools filtering already
  // works in chat() — one source of truth, no controller change needed when
  // a new write-capable tool is added.
  @HttpCode(HttpStatus.OK)
  @Post('conversations/:conversationId/messages/:messageId/confirm')
  confirmAction(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('permissions') permissions: PermissionKey[],
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.aiService.confirmAction(companyId, userId, permissions, conversationId, messageId);
  }
}
