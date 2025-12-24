import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAnalysisRequestDto } from '@repo/api';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  analyze(@Body() dto: AiAnalysisRequestDto) {
    return this.aiService.analyzeAsset(dto);
  }
}
