import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { JoinGroupDto } from '../dto/join-group.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ============================================
  // GROUP ENDPOINTS
  // ============================================

  @Post('groups')
  @ApiOperation({ summary: 'Create a new chat group' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.chatService.createGroup(createGroupDto);
  }

  @Post('groups/join')
  @ApiOperation({ summary: 'Join an existing group' })
  @ApiBody({ type: JoinGroupDto })
  @ApiResponse({ status: 200, description: 'Joined group successfully' })
  async joinGroup(@Body() joinGroupDto: JoinGroupDto) {
    return this.chatService.joinGroup(joinGroupDto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all chat groups' })
  @ApiResponse({ status: 200, description: 'List of all groups' })
  async getAllGroups() {
    return this.chatService.getAllGroups();
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiParam({ name: 'id', description: 'Group ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Group details' })
  async getGroupById(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getGroupById(id);
  }

  // ============================================
  // MESSAGE HISTORY ENDPOINTS
  // ============================================

  @Get('messages/broadcast')
  @ApiOperation({ summary: 'Get broadcast message history' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'List of broadcast messages' })
  async getBroadcastMessages(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getBroadcastMessages(limitNum);
  }

  @Get('messages/private')
  @ApiOperation({ summary: 'Get private message history between two users' })
  @ApiQuery({ name: 'username1', required: true, example: 'alice' })
  @ApiQuery({ name: 'username2', required: true, example: 'bob' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'List of private messages' })
  async getPrivateMessages(
    @Query('username1') username1: string,
    @Query('username2') username2: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getPrivateMessages(username1, username2, limitNum);
  }

  @Get('messages/group/:groupId')
  @ApiOperation({ summary: 'Get group message history' })
  @ApiParam({ name: 'groupId', description: 'Group ID', example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'List of group messages' })
  async getGroupMessages(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getGroupMessages(groupId, limitNum);
  }
}
