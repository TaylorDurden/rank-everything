import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PromptBuilderService } from './prompt-builder.service';
import { ApiUsageService } from './api-usage.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [NotificationsModule, PromptsModule],
  controllers: [AiController],
  providers: [AiService, PromptBuilderService, ApiUsageService],
  exports: [AiService, ApiUsageService],
})
export class AiModule {}
