import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';

export enum MessageType {
  BROADCAST = 'broadcast',
  PRIVATE = 'private',
  GROUP = 'group',
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(MessageType)
  @IsNotEmpty()
  messageType: MessageType;

  @IsString()
  @IsOptional()
  recipientUsername?: string;

  @IsInt()
  @IsOptional()
  groupId?: number;
}
