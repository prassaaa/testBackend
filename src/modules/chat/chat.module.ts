import { Module } from '@nestjs/common';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';
import { ChatRepository } from './repositories/chat.repository';
import { ChatController } from './controllers/chat.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
