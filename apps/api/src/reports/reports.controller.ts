import { Controller, Get, Param, Post, Res, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiHeader, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs/promises';

@ApiTags('reports')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@GetUser('tenantId') tenantId: string) {
    return this.reportsService.generateSummary(tenantId);
  }

  @Get(':evaluationId')
  getReport(@Param('evaluationId') evaluationId: string) {
    return this.reportsService.getReport(evaluationId);
  }

  @Post(':evaluationId/pdf')
  @ApiOperation({ summary: 'Generate PDF report for an evaluation' })
  async generatePdf(
    @Param('evaluationId') evaluationId: string,
    @Res() res: Response,
  ) {
    try {
      const { filePath, filename } = await this.reportsService.generatePdfReport(evaluationId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      throw new HttpException(
        `Failed to generate PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':evaluationId/pdf')
  @ApiOperation({ summary: 'Download PDF report for an evaluation' })
  async downloadPdf(
    @Param('evaluationId') evaluationId: string,
    @Res() res: Response,
  ) {
    try {
      // First generate if not exists
      const { filePath, filename } = await this.reportsService.generatePdfReport(evaluationId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      throw new HttpException(
        `Failed to download PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
