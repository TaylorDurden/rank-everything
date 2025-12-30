import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ParsedData {
  name?: string;
  description?: string;
  type?: string;
  metadata?: Record<string, any>;
  dimensions?: Record<string, any>;
}

@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);

  /**
   * Parse CSV file content
   */
  async parseCsv(fileContent: Buffer, encoding: BufferEncoding = 'utf8'): Promise<ParsedData[]> {
    try {
      const text = fileContent.toString(encoding);
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records.map((record: any) => ({
        name: record.name || record.Name || record.asset_name,
        description: record.description || record.Description || record.asset_description,
        type: record.type || record.Type || record.asset_type || 'custom',
        metadata: this.extractMetadata(record),
        dimensions: this.extractDimensions(record),
      }));
    } catch (error: any) {
      this.logger.error(`Failed to parse CSV: ${error.message}`);
      throw new BadRequestException(`Invalid CSV format: ${error.message}`);
    }
  }

  /**
   * Parse JSON file content
   */
  async parseJson(fileContent: Buffer, encoding: BufferEncoding = 'utf8'): Promise<ParsedData | ParsedData[]> {
    try {
      const text = fileContent.toString(encoding);
      const data = JSON.parse(text);

      // Handle array of assets
      if (Array.isArray(data)) {
        return data.map((item) => this.normalizeJsonData(item));
      }

      // Handle single asset
      return this.normalizeJsonData(data);
    } catch (error: any) {
      this.logger.error(`Failed to parse JSON: ${error.message}`);
      throw new BadRequestException(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Scrape URL and extract metadata
   */
  async scrapeUrl(url: string): Promise<ParsedData> {
    try {
      // Validate URL
      new URL(url);

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);

      // Extract Open Graph metadata
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const ogDescription = $('meta[property="og:description"]').attr('content');
      const ogType = $('meta[property="og:type"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');

      // Extract JSON-LD structured data
      const jsonLd = $('script[type="application/ld+json"]').first().html();
      let structuredData = {};
      if (jsonLd) {
        try {
          structuredData = JSON.parse(jsonLd);
        } catch (e) {
          this.logger.warn('Failed to parse JSON-LD');
        }
      }

      // Extract basic metadata
      const title = ogTitle || $('title').text() || url;
      const description = ogDescription || $('meta[name="description"]').attr('content') || '';
      const keywords = $('meta[name="keywords"]').attr('content') || '';

      // Extract additional metadata
      const metadata: Record<string, any> = {
        url,
        title,
        description,
        keywords: keywords.split(',').map((k) => k.trim()),
        ogImage,
        ogType,
        structuredData,
        // Extract common meta tags
        author: $('meta[name="author"]').attr('content'),
        viewport: $('meta[name="viewport"]').attr('content'),
        // Extract some content hints
        hasForms: $('form').length > 0,
        hasVideos: $('video').length > 0,
        hasImages: $('img').length > 0,
        linkCount: $('a').length,
      };

      return {
        name: title,
        description: description || `Scraped from ${url}`,
        type: this.inferAssetType(url, ogType, structuredData),
        metadata,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Failed to scrape URL: ${error.message}`);
        throw new BadRequestException(`Failed to scrape URL: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Normalize JSON data to ParsedData format
   */
  private normalizeJsonData(data: any): ParsedData {
    return {
      name: data.name || data.title || data.asset_name,
      description: data.description || data.desc || data.asset_description,
      type: data.type || data.asset_type || 'custom',
      metadata: data.metadata || this.extractMetadata(data),
      dimensions: data.dimensions || this.extractDimensions(data),
    };
  }

  /**
   * Extract metadata from record (exclude known fields)
   */
  private extractMetadata(record: any): Record<string, any> {
    const knownFields = ['name', 'Name', 'description', 'Description', 'type', 'Type', 'asset_name', 'asset_description', 'asset_type'];
    const metadata: Record<string, any> = {};

    for (const [key, value] of Object.entries(record)) {
      if (!knownFields.includes(key) && value !== undefined && value !== null && value !== '') {
        metadata[key] = value;
      }
    }

    return metadata;
  }

  /**
   * Extract dimensions from record
   */
  private extractDimensions(record: any): Record<string, any> {
    const dimensions: Record<string, any> = {};
    const dimensionKeys = Object.keys(record).filter((key) =>
      key.toLowerCase().includes('score') ||
      key.toLowerCase().includes('dimension') ||
      key.toLowerCase().includes('metric')
    );

    for (const key of dimensionKeys) {
      const value = record[key];
      if (value !== undefined && value !== null && value !== '') {
        dimensions[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }

    return dimensions;
  }

  /**
   * Infer asset type from URL and metadata
   */
  private inferAssetType(url: string, ogType?: string, structuredData?: any): string {
    // Check Open Graph type
    if (ogType) {
      if (ogType.includes('website')) return 'website';
      if (ogType.includes('article')) return 'article';
      if (ogType.includes('product')) return 'product';
    }

    // Check structured data
    if (structuredData) {
      if (structuredData['@type']) {
        const type = structuredData['@type'].toLowerCase();
        if (type.includes('website') || type.includes('webpage')) return 'website';
        if (type.includes('article')) return 'article';
        if (type.includes('product')) return 'product';
      }
    }

    // Infer from URL
    const urlLower = url.toLowerCase();
    if (urlLower.includes('github.com')) return 'repository';
    if (urlLower.includes('youtube.com') || urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.includes('medium.com') || urlLower.includes('blog')) return 'blog';
    if (urlLower.includes('shop') || urlLower.includes('store')) return 'ecommerce';

    return 'website';
  }

  /**
   * Validate and clean data
   */
  validateAndClean(data: ParsedData): ParsedData {
    return {
      name: (data.name || 'Untitled Asset').trim().substring(0, 255),
      description: data.description?.trim().substring(0, 2000),
      type: (data.type || 'custom').toLowerCase(),
      metadata: this.cleanMetadata(data.metadata),
      dimensions: data.dimensions,
    };
  }

  /**
   * Clean metadata (remove null/undefined, limit string lengths)
   */
  private cleanMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {};

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          cleaned[key] = value.substring(0, 1000);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }
}


