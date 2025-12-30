import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PromptsService, CreatePromptDto, UpdatePromptDto } from './prompts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/user.decorator';

@ApiTags('prompts')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new prompt version' })
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreatePromptDto,
  ) {
    return this.promptsService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prompts' })
  findAll(
    @GetUser('tenantId') tenantId: string,
    @Query('assetType') assetType?: string,
  ) {
    return this.promptsService.findAll(tenantId, assetType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prompt by ID' })
  findOne(@Param('id') id: string) {
    return this.promptsService.findOne(id);
  }

  @Get('name/:name/versions')
  @ApiOperation({ summary: 'Get all versions of a prompt' })
  getVersions(
    @GetUser('tenantId') tenantId: string,
    @Param('name') name: string,
  ) {
    return this.promptsService.getVersions(tenantId, name);
  }

  @Get('name/:name/compare')
  @ApiOperation({ summary: 'Compare two prompt versions' })
  compareVersions(
    @GetUser('tenantId') tenantId: string,
    @Param('name') name: string,
    @Query('v1') version1: string,
    @Query('v2') version2: string,
  ) {
    return this.promptsService.compareVersions(
      tenantId,
      name,
      parseInt(version1),
      parseInt(version2),
    );
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a specific prompt version' })
  activateVersion(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.promptsService.activateVersion(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update prompt' })
  update(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePromptDto,
  ) {
    return this.promptsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete prompt' })
  remove(
    @GetUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.promptsService.remove(id, tenantId);
  }
}

