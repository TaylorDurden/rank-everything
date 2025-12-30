import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { AiAnalysisRequestDto, AiAnalysisResponseDto } from '@repo/api';
import { PromptBuilderService } from './prompt-builder.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApiUsageService } from './api-usage.service';

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

interface ParsedAnalysis {
  overall_score: number;
  dimension_scores: Array<{
    key: string;
    score: number;
    why: string;
  }>;
  findings: string[];
  risks: string[];
  actions: Array<{
    title: string;
    why: string;
    impact: string;
    effort: string;
    owner_hint?: string;
    eta?: string;
  }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly timeout: number = 60000; // 60 seconds

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private promptBuilder: PromptBuilderService,
    private notificationsService: NotificationsService,
    private apiUsageService: ApiUsageService,
  ) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
    this.apiUrl = this.configService.get<string>('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1/chat/completions';

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }

  async analyzeAsset(dto: AiAnalysisRequestDto): Promise<AiAnalysisResponseDto> {
    const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
    const template = await this.prisma.template.findUnique({ where: { id: dto.templateId } });

    if (!asset || !template) {
      throw new HttpException('Asset or Template not found', HttpStatus.NOT_FOUND);
    }

    // Get evaluation if provided
    const evaluation = dto.evaluationId
      ? await this.prisma.evaluation.findUnique({ where: { id: dto.evaluationId } })
      : null;

    let analysisResult: AiAnalysisResponseDto;

    // Check cache first
    const metadataHash = this.apiUsageService.generateMetadataHash(asset.metadata);
    const cachedResult = this.apiUsageService.getCachedResult(asset.id, template.id, metadataHash);
    
    if (cachedResult) {
      this.logger.log(`Using cached result for asset ${asset.id}`);
      analysisResult = cachedResult;
    } else {
      // Check rate limits
      const canCall = await this.apiUsageService.canMakeApiCall(asset.tenantId);
      
      if (!canCall.allowed) {
        this.logger.warn(`API call blocked for tenant ${asset.tenantId}: ${canCall.reason}`);
        // Return fallback instead of throwing error
        analysisResult = this.getFallbackAnalysis(asset, template);
      } else {
        try {
          // Try to call Deepseek API
          if (this.apiKey) {
            const result = await this.callDeepseekAPI(asset, template, evaluation);

            // tokenUsage 是内部字段，不在公共 DTO 上暴露，这里通过 any 读取
            const tokenUsage = (result as any).tokenUsage as number | undefined;

            // Record usage
            await this.apiUsageService.recordApiUsage(asset.tenantId, tokenUsage);

            // Cache the result
            this.apiUsageService.setCachedResult(
              asset.id,
              template.id,
              result,
              tokenUsage,
              metadataHash,
            );

            analysisResult = result;
            this.logger.log(`Successfully analyzed asset ${asset.id} using Deepseek API`);
          } else {
            this.logger.warn('DEEPSEEK_API_KEY not configured, falling back to mock analysis');
            analysisResult = this.getFallbackAnalysis(asset, template);
          }
        } catch (error: any) {
          this.logger.error(`AI analysis failed: ${error.message}`, error.stack);
          // Fallback to simplified analysis
          analysisResult = this.getFallbackAnalysis(asset, template);
        }
      }
    }

    // Update evaluation if provided
    if (dto.evaluationId) {
      const updatedEvaluation = await this.prisma.evaluation.update({
        where: { id: dto.evaluationId },
        data: {
          status: 'completed',
          progress: 100,
          results: {
            scores: analysisResult.scores,
            rationales: analysisResult.rationales,
            suggestions: analysisResult.suggestions,
            reportMarkdown: analysisResult.reportMarkdown,
          } as any,
        },
        include: {
          asset: true,
        },
      });

      // Send notification
      try {
        await this.notificationsService.sendNotification({
          type: 'evaluation_completed',
          userId: updatedEvaluation.createdBy,
          tenantId: updatedEvaluation.tenantId,
          data: {
            evaluationId: dto.evaluationId,
            assetName: updatedEvaluation.asset.name,
            reportUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/evaluations/${dto.evaluationId}`,
          },
        });
      } catch (error: any) {
        this.logger.warn(`Failed to send notification: ${error.message}`);
      }
    }

    return analysisResult;
  }

  private async callDeepseekAPI(
    asset: any,
    template: any,
    evaluation: any,
  ): Promise<AiAnalysisResponseDto> {
    const systemPrompt = await this.promptBuilder.buildSystemPrompt(
      asset.tenantId,
      {
        id: asset.id,
        name: asset.name,
        description: asset.description || undefined,
        type: asset.type,
        metadata: asset.metadata || {},
      },
      {
        id: template.id,
        name: template.name,
        assetType: template.assetType,
        dimensions: (template.dimensions as any) || [],
      },
      evaluation
        ? {
            id: evaluation.id,
            method: evaluation.method,
            progress: evaluation.progress,
            context: undefined,
          }
        : undefined,
    );

    const userMessage = this.promptBuilder.buildUserMessage(
      {
        id: asset.id,
        name: asset.name,
        description: asset.description || undefined,
        type: asset.type,
        metadata: asset.metadata || {},
      },
      {
        id: template.id,
        name: template.name,
        assetType: template.assetType,
        dimensions: (template.dimensions as any) || [],
      },
    );

    try {
      const response = await this.httpClient.post<DeepseekResponse>('', {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          { 
            role: 'user', 
            content: 'IMPORTANT: Return ONLY the raw JSON. Do not use Markdown code blocks. Ensure valid JSON format.' 
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Deepseek API');
      }

      // Parse JSON from response
      const parsed = this.parseAIResponse(content);
      
      // Convert to DTO format
      const result = this.convertToResponseDto(parsed, asset, template);
      
      // Attach token usage info
      (result as any).tokenUsage = response.data.usage?.total_tokens;

      return result;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Deepseek API error: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
        throw new Error(`Deepseek API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  private parseAIResponse(content: string): ParsedAnalysis {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1];
    }

    // Try to find JSON object in the response
    const firstOpen = jsonStr.indexOf('{');
    const lastClose = jsonStr.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      jsonStr = jsonStr.substring(firstOpen, lastClose + 1);
    }

    try {
      const parsed = JSON.parse(jsonStr);
      
      // Validate structure
      if (!parsed.dimension_scores || !Array.isArray(parsed.dimension_scores)) {
        throw new Error('Invalid response structure: missing dimension_scores');
      }

      return parsed as ParsedAnalysis;
    } catch (error: any) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      this.logger.debug(`Raw response content: ${content}`);
      this.logger.debug(`Extracted JSON string: ${jsonStr}`);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  private convertToResponseDto(
    parsed: ParsedAnalysis,
    asset: any,
    template: any,
  ): AiAnalysisResponseDto {
    // Convert dimension_scores to scores and rationales
    const scores: Record<string, number> = {};
    const rationales: Record<string, string> = {};

    parsed.dimension_scores.forEach((dim) => {
      scores[dim.key] = dim.score;
      rationales[dim.key] = dim.why;
    });

    // Convert actions to suggestions
    const suggestions = parsed.actions.map((action) => {
      const effort = action.effort ? ` [${action.effort}]` : '';
      const eta = action.eta ? ` (预计: ${action.eta})` : '';
      return `${action.title}: ${action.why}${effort}${eta}`;
    });

    // Build markdown report
    const reportMarkdown = this.buildMarkdownReport(parsed, asset, template);

    return {
      scores,
      rationales,
      suggestions,
      reportMarkdown,
    };
  }

  private buildMarkdownReport(
    parsed: ParsedAnalysis,
    asset: any,
    template: any,
  ): string {
    const dimensionScoresText = parsed.dimension_scores
      .map((dim) => `- **${dim.key}**: ${dim.score}/100 - ${dim.why}`)
      .join('\n');

    const findingsText = parsed.findings.map((f) => `- ${f}`).join('\n');
    const risksText = parsed.risks.map((r) => `- ${r}`).join('\n');
    const actionsText = parsed.actions
      .map((a, i) => `${i + 1}. **${a.title}**: ${a.why} (影响: ${a.impact}, 难度: ${a.effort})`)
      .join('\n');

    return `# AI 分析报告: ${asset.name}

## 总体评分
**${parsed.overall_score}/100**

## 维度评分
${dimensionScoresText}

## 关键发现
${findingsText}

## 潜在风险
${risksText}

## 改进建议
${actionsText}

---
*基于 ${template.name} 模板生成 | 生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
  }

  /**
   * Fallback analysis when API fails or is not configured
   */
  private getFallbackAnalysis(asset: any, template: any): AiAnalysisResponseDto {
    const dimensions = (template.dimensions as any) || [];
    const scores: Record<string, number> = {};
    const rationales: Record<string, string> = {};
    const suggestions: string[] = [];

    // Generate default scores for each dimension
    dimensions.forEach((dim: any) => {
      const score = 75; // Default score
      scores[dim.key] = score;
      rationales[dim.key] = `基于当前可用信息，${dim.key}维度评分为${score}分。建议提供更多数据以获得更准确的评估。`;
    });

    suggestions.push(
      '收集更多资产相关数据以提升评估准确性',
      '定期更新资产信息以跟踪改进进度',
      '参考行业最佳实践进行优化',
    );

    const reportMarkdown = `# AI 分析报告: ${asset.name}

## 说明
当前使用简化版分析（API未配置或调用失败）。建议配置 Deepseek API 以获得更详细的分析。

## 维度评分
${Object.entries(scores)
  .map(([key, score]) => `- **${key}**: ${score}/100`)
  .join('\n')}

## 建议
${suggestions.map((s) => `- ${s}`).join('\n')}
`;

    return {
      scores,
      rationales,
      suggestions,
      reportMarkdown,
    };
  }
}
