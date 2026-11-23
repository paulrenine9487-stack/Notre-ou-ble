const { redisClient, isRedisAvailable } = require('../utils/redisClient');

const KEY_PREFIX = 'notreoble:cache:';
const memoryFallbackCache = new Map(); // fallback when Redis is offline

// In-flight request deduplication to prevent cache stampedes
const inFlightRequests = new Map();

const cacheService = {
  /**
   * Get cached value
   */
  async get(key) {
    const fullKey = KEY_PREFIX + key;
    try {
      if (isRedisAvailable()) {
        const data = await redisClient.get(fullKey);
        if (data) {
          try {
            return JSON.parse(data);
          } catch (e) {
            return data;
          }
        }
      } else {
        // In-memory fallback
        const item = memoryFallbackCache.get(fullKey);
        if (item && item.expiresAt > Date.now()) {
          return item.data;
        } else if (item) {
          memoryFallbackCache.delete(fullKey);
        }
      }
    } catch (err) {
      console.warn(`[CacheService Warning] Read error for key ${key}:`, err.message);
    }
    return null;
  },

  /**
   * Set cached value with TTL in seconds
   */
  async set(key, value, ttlSeconds = 300) {
    const fullKey = KEY_PREFIX + key;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (isRedisAvailable()) {
        await redisClient.set(fullKey, serialized, 'EX', ttlSeconds);
      } else {
        // In-memory fallback
        memoryFallbackCache.set(fullKey, {
          data: value,
          expiresAt: Date.now() + ttlSeconds * 1000
        });
      }
    } catch (err) {
      console.warn(`[CacheService Warning] Write error for key ${key}:`, err.message);
    }
  },

  /**
   * Delete exact key or prefix pattern
   */
  async del(patternOrKey) {
    const fullPattern = KEY_PREFIX + patternOrKey;
    try {
      if (isRedisAvailable()) {
        if (patternOrKey.includes('*')) {
          const keys = await redisClient.keys(fullPattern);
          if (keys.length > 0) {
            await redisClient.del(keys);
          }
        } else {
          await redisClient.del(fullPattern);
        }
      }

      // Clean memory cache as well
      if (patternOrKey.includes('*')) {
        const regex = new RegExp('^' + fullPattern.replace(/\*/g, '.*'));
        for (const k of memoryFallbackCache.keys()) {
          if (regex.test(k)) memoryFallbackCache.delete(k);
        }
      } else {
        memoryFallbackCache.delete(fullPattern);
      }
    } catch (err) {
      console.warn(`[CacheService Warning] Delete error for ${patternOrKey}:`, err.message);
    }
  },

  /**
   * Cache-Aside Wrapper: fetch from cache; if miss, compute and cache
   * Mitigates Cache Stampede using promise deduplication
   * Supports both signatures: wrap(key, fn, [ttl], [tags]) and wrap(key, ttl, fn, [tags])
   */
  async wrap(key, arg2, arg3, arg4) {
    let ttlSeconds = 300;
    let fetchFn;
    let tags = [];

    if (typeof arg2 === 'function') {
      fetchFn = arg2;
      ttlSeconds = typeof arg3 === 'number' ? arg3 : 300;
      tags = Array.isArray(arg4) ? arg4 : [];
    } else {
      ttlSeconds = typeof arg2 === 'number' ? arg2 : 300;
      fetchFn = arg3;
      tags = Array.isArray(arg4) ? arg4 : [];
    }

    if (typeof fetchFn !== 'function') {
      throw new Error(`[CacheService] fetchFn must be a function, received ${typeof fetchFn}`);
    }

    // 1. Try Cache Read
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // 2. Prevent Cache Stampede by coalescing concurrent misses on the same key
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const fetchPromise = (async () => {
      try {
        const freshData = await fetchFn();
        if (freshData !== null && freshData !== undefined) {
          await this.set(key, freshData, ttlSeconds);
        }
        return freshData;
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * Invalidate specific domain tags
   */
  async invalidateTag(tag) {
    await this.del(`${tag}*`);
    console.log(`[CacheService] Invalidation triggered for tag: ${tag}`);
  }
};

module.exports = cacheService;
