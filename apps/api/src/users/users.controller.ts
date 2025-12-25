import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() data: { email: string; name?: string; tenantId: string }) {
    return this.usersService.create(data);
  }

  @Get()
  @Roles('admin')
  findByTenant(@Query('tenantId') tenantId: string) {
    return this.usersService.findByTenant(tenantId);
  }

  @Patch('profile')
  updateProfile(@GetUser('id') userId: string, @Body() data: any) {
    return this.usersService.update(userId, data);
  }
}
