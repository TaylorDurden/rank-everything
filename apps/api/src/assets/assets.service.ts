import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto } from '@repo/api';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, ownerId: string, dto: CreateAssetDto) {
    const { tags, ...data } = dto;
    return this.prisma.asset.create({
      data: {
        ...data,
        tenantId,
        ownerId,
        tags: tags
          ? {
              create: tags.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.asset.findMany({
      where: { tenantId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.asset.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    const { tags, ...data } = dto;
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...data,
        // Tag updates can be complex, for now we just handle simple properties
      },
    });
  }

  async remove(id: string) {
    return this.prisma.asset.delete({
      where: { id },
    });
  }
}
