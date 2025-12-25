import { Controller, Get, Post, Body, Param, Patch, Delete, Headers, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from '@repo/api';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('templates')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(
    @GetUser('tenantId') tenantId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.create(tenantId, createTemplateDto);
  }

  @Get()
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.templatesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
