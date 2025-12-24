import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAnalysisRequestDto, AiAnalysisResponseDto } from '@repo/api';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async analyzeAsset(dto: AiAnalysisRequestDto): Promise<AiAnalysisResponseDto> {
    const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
    const template = await this.prisma.template.findUnique({ where: { id: dto.templateId } });

    if (!asset || !template) {
      throw new Error('Asset or Template not found');
    }

    // Mock AI Analysis for now
    // In a real implementation, we would call OpenAI/Gemini here
    
    return {
      scores: {
        'security': 85,
        'compliance': 90,
        'performance': 78,
      },
      rationales: {
        'security': 'The asset follows standard security protocols but lacks multi-factor authentication details.',
        'compliance': 'Fully compliant with GDPR based on provided metadata.',
        'performance': 'Performance metrics indicate occasional latency during peak hours.',
      },
      suggestions: [
        'Implement multi-factor authentication for higher security score.',
        'Optimize database queries to reduce latency.',
        'Regularly audit compliance logs.'
      ],
      reportMarkdown: `# AI Analysis Report for ${asset.name}\n\n## Overview\nThis report provides an automated scoring and rationale for the asset based on the ${template.name} template.\n\n## Score Breakdown\n- Security: 85/100\n- Compliance: 90/100\n- Performance: 78/100\n\n## Key Suggestions\n1. Implement MFA.\n2. Optimize queries.`
    };
  }
}
