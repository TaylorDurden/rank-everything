import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PromptBuilderService } from './prompt-builder.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AiController],
  providers: [AiService, PromptBuilderService],
  exports: [AiService],
})
export class AiModule {}
