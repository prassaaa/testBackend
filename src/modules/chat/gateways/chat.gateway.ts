import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { SendMessageDto, MessageType } from '../dto/send-message.dto';
import { CreateGroupDto } from '../dto/create-group.dto';
import { JoinGroupDto } from '../dto/join-group.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify allowed origins
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, string> = new Map(); // socketId -> username

  constructor(private readonly chatService: ChatService) {}

  // ============================================
  // CONNECTION HANDLERS
  // ============================================

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.connectedUsers.get(client.id);
    if (username) {
      this.logger.log(`User ${username} disconnected (${client.id})`);
      this.connectedUsers.delete(client.id);

      // Notify others about user disconnect
      this.server.emit('user:disconnected', { username });
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  // ============================================
  // USER REGISTRATION
  // ============================================

  @SubscribeMessage('user:register')
  handleUserRegister(
    @MessageBody() data: { username: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User registered: ${data.username} (${client.id})`);
    this.connectedUsers.set(client.id, data.username);

    // Notify others about new user
    client.broadcast.emit('user:connected', { username: data.username });

    return {
      event: 'user:registered',
      data: {
        success: true,
        username: data.username,
        socketId: client.id,
      },
    };
  }

  // ============================================
  // BROADCAST MESSAGE
  // ============================================

  @SubscribeMessage('message:broadcast')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleBroadcastMessage(
    @MessageBody() data: { username: string; message: string },
  ) {
    this.logger.log(`Broadcast message from ${data.username}: ${data.message}`);

    const dto: SendMessageDto = {
      username: data.username,
      message: data.message,
      messageType: MessageType.BROADCAST,
    };

    const savedMessage = await this.chatService.sendMessage(dto);

    // Emit to all clients including sender
    this.server.emit('message:broadcast', savedMessage);

    return {
      event: 'message:sent',
      data: { success: true, message: savedMessage },
    };
  }

  // ============================================
  // PRIVATE MESSAGE
  // ============================================

  @SubscribeMessage('message:private')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handlePrivateMessage(
    @MessageBody()
    data: { username: string; message: string; recipientUsername: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Private message from ${data.username} to ${data.recipientUsername}`,
    );

    const dto: SendMessageDto = {
      username: data.username,
      message: data.message,
      messageType: MessageType.PRIVATE,
      recipientUsername: data.recipientUsername,
    };

    const savedMessage = await this.chatService.sendMessage(dto);

    // Find recipient socket
    const recipientSocketId = Array.from(this.connectedUsers.entries()).find(
      ([, username]) => username === data.recipientUsername,
    )?.[0];

    if (recipientSocketId) {
      // Send to recipient
      this.server.to(recipientSocketId).emit('message:private', savedMessage);
      // Send confirmation to sender
      client.emit('message:private', savedMessage);
    } else {
      // Recipient not online, but message is saved
      client.emit('message:sent', {
        success: true,
        message: savedMessage,
        recipientOnline: false,
      });
    }

    return {
      event: 'message:sent',
      data: { success: true, message: savedMessage },
    };
  }

  // ============================================
  // GROUP MESSAGE
  // ============================================

  @SubscribeMessage('message:group')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGroupMessage(
    @MessageBody()
    data: {
      username: string;
      message: string;
      groupId: number;
    },
  ) {
    this.logger.log(
      `Group message from ${data.username} to group ${data.groupId}`,
    );

    const dto: SendMessageDto = {
      username: data.username,
      message: data.message,
      messageType: MessageType.GROUP,
      groupId: data.groupId,
    };

    const savedMessage = await this.chatService.sendMessage(dto);

    // Emit to all clients in the group room
    this.server.to(`group:${data.groupId}`).emit('message:group', savedMessage);

    return {
      event: 'message:sent',
      data: { success: true, message: savedMessage },
    };
  }

  // ============================================
  // GROUP OPERATIONS
  // ============================================

  @SubscribeMessage('group:create')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleCreateGroup(
    @MessageBody() data: CreateGroupDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Creating group: ${data.groupName} by ${data.createdBy}`);

    const group = await this.chatService.createGroup(data);

    // Join the creator to the group room
    await client.join(`group:${group.id}`);

    // Notify all clients about new group (including sender)
    this.server.emit('group:created', group);

    return {
      event: 'message:sent',
      data: { success: true, group },
    };
  }

  @SubscribeMessage('group:join')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleJoinGroup(
    @MessageBody() data: JoinGroupDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`User ${data.username} joining group ${data.groupId}`);

    const group = await this.chatService.joinGroup(data);

    // Join the user to the group room
    await client.join(`group:${data.groupId}`);

    // Notify group members about new member
    this.server.to(`group:${data.groupId}`).emit('group:member-joined', {
      groupId: data.groupId,
      username: data.username,
    });

    return {
      event: 'group:joined',
      data: { success: true, group },
    };
  }

  @SubscribeMessage('group:list')
  async handleListGroups() {
    this.logger.log('Fetching all groups');

    const groups = await this.chatService.getAllGroups();

    return {
      event: 'group:list',
      data: { success: true, groups },
    };
  }

  // ============================================
  // MESSAGE HISTORY
  // ============================================

  @SubscribeMessage('history:broadcast')
  async handleBroadcastHistory(@MessageBody() data: { limit?: number }) {
    const messages = await this.chatService.getBroadcastMessages(
      data.limit || 50,
    );

    return {
      event: 'history:broadcast',
      data: { success: true, messages },
    };
  }

  @SubscribeMessage('history:private')
  async handlePrivateHistory(
    @MessageBody()
    data: {
      username1: string;
      username2: string;
      limit?: number;
    },
  ) {
    const messages = await this.chatService.getPrivateMessages(
      data.username1,
      data.username2,
      data.limit || 50,
    );

    return {
      event: 'history:private',
      data: { success: true, messages },
    };
  }

  @SubscribeMessage('history:group')
  async handleGroupHistory(
    @MessageBody() data: { groupId: number; limit?: number },
  ) {
    const messages = await this.chatService.getGroupMessages(
      data.groupId,
      data.limit || 50,
    );

    return {
      event: 'history:group',
      data: { success: true, messages },
    };
  }
}
