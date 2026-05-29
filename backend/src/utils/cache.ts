import { redis } from '../config/redis';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Redis Cache Utility
 * 
 * Strategy: Pattern-based key invalidation
 * 
 * Key format: tasks:org:{orgId}:assignee:{userId}:page:{page}:limit:{limit}:filters:{hash}
 * 
 * On any mutation (create/update/delete), we invalidate all cached keys
 * for the organization using SCAN + pattern matching. This ensures fresh
 * data without the complexity of tag-based systems.
 * 
 * Trade-off: SCAN is O(N) but acceptable for cache key volumes typical
 * in task management systems (<10K keys per org).
 */

const DEFAULT_TTL = 300; // 5 minutes

export const cache = {
  /**
   * Generate a deterministic hash for filter params
   */
  hashFilters(filters: Record<string, any>): string {
    const sorted = JSON.stringify(filters, Object.keys(filters).sort());
    return crypto.createHash('md5').update(sorted).digest('hex').substring(0, 12);
  },

  /**
   * Build a cache key for task lists
   */
  buildTaskListKey(params: {
    organizationId: string;
    assigneeId?: string;
    page: number;
    limit: number;
    filters: Record<string, any>;
  }): string {
    const filterHash = cache.hashFilters(params.filters);
    const assignee = params.assigneeId || 'all';
    return `tasks:org:${params.organizationId}:assignee:${assignee}:page:${params.page}:limit:${params.limit}:filters:${filterHash}`;
  },

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error('Cache GET error:', err);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl = DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (err) {
      logger.error('Cache SET error:', err);
    }
  },

  /**
   * Invalidate all task caches for an organization.
   * Uses SCAN to avoid blocking Redis with KEYS command.
   */
  async invalidateTaskCache(organizationId: string): Promise<void> {
    try {
      const pattern = `tasks:org:${organizationId}:*`;
      let cursor = '0';
      let totalDeleted = 0;

      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');

      if (totalDeleted > 0) {
        logger.info(`Cache INVALIDATED: ${totalDeleted} keys for org ${organizationId}`);
      }
    } catch (err) {
      logger.error('Cache invalidation error:', err);
    }
  },

  /**
   * Invalidate specific user's task cache
   */
  async invalidateUserTaskCache(organizationId: string, userId: string): Promise<void> {
    try {
      const pattern = `tasks:org:${organizationId}:assignee:${userId}:*`;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.error('Cache invalidation error:', err);
    }
  },

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.error('Cache DEL error:', err);
    }
  },
};
