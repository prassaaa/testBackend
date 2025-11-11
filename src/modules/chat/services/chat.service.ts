import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ChatRepository } from '../repositories/chat.repository';
import { SendMessageDto, MessageType } from '../dto/send-message.dto';
import { CreateGroupDto } from '../dto/create-group.dto';
import { JoinGroupDto } from '../dto/join-group.dto';
import {
  MessageResponseDto,
  GroupResponseDto,
} from '../dto/message-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly chatRepository: ChatRepository) {}

  // ============================================
  // MESSAGE OPERATIONS
  // ============================================

  async sendMessage(dto: SendMessageDto): Promise<MessageResponseDto> {
    this.logger.log(`Sending ${dto.messageType} message from ${dto.username}`);

    // Validate based on message type
    if (dto.messageType === MessageType.PRIVATE && !dto.recipientUsername) {
      throw new Error('Recipient username is required for private messages');
    }

    if (dto.messageType === MessageType.GROUP && !dto.groupId) {
      throw new Error('Group ID is required for group messages');
    }

    // If group message, verify group exists
    if (dto.messageType === MessageType.GROUP && dto.groupId) {
      const group = await this.chatRepository.findGroupById(dto.groupId);
      if (!group) {
        throw new NotFoundException(`Group with ID ${dto.groupId} not found`);
      }
    }

    const message = await this.chatRepository.createMessage({
      username: dto.username,
      message: dto.message,
      messageType: dto.messageType,
      recipientUsername: dto.recipientUsername,
      groupId: dto.groupId,
    });

    return new MessageResponseDto(message);
  }

  async getBroadcastMessages(
    limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.chatRepository.findMessagesByType(
      'broadcast',
      limit,
    );
    return messages.map((msg) => new MessageResponseDto(msg));
  }

  async getPrivateMessages(
    username1: string,
    username2: string,
    limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.chatRepository.findPrivateMessages(
      username1,
      username2,
      limit,
    );
    return messages.map((msg) => new MessageResponseDto(msg));
  }

  async getGroupMessages(
    groupId: number,
    limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.chatRepository.findGroupMessages(
      groupId,
      limit,
    );
    return messages.map((msg) => new MessageResponseDto(msg));
  }

  // ============================================
  // GROUP OPERATIONS
  // ============================================

  async createGroup(dto: CreateGroupDto): Promise<GroupResponseDto> {
    this.logger.log(`Creating group: ${dto.groupName} by ${dto.createdBy}`);

    const group = await this.chatRepository.createGroup({
      groupName: dto.groupName,
      createdBy: dto.createdBy,
    });

    // Automatically add creator as first member
    await this.chatRepository.addGroupMember({
      groupId: group.id,
      username: dto.createdBy,
    });

    return new GroupResponseDto({
      ...group,
      memberCount: 1,
    });
  }

  async joinGroup(dto: JoinGroupDto): Promise<GroupResponseDto> {
    this.logger.log(`User ${dto.username} joining group ${dto.groupId}`);

    // Check if group exists
    const group = await this.chatRepository.findGroupById(dto.groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${dto.groupId} not found`);
    }

    // Check if user is already a member
    const existingMember = group.members?.find(
      (member) => member.username === dto.username,
    );
    if (existingMember) {
      throw new ConflictException(
        `User ${dto.username} is already a member of this group`,
      );
    }

    // Add member
    await this.chatRepository.addGroupMember({
      groupId: dto.groupId,
      username: dto.username,
    });

    return new GroupResponseDto({
      id: group.id,
      groupName: group.groupName,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      memberCount: (group.members?.length || 0) + 1,
    });
  }

  async getAllGroups(): Promise<GroupResponseDto[]> {
    const groups = await this.chatRepository.findAllGroups();
    return groups.map(
      (group) =>
        new GroupResponseDto({
          ...group,
          memberCount: group.members?.length || 0,
        }),
    );
  }

  async getGroupById(groupId: number): Promise<GroupResponseDto> {
    const group = await this.chatRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    return new GroupResponseDto({
      ...group,
      memberCount: group.members?.length || 0,
    });
  }
}
