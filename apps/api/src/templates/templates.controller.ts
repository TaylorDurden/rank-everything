import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from '@repo/api';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.create(tenantId, createTemplateDto);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.templatesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}
