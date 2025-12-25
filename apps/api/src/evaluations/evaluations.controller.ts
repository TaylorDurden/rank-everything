import { Controller, Get, Post, Body, Param, Patch, Delete, Headers, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from '@repo/api';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('evaluations')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    // Ensuring the values are not undefined before service call
    const tId = tenantId || 'default-tenant-id'; 
    const uId = userId;
    
    return this.evaluationsService.create(tId, uId, dto);
  }

  @Get()
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.evaluationsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @Patch(':id/progress')
  updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.evaluationsService.updateProgress(id, progress);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evaluationsService.remove(id);
  }
}
