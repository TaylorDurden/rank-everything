import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Headers,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiTags, ApiHeader, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { DataIngestionService } from './data-ingestion.service';
import { CreateAssetDto, UpdateAssetDto } from '@repo/api';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('assets')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly dataIngestionService: DataIngestionService,
  ) {}

  @Post()
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() createAssetDto: CreateAssetDto,
  ) {
    return this.assetsService.create(tenantId, userId, createAssetDto);
  }

  @Get()
  findAll(@GetUser('tenantId') tenantId: string) {
    return this.assetsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['text/csv', 'application/json', 'application/vnd.ms-excel'];
        const allowedExtensions = ['.csv', '.json'];
        const ext = extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext) || allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV and JSON files are allowed'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload and import assets from CSV/JSON file' })
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fs = require('fs/promises');
    const fileContent = await fs.readFile(file.path);

    let parsedData: any;
    if (file.originalname.endsWith('.csv')) {
      parsedData = await this.dataIngestionService.parseCsv(fileContent);
    } else if (file.originalname.endsWith('.json')) {
      parsedData = await this.dataIngestionService.parseJson(fileContent);
    } else {
      throw new BadRequestException('Unsupported file format');
    }

    // Clean up uploaded file
    await fs.unlink(file.path).catch(() => {});

    // Normalize to array
    const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

    // Validate and create assets
    const createdAssets = [];
    for (const data of dataArray) {
      const cleaned = this.dataIngestionService.validateAndClean(data);
      const asset = await this.assetsService.create(tenantId, userId, {
        name: cleaned.name || 'Imported Asset',
        description: cleaned.description,
        type: cleaned.type || 'custom',
        metadata: cleaned.metadata,
      } as CreateAssetDto);
      createdAssets.push(asset);
    }

    return {
      message: `Successfully imported ${createdAssets.length} asset(s)`,
      assets: createdAssets,
    };
  }

  @Post('scrape')
  @ApiOperation({ summary: 'Scrape URL and create asset from metadata' })
  async scrapeUrl(
    @GetUser('tenantId') tenantId: string,
    @GetUser('id') userId: string,
    @Body() body: { url: string },
  ) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }

    const scrapedData = await this.dataIngestionService.scrapeUrl(body.url);
    const cleaned = this.dataIngestionService.validateAndClean(scrapedData);

    const asset = await this.assetsService.create(tenantId, userId, {
      name: cleaned.name || 'Scraped Asset',
      description: cleaned.description,
      type: cleaned.type || 'website',
      metadata: cleaned.metadata,
    } as CreateAssetDto);

    return {
      message: 'Successfully scraped URL and created asset',
      asset,
    };
  }
}
