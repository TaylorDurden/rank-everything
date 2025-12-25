import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from '@repo/api';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateTemplateDto) {
    const { dimensions, ...data } = dto;
    return this.prisma.template.create({
      data: {
        ...data,
        tenantId,
        dimensions: dimensions as any,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.template.findMany({
      where: {
        OR: [
          { tenantId },
          { ownerScope: 'system' }
        ]
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.template.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: any) {
    const { dimensions, ...data } = dto;
    return this.prisma.template.update({
      where: { id },
      data: {
        ...data,
        dimensions: dimensions !== undefined ? (dimensions as any) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.template.delete({
      where: { id },
    });
  }
}
