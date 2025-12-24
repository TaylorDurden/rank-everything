import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from '@repo/api';

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateEvaluationDto) {
    return this.prisma.evaluation.create({
      data: {
        ...dto,
        tenantId,
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
}
