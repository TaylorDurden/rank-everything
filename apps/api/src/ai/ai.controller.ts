import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ApiUsageService } from './api-usage.service';
import { AiAnalysisRequestDto } from '@repo/api';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/user.decorator';

export class RefineContextDto {
  @ApiProperty({ description: 'The raw description or context to refine' })
  description: string;

  @ApiProperty({ description: 'Type of asset (e.g., website, finance, product)' })
  assetType: string;

  @ApiProperty({ description: 'Optional template name for context', required: false })
  templateName?: string;
}

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

  @Post('refine-context')
  @ApiOperation({ summary: 'Refine and standardize context input' })
  refineContext(@Body() dto: RefineContextDto, @GetUser('tenantId') tenantId: string) {
    return this.aiService.refineContext(tenantId, dto.description, dto.assetType, dto.templateName);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get API usage statistics' })
  getUsage(@GetUser('tenantId') tenantId: string) {
    return this.apiUsageService.getUsageStats(tenantId);
  }
}
