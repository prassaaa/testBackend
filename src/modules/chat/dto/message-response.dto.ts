export class MessageResponseDto {
  id: number;
  username: string;
  message: string;
  messageType: string;
  recipientUsername?: string | null;
  groupId?: number | null;
  sentAt: Date;
  isRead: boolean;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}

export class GroupResponseDto {
  id: number;
  groupName: string;
  createdBy: string;
  createdAt: Date;
  memberCount?: number;

  constructor(partial: Partial<GroupResponseDto>) {
    Object.assign(this, partial);
  }
}
