import { Controller, Get, Post, Body, Param, Patch, Delete, Headers, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiHeader, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto } from '@repo/api';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('assets')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    return this.assetsService.create(tenantId, userId, createAssetDto);
  }

  @Get()
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.assetsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
