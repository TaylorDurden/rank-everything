import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePromptDto {
  name: string;
  content: string;
  assetType: string;
  expertRole?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePromptDto {
  content?: string;
  expertRole?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new prompt version
   */
  async create(tenantId: string, userId: string, dto: CreatePromptDto) {
    // Check if prompt with same name exists
    const existing = await this.prisma.prompt.findFirst({
      where: {
        tenantId,
        name: dto.name,
      },
      orderBy: {
        version: 'desc',
      },
    });

    const version = existing ? existing.version + 1 : 1;

    // Deactivate previous versions if this is a new version
    if (existing) {
      await this.prisma.prompt.updateMany({
        where: {
          tenantId,
          name: dto.name,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    return this.prisma.prompt.create({
      data: {
        tenantId,
        name: dto.name,
        version,
        content: dto.content,
        assetType: dto.assetType,
        expertRole: dto.expertRole,
        metadata: dto.metadata || {},
        createdBy: userId,
        isActive: true,
      },
    });
  }

  /**
   * Get active prompt for asset type
   */
  async getActivePrompt(tenantId: string, assetType: string, expertRole?: string): Promise<string | null> {
    // First try tenant-specific prompts
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        tenantId,
        assetType,
        isActive: true,
        ...(expertRole ? { expertRole } : {}),
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (prompt) {
      return prompt.content;
    }

    // Try system prompts (from system tenant)
    const systemPrompt = await this.prisma.prompt.findFirst({
      where: {
        tenantId: 'system-tenant-id',
        assetType,
        isActive: true,
        isSystem: true,
        ...(expertRole ? { expertRole } : {}),
      },
      orderBy: {
        version: 'desc',
      },
    });

    if (systemPrompt) {
      return systemPrompt.content;
    }

    // Try default system prompt
    const defaultPrompt = await this.prisma.prompt.findFirst({
      where: {
        tenantId: 'system-tenant-id',
        assetType: 'custom',
        isActive: true,
        isSystem: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return defaultPrompt?.content || null;
  }

  /**
   * Get all prompts for tenant
   */
  async findAll(tenantId: string, assetType?: string) {
    return this.prisma.prompt.findMany({
      where: {
        tenantId,
        ...(assetType ? { assetType } : {}),
      },
      orderBy: [
        { name: 'asc' },
        { version: 'desc' },
      ],
    });
  }

  /**
   * Get prompt by ID
   */
  async findOne(id: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return prompt;
  }

  /**
   * Get all versions of a prompt
   */
  async getVersions(tenantId: string, name: string) {
    return this.prisma.prompt.findMany({
      where: {
        tenantId,
        name,
      },
      orderBy: {
        version: 'desc',
      },
    });
  }

  /**
   * Activate a specific prompt version
   */
  async activateVersion(tenantId: string, id: string) {
    const prompt = await this.findOne(id);

    if (prompt.tenantId !== tenantId) {
      throw new BadRequestException('Cannot activate prompt from different tenant');
    }

    // Deactivate all versions of the same prompt
    await this.prisma.prompt.updateMany({
      where: {
        tenantId,
        name: prompt.name,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate this version
    return this.prisma.prompt.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }

  /**
   * Update prompt
   */
  async update(id: string, tenantId: string, dto: UpdatePromptDto) {
    const prompt = await this.findOne(id);

    if (prompt.tenantId !== tenantId) {
      throw new BadRequestException('Cannot update prompt from different tenant');
    }

    return this.prisma.prompt.update({
      where: { id },
      data: {
        ...dto,
        metadata: dto.metadata !== undefined ? dto.metadata : prompt.metadata,
      },
    });
  }

  /**
   * Delete prompt
   */
  async remove(id: string, tenantId: string) {
    const prompt = await this.findOne(id);

    if (prompt.tenantId !== tenantId) {
      throw new BadRequestException('Cannot delete prompt from different tenant');
    }

    // Don't allow deleting if it's the only active version
    const activeCount = await this.prisma.prompt.count({
      where: {
        tenantId,
        name: prompt.name,
        isActive: true,
      },
    });

    if (prompt.isActive && activeCount === 1) {
      throw new BadRequestException('Cannot delete the only active version');
    }

    return this.prisma.prompt.delete({
      where: { id },
    });
  }

  /**
   * Compare two prompt versions
   */
  async compareVersions(tenantId: string, name: string, version1: number, version2: number) {
    const prompts = await this.prisma.prompt.findMany({
      where: {
        tenantId,
        name,
        version: {
          in: [version1, version2],
        },
      },
    });

    if (prompts.length !== 2) {
      throw new NotFoundException('One or both versions not found');
    }

    const [prompt1, prompt2] = prompts.sort((a, b) => a.version - b.version);

    return {
      version1: {
        version: prompt1.version,
        content: prompt1.content,
        createdAt: prompt1.createdAt,
        isActive: prompt1.isActive,
      },
      version2: {
        version: prompt2.version,
        content: prompt2.content,
        createdAt: prompt2.createdAt,
        isActive: prompt2.isActive,
      },
      diff: this.calculateDiff(prompt1.content, prompt2.content),
    };
  }

  /**
   * Simple diff calculation (in production, use a proper diff library)
   */
  private calculateDiff(content1: string, content2: string): string {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const diff: string[] = [];

    for (let i = 0; i < maxLen; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 === line2) {
        diff.push(`  ${line1}`);
      } else {
        if (line1) diff.push(`- ${line1}`);
        if (line2) diff.push(`+ ${line2}`);
      }
    }

    return diff.join('\n');
  }
}

