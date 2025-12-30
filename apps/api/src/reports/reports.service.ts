import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as path from 'path';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {}

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

    const results = (evaluation as any).results || null;
    const scores = results?.scores || {};

    const scoreValues = Object.values(scores as Record<string, number>).filter(
      (v): v is number => typeof v === 'number',
    );

    const overallScore =
      results?.overall_score ||
      (scoreValues.length > 0
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : 0);

    return {
      evaluationId,
      assetName: evaluation.asset.name,
      templateName: evaluation.template.name,
      status: evaluation.status,
      results,
      score: overallScore,
      content: results?.reportMarkdown || 'Analysis pending visualization...',
    };
  }

  /**
   * Generate PDF report for an evaluation
   */
  async generatePdfReport(evaluationId: string): Promise<{ filePath: string; filename: string }> {
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

    const results = (evaluation as any).results || {};
    const scores = results.scores || {};

    const scoreValues = Object.values(scores as Record<string, number>).filter(
      (v): v is number => typeof v === 'number',
    );

    const overallScore =
      results.overall_score ||
      (scoreValues.length > 0
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : 0);

    // Extract findings and risks from results if available
    const findings = results.findings || [];
    const risks = results.risks || [];
    const actions = results.actions || [];
    const suggestions = actions.map((a: any) => 
      a.title ? `${a.title}: ${a.why || ''}` : (typeof a === 'string' ? a : '')
    ).filter(Boolean);

    const filePath = await this.pdfService.generateReportPdf({
      assetName: evaluation.asset.name,
      templateName: evaluation.template.name,
      overallScore,
      scores,
      rationales: results.rationales || {},
      findings,
      risks,
      suggestions: suggestions.length > 0 ? suggestions : results.suggestions || [],
      reportMarkdown: results.reportMarkdown,
      generatedAt: evaluation.updatedAt || evaluation.createdAt,
    });

    const filename = path.basename(filePath, '.pdf');

    // Optionally store PDF URL in database
    // await this.prisma.evaluation.update({
    //   where: { id: evaluationId },
    //   data: { pdfUrl: filePath },
    // });

    // Send notification
    try {
      await this.notificationsService.sendNotification({
        type: 'report_generated',
        userId: evaluation.createdBy,
        tenantId: evaluation.tenantId,
        data: {
          evaluationId,
          assetName: evaluation.asset.name,
          reportUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/evaluations/${evaluationId}`,
        },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to send notification: ${error.message}`);
    }

    return { filePath, filename };
  }

  /**
   * Get PDF file stream for download
   */
  async getPdfStream(filename: string): Promise<{ filePath: string; filename: string } | null> {
    const filePath = await this.pdfService.getPdfPath(filename);
    if (!filePath) {
      return null;
    }
    return { filePath, filename: `${filename}.pdf` };
  }
}
