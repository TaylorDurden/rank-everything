import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() data: { email: string; name?: string; tenantId: string }) {
    return this.usersService.create(data);
  }

  @Get()
  findByTenant(@Query('tenantId') tenantId: string) {
    return this.usersService.findByTenant(tenantId);
  }
}
