import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from '@repo/api';

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateEvaluationDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required for evaluation creation. Please re-login.');
    }
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for evaluation creation.');
    }

    return this.prisma.evaluation.create({
      data: {
        assetId: dto.assetId,
        templateId: dto.templateId,
        method: dto.method || 'manual',
        progress: (dto as any).progress || 0,
        tenantId: tenantId,
        createdBy: userId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.evaluation.findMany({
      where: { tenantId },
      include: {
        asset: true,
        template: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        asset: true,
        template: true,
      },
    });
  }

  async updateProgress(id: string, progress: number) {
    return this.prisma.evaluation.update({
      where: { id },
      data: { progress },
    });
  }

  async remove(id: string) {
    return this.prisma.evaluation.delete({
      where: { id },
    });
  }
}
