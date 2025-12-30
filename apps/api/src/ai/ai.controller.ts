import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ApiUsageService } from './api-usage.service';
import { AiAnalysisRequestDto } from '@repo/api';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly apiUsageService: ApiUsageService,
  ) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze asset using AI' })
  analyze(@Body() dto: AiAnalysisRequestDto) {
    return this.aiService.analyzeAsset(dto);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get API usage statistics' })
  getUsage(@GetUser('tenantId') tenantId: string) {
    return this.apiUsageService.getUsageStats(tenantId);
  }
}
