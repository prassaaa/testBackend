import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { JoinGroupDto } from '../dto/join-group.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ============================================
  // GROUP ENDPOINTS
  // ============================================

  @Post('groups')
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.chatService.createGroup(createGroupDto);
  }

  @Post('groups/join')
  async joinGroup(@Body() joinGroupDto: JoinGroupDto) {
    return this.chatService.joinGroup(joinGroupDto);
  }

  @Get('groups')
  async getAllGroups() {
    return this.chatService.getAllGroups();
  }

  @Get('groups/:id')
  async getGroupById(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getGroupById(id);
  }

  // ============================================
  // MESSAGE HISTORY ENDPOINTS
  // ============================================

  @Get('messages/broadcast')
  async getBroadcastMessages(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getBroadcastMessages(limitNum);
  }

  @Get('messages/private')
  async getPrivateMessages(
    @Query('username1') username1: string,
    @Query('username2') username2: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getPrivateMessages(username1, username2, limitNum);
  }

  @Get('messages/group/:groupId')
  async getGroupMessages(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getGroupMessages(groupId, limitNum);
  }
}
