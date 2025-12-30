import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface CacheEntry {
  result: any;
  timestamp: number;
  tokenUsage?: number;
}

@Injectable()
export class ApiUsageService {
  private readonly logger = new Logger(ApiUsageService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTTL: number; // Time to live in milliseconds
  private readonly maxCacheSize: number;
  private readonly dailyLimit: number;
  private readonly monthlyLimit: number;

  // In-memory usage tracking (in production, use Redis or database)
  private dailyUsage = new Map<string, number>(); // tenantId -> count
  private monthlyUsage = new Map<string, number>(); // tenantId -> count
  private lastResetDate = new Date().toDateString();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Cache TTL: 24 hours by default
    this.cacheTTL = this.configService.get<number>('AI_CACHE_TTL') || 24 * 60 * 60 * 1000;
    // Max cache entries: 1000
    this.maxCacheSize = this.configService.get<number>('AI_CACHE_MAX_SIZE') || 1000;
    // Daily limit per tenant: 50 requests
    this.dailyLimit = this.configService.get<number>('AI_DAILY_LIMIT') || 50;
    // Monthly limit per tenant: 1000 requests
    this.monthlyLimit = this.configService.get<number>('AI_MONTHLY_LIMIT') || 1000;

    // Reset daily usage at midnight
    this.scheduleDailyReset();
  }

  /**
   * Generate cache key from asset and template
   */
  private generateCacheKey(assetId: string, templateId: string, assetMetadataHash?: string): string {
    return `ai:${assetId}:${templateId}:${assetMetadataHash || 'default'}`;
  }

  /**
   * Check if result is cached and still valid
   */
  getCachedResult(assetId: string, templateId: string, assetMetadataHash?: string): any | null {
    const key = this.generateCacheKey(assetId, templateId, assetMetadataHash);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    this.logger.log(`Cache hit for ${key}`);
    return entry.result;
  }

  /**
   * Store result in cache
   */
  setCachedResult(
    assetId: string,
    templateId: string,
    result: any,
    tokenUsage?: number,
    assetMetadataHash?: string,
  ): void {
    const key = this.generateCacheKey(assetId, templateId, assetMetadataHash);

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries();
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      tokenUsage,
    });

    this.logger.log(`Cached result for ${key}`);
  }

  /**
   * Evict oldest cache entries (keep 80% of max size)
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = Math.floor(this.maxCacheSize * 0.2); // Remove 20%
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0]);
    }

    this.logger.log(`Evicted ${toEvict} cache entries`);
  }

  /**
   * Check if tenant can make API call (rate limiting)
   */
  async canMakeApiCall(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Reset daily usage if date changed
    this.checkAndResetDailyUsage();

    const dailyCount = this.dailyUsage.get(tenantId) || 0;
    const monthlyCount = this.monthlyUsage.get(tenantId) || 0;

    if (dailyCount >= this.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit of ${this.dailyLimit} requests reached`,
      };
    }

    if (monthlyCount >= this.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly limit of ${this.monthlyLimit} requests reached`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record API usage
   */
  async recordApiUsage(tenantId: string, tokenUsage?: number): Promise<void> {
    const dailyCount = (this.dailyUsage.get(tenantId) || 0) + 1;
    const monthlyCount = (this.monthlyUsage.get(tenantId) || 0) + 1;

    this.dailyUsage.set(tenantId, dailyCount);
    this.monthlyUsage.set(tenantId, monthlyCount);

    this.logger.log(`Recorded API usage for tenant ${tenantId}: daily=${dailyCount}, monthly=${monthlyCount}, tokens=${tokenUsage || 'N/A'}`);

    // Optionally store in database for persistence
    // await this.storeUsageInDatabase(tenantId, tokenUsage);
  }

  /**
   * Get usage statistics for tenant
   */
  getUsageStats(tenantId: string): {
    daily: number;
    monthly: number;
    dailyLimit: number;
    monthlyLimit: number;
    remainingDaily: number;
    remainingMonthly: number;
  } {
    this.checkAndResetDailyUsage();

    const daily = this.dailyUsage.get(tenantId) || 0;
    const monthly = this.monthlyUsage.get(tenantId) || 0;

    return {
      daily,
      monthly,
      dailyLimit: this.dailyLimit,
      monthlyLimit: this.monthlyLimit,
      remainingDaily: Math.max(0, this.dailyLimit - daily),
      remainingMonthly: Math.max(0, this.monthlyLimit - monthly),
    };
  }

  /**
   * Check and reset daily usage if date changed
   */
  private checkAndResetDailyUsage(): void {
    const currentDate = new Date().toDateString();
    if (currentDate !== this.lastResetDate) {
      this.logger.log('Resetting daily usage counters');
      this.dailyUsage.clear();
      this.lastResetDate = currentDate;
    }
  }

  /**
   * Schedule daily reset at midnight
   */
  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.dailyUsage.clear();
      this.lastResetDate = new Date().toDateString();
      this.logger.log('Daily usage reset');
      // Schedule next reset
      this.scheduleDailyReset();
    }, msUntilMidnight);
  }

  /**
   * Generate hash from asset metadata for cache key
   */
  generateMetadataHash(metadata: any): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return 'default';
    }

    // Simple hash function (in production, use crypto.createHash)
    const str = JSON.stringify(metadata);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear cache for specific asset/template
   */
  clearCache(assetId?: string, templateId?: string): void {
    if (assetId && templateId) {
      const key = this.generateCacheKey(assetId, templateId);
      this.cache.delete(key);
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
}

