import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Body('name') name: string,
    @Body('type') type?: string,
  ) {
    return this.tagsService.create(tenantId, name, type);
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.tagsService.findAll(tenantId);
  }
}
