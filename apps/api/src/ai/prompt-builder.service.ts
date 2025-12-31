import { Injectable } from '@nestjs/common';
import { PromptsService } from '../prompts/prompts.service';

export interface AssetContext {
  id: string;
  name: string;
  description?: string;
  type: string;
  metadata: any;
}

export interface TemplateContext {
  id: string;
  name: string;
  assetType: string;
  dimensions: Array<{
    key: string;
    weight?: number;
    description?: string;
    scoringGuide?: string;
  }>;
}

export interface EvaluationContext {
  id?: string;
  method: string;
  progress: number;
  context?: string;
}

@Injectable()
export class PromptBuilderService {
  constructor(private promptsService: PromptsService) {}

  /**
   * 根据专家角色获取系统提示词（从数据库或默认）
   */
  private async getExpertRolePrompt(tenantId: string, assetType: string, expertRole?: string): Promise<string> {
    // Try to get from database first
    const dbPrompt = await this.promptsService.getActivePrompt(tenantId, assetType, expertRole);
    if (dbPrompt) {
      return dbPrompt;
    }

    // Fallback to default prompts
    return this.getDefaultExpertRolePrompt(assetType);
  }

  /**
   * 根据专家角色获取默认系统提示词
   */
  private getDefaultExpertRolePrompt(assetType: string): string {
    const expertRoles: Record<string, string> = {
      website: `你是一位网站体验专家，专注于：
- 信息架构和导航设计
- 可用性和用户体验
- 性能和加载速度
- 可访问性（WCAG 标准）
- 内容清晰度和SEO优化`,

      mobile: `你是一位移动增长专家，专注于：
- 用户激活、留存和召回策略
- 埋点与A/B测试
- 应用商店优化（ASO）
- 漏斗分析和队列优化`,

      product: `你是一位产品策略顾问，专注于：
- 目标-指标-举措闭环
- 优先级框架（ICE/RICE）
- 依赖关系和风险分析
- 产品路线图规划`,

      skill: `你是一位技能评估导师，专注于：
- 能力框架设计
- 案例和成果评估
- 学习路径规划
- 量化里程碑设定`,

      finance: `你是一位财务健康顾问，专注于：
- 现金流分析
- 储蓄率和债务比
- 风险敞口评估
- 资产配置建议（合规提示）`,
    };

    return expertRoles[assetType.toLowerCase()] || expertRoles.product;
  }

  /**
   * 构建系统提示词
   */
  async buildSystemPrompt(
    tenantId: string,
    asset: AssetContext,
    template: TemplateContext,
    evaluation?: EvaluationContext,
  ): Promise<string> {
    const expertRole = await this.getExpertRolePrompt(tenantId, asset.type || template.assetType);
    
    const dimensionsText = template.dimensions
      .map((dim, index) => {
        const weight = dim.weight ? ` (权重: ${dim.weight})` : '';
        const guide = dim.scoringGuide ? `\n  评分指南: ${dim.scoringGuide}` : '';
        return `${index + 1}. ${dim.key}${weight}${guide}`;
      })
      .join('\n');

    return `你是一位${expertRole}。

## 任务背景
- 资产名称: ${asset.name}
- 资产类型: ${asset.type || template.assetType}
${asset.description ? `- 资产描述: ${asset.description}` : ''}
${evaluation?.context ? `- 评估上下文: ${evaluation.context}` : ''}

## 评估维度
${dimensionsText}

## 任务要求
请对上述资产进行专业评估，生成结构化分析报告。要求：
1. 基于提供的维度和权重进行评分（0-100分）
2. 为每个维度提供详细的评分理由
3. 识别3-7个关键发现
4. 识别不超过3个潜在风险
5. 提供可执行的改进建议（不超过8条）
6. 进行未来情景推演（projections），包含基准、乐观和风险三种情景
7. 提供基于上下文的具象化建议（specific_recommendations），例如针对职业提供具体的副业方向或学习路径

## 输出格式要求
你必须以JSON格式输出，包含以下字段：
{
  "overall_score": <0-100的总体分数>,
  "dimension_scores": [
    {
      "key": "<维度key>",
      "score": <0-100的分数>,
      "why": "<评分理由，简洁明了>"
    }
  ],
  "findings": [
    "<关键发现1>",
    "<关键发现2>",
    ...
  ],
  "risks": [
    "<风险1>",
    "<风险2>",
    ...
  ],
  "actions": [
    {
      "title": "<行动标题>",
      "why": "<为什么需要这个行动>",
      "impact": "<预期影响>",
      "effort": "<实施难度: low/medium/high>",
      "owner_hint": "<建议负责人>",
      "eta": "<预计完成时间>"
    }
  ],
  "projections": [
    {
      "scenario": "Baseline|Optimistic|Pessimistic",
      "description": "<情景描述>",
      "outcome": "<预计结果>",
      "probability": "<可能性: Low/Medium/High>"
    }
  ],
  "specific_recommendations": [
    {
      "category": "<分类名称>",
      "items": [
        "<具体建议条目>"
      ]
    }
  ],
  "comparison": {
    "summary": "<与上次评估的对比总结（如果有历史数据）>",
    "improvements": ["<改进点1>", "<改进点2>"],
    "regressions": ["<退步点1>", "<退步点2>"]
  }
}

## 质量守则
- 不得捏造数据，基于提供的上下文进行分析
- 所有字段必须齐全
- 评分理由要具体、可溯源
- 建议要可执行、有时效性
- 情景推演要基于逻辑和数据
- 如果数据不足，请说明并给出数据收集建议

请开始分析，直接输出JSON，不要包含其他文字。`;
  }

  /**
   * 构建用户消息（包含资产元数据等额外信息）
   */
  buildUserMessage(
    asset: AssetContext, 
    template: TemplateContext,
    previousResults?: any
  ): string {
    const metadataText = asset.metadata && Object.keys(asset.metadata).length > 0
      ? `\n## 资产元数据\n${JSON.stringify(asset.metadata, null, 2)}`
      : '';

    let message = `请对以下资产进行评估：${metadataText}`;

    if (previousResults) {
        // Extract relevant historical data for context
        const historyContext = {
            date: previousResults.createdAt,
            scores: previousResults.results?.scores,
            findings: previousResults.results?.findings, // If we saved them? Currently findings are in markdown only or not structured in DTO. 
            // AiAnalysisResponseDto structured fields: rationales, suggestions...
            // Let's pass what we have.
        };
        message += `\n\n## 历史评估参考 (用于生成趋势分析和进步对比)\n上一次评估数据: ${JSON.stringify(historyContext, null, 2)}`;
    }

    return message;
  }
}


