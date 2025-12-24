import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, name: string, type?: string) {
    return this.prisma.tag.create({
      data: {
        name,
        type,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.tag.findMany({
      where: { tenantId },
    });
  }
}
