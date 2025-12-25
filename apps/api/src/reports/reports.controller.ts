import { Controller, Get, Param, Headers, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
