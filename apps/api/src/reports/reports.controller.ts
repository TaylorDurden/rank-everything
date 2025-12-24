import { Controller, Get, Param, Headers } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@Headers('x-tenant-id') tenantId: string) {
    return this.reportsService.generateSummary(tenantId);
  }

  @Get(':evaluationId')
  getReport(@Param('evaluationId') evaluationId: string) {
    return this.reportsService.getReport(evaluationId);
  }
}
