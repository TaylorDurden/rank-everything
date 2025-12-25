import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; name?: string; tenantId: string; password?: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
    });
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async delete(id: string) {
     return this.prisma.user.delete({
       where: { id },
     });
  }
}
