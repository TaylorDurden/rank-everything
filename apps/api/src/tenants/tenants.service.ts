import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    return this.prisma.tenant.create({
      data: { name },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async update(id: string, name: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { name },
    });
  }
}
