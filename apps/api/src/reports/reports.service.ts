import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateSummary(tenantId: string) {
    const assets = await this.prisma.asset.count({ where: { tenantId } });
    const evaluations = await this.prisma.evaluation.count({ where: { tenantId } });
    
    return {
      totalAssets: assets,
      totalEvaluations: evaluations,
      recentActivity: [],
    };
  }

  async getReport(evaluationId: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        asset: true,
        template: true,
      },
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return {
      evaluationId,
      assetName: evaluation.asset.name,
      templateName: evaluation.template.name,
      status: evaluation.status,
      results: (evaluation as any).results || null,
      score: ((evaluation as any).results as any)?.scores?.security || 0,
      content: ((evaluation as any).results as any)?.reportMarkdown || 'Analysis pending visualization...',
    };
  }
}
