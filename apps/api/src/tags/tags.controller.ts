import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tags')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @GetUser('tenantId') tenantId: string,
    @Body('name') name: string,
    @Body('type') type?: string,
  ) {
    return this.tagsService.create(tenantId, name, type);
  }

  @Get()
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.tagsService.findAll(tenantId);
  }
}
