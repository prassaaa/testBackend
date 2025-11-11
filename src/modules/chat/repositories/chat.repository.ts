import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ChatMessage, ChatGroup, GroupMember } from '@prisma/client';

@Injectable()
export class ChatRepository {
  private readonly logger = new Logger(ChatRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // MESSAGE OPERATIONS
  // ============================================

  async createMessage(data: {
    username: string;
    message: string;
    messageType: string;
    recipientUsername?: string;
    groupId?: number;
  }): Promise<ChatMessage> {
    try {
      return await this.prisma.chatMessage.create({
        data,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to create message: ${error.message}`);
      }
      throw error;
    }
  }

  async findMessagesByType(
    messageType: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    try {
      return await this.prisma.chatMessage.findMany({
        where: { messageType },
        orderBy: { sentAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find messages by type: ${error.message}`);
      }
      throw error;
    }
  }

  async findPrivateMessages(
    username1: string,
    username2: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    try {
      return await this.prisma.chatMessage.findMany({
        where: {
          messageType: 'private',
          OR: [
            { username: username1, recipientUsername: username2 },
            { username: username2, recipientUsername: username1 },
          ],
        },
        orderBy: { sentAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find private messages: ${error.message}`);
      }
      throw error;
    }
  }

  async findGroupMessages(
    groupId: number,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    try {
      return await this.prisma.chatMessage.findMany({
        where: { groupId, messageType: 'group' },
        orderBy: { sentAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find group messages: ${error.message}`);
      }
      throw error;
    }
  }

  // ============================================
  // GROUP OPERATIONS
  // ============================================

  async createGroup(data: {
    groupName: string;
    createdBy: string;
  }): Promise<ChatGroup> {
    try {
      return await this.prisma.chatGroup.create({
        data,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to create group: ${error.message}`);
      }
      throw error;
    }
  }

  async findGroupById(groupId: number) {
    try {
      return await this.prisma.chatGroup.findUnique({
        where: { id: groupId },
        include: {
          members: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find group by id: ${error.message}`);
      }
      throw error;
    }
  }

  async findAllGroups() {
    try {
      return await this.prisma.chatGroup.findMany({
        include: {
          members: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find all groups: ${error.message}`);
      }
      throw error;
    }
  }

  // ============================================
  // GROUP MEMBER OPERATIONS
  // ============================================

  async addGroupMember(data: {
    groupId: number;
    username: string;
  }): Promise<GroupMember> {
    try {
      return await this.prisma.groupMember.create({
        data,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to add group member: ${error.message}`);
      }
      throw error;
    }
  }

  async findGroupMembers(groupId: number): Promise<GroupMember[]> {
    try {
      return await this.prisma.groupMember.findMany({
        where: { groupId },
        orderBy: { joinedAt: 'asc' },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to find group members: ${error.message}`);
      }
      throw error;
    }
  }
}
