const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, isRedisAvailable } = require('../utils/redisClient');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Dynamic Hybrid Rate Limit Store
 * Concurrency-safe store that delegates to Redis when connected for shared counters
 * across backend instances, and gracefully falls back to local memory if Redis is offline.
 */
class DynamicHybridRateLimitStore {
  constructor(prefix, failClosedInProduction = false) {
    this.prefix = `notreoble:rl:${prefix}:`;
    this.failClosedInProduction = failClosedInProduction;
    this.redisStore = null;
    this.memoryStore = new Map();
    this.options = { windowMs: 15 * 60 * 1000 };

    // Periodic sweep for memory store to prevent memory leaks during fallback
    this.sweepInterval = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.memoryStore.entries()) {
        if (v && v.resetTime && v.resetTime.getTime() <= now) {
          this.memoryStore.delete(k);
        }
      }
    }, 60000);
    if (this.sweepInterval.unref) this.sweepInterval.unref();
  }

  init(options) {
    this.options = options || { windowMs: 15 * 60 * 1000 };
    if (this.redisStore && this.redisStore.init) {
      this.redisStore.init(this.options);
    }
  }

  _getRedisStore() {
    if (isRedisAvailable() && redisClient) {
      if (!this.redisStore) {
        this.redisStore = new RedisStore({
          prefix: this.prefix,
          sendCommand: (...args) => {
            if (!isRedisAvailable() || !redisClient) {
              throw new Error('Redis connection unavailable');
            }
            return redisClient.call(...args);
          }
        });
        if (this.redisStore.init) {
          this.redisStore.init(this.options);
        }
      }
      return this.redisStore;
    }
    return null;
  }

  async increment(key) {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        return await rStore.increment(key);
      } catch (err) {
        // If Redis command fails, log once and fall back or fail closed
        if (process.env.NODE_ENV === 'production' && this.failClosedInProduction) {
          throw new Error('Security rate limiting service unavailable');
        }
      }
    }

    // High-performance concurrency-safe in-memory counter with window expiry
    const now = Date.now();
    const existing = this.memoryStore.get(key);
    if (!existing || existing.resetTime.getTime() <= now) {
      const resetTime = new Date(now + this.options.windowMs);
      const entry = { totalHits: 1, resetTime };
      this.memoryStore.set(key, entry);
      return entry;
    }
    existing.totalHits += 1;
    return existing;
  }

  async decrement(key) {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        return await rStore.decrement(key);
      } catch (_) {}
    }
    const existing = this.memoryStore.get(key);
    if (existing && existing.totalHits > 0) {
      existing.totalHits -= 1;
    }
  }

  async resetKey(key) {
    const rStore = this._getRedisStore();
    if (rStore) {
      try {
        return await rStore.resetKey(key);
      } catch (_) {}
    }
    this.memoryStore.delete(key);
  }

  async resetAll() {
    const rStore = this._getRedisStore();
    if (rStore && rStore.resetAll) {
      try {
        await rStore.resetAll();
      } catch (_) {}
    }
    this.memoryStore.clear();
  }
}

/**
 * Creates dynamic rate limit store
 */
function createStore(prefix, failClosed = false) {
  return new DynamicHybridRateLimitStore(prefix, failClosed);
}

/**
 * Determine if request is exempt from rate limiting
 */
function isLocalOrExempt(req) {
  if (process.env.DISABLE_RATE_LIMIT === 'true') return true;
  // If TEST_RATE_LIMIT=true, never exempt localhost so rate limits can be verified
  if (process.env.TEST_RATE_LIMIT === 'true') return false;

  const ip = req.ip || req.connection?.remoteAddress || '';
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.includes('127.0.0.1') ||
    ip === 'localhost'
  ) {
    return true;
  }
  return false;
}

function rateLimitHandler(message, actionTag) {
  return (req, res, next, options) => {
    // Log security rate-limit trigger
    logSecurityEvent(req, {
      action: actionTag || 'RATE_LIMIT_EXCEEDED',
      status: 'BLOCKED',
      details: {
        path: req.originalUrl,
        method: req.method,
        clientIp: req.ip || req.connection?.remoteAddress,
        mode: isRedisAvailable() ? 'DISTRIBUTED_REDIS' : 'LOCAL_IN_MEMORY'
      }
    });

    const retrySec = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retrySec);

    res.status(429).json({
      success: false,
      message,
      retryAfterSeconds: retrySec,
      rateLimitState: isRedisAvailable() ? 'DISTRIBUTED_REDIS' : 'LOCAL_IN_MEMORY'
    });
  };
}

// 1. Strict Authentication Limiter (Login, MFA challenge)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrExempt(req),
  store: createStore('auth', true),
  handler: rateLimitHandler(
    'Too many login attempts from this network. For your security, access is temporarily locked. Please wait a few minutes or reset your password.',
    'SECURITY_ALERT_BRUTE_FORCE_RATE_LIMIT'
  )
});

// 2. Registration Limiter (Account enumeration and bot signup defense)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 signups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrExempt(req),
  store: createStore('register', true),
  handler: rateLimitHandler(
    'Too many accounts created from this network. Please wait an hour before attempting further registrations.',
    'SECURITY_ALERT_REGISTRATION_RATE_LIMIT'
  )
});

// 3. OTP & Password Reset Limiter (Prevents OTP brute-forcing / SMS exhaustion)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrExempt(req),
  store: createStore('otp', true),
  handler: rateLimitHandler(
    'Too many verification code attempts. Please wait a few minutes before requesting a new code.',
    'SECURITY_ALERT_OTP_ABUSE_RATE_LIMIT'
  )
});

// 4. File & Audio/Video Upload Limiter (Mitigates storage exhaustion & DoS)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrExempt(req),
  store: createStore('upload', false),
  handler: rateLimitHandler(
    'Upload rate limit exceeded. Please wait a few minutes before submitting additional audio or media files.',
    'SECURITY_ALERT_UPLOAD_RATE_LIMIT'
  )
});

// 5. General API Limiter (Standard student application traffic)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_GENERAL_MAX ? parseInt(process.env.RATE_LIMIT_GENERAL_MAX, 10) : 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (isLocalOrExempt(req)) return true;
    if (req.method === 'GET' && (req.path.includes('/branding-theme') || req.path.includes('/health'))) {
      return true;
    }
    return false;
  },
  store: createStore('general', false),
  handler: rateLimitHandler(
    'High request volume detected from this client. Please slow down your requests.',
    'GENERAL_RATE_LIMIT_EXCEEDED'
  )
});

// 6. Admin API Limiter
const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrExempt(req),
  store: createStore('admin', false),
  handler: rateLimitHandler(
    'Administrative request threshold exceeded. Please throttle API requests.',
    'ADMIN_RATE_LIMIT_EXCEEDED'
  )
});

// 7. Token Refresh Limiter
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrExempt(req),
  store: createStore('refresh', false)
});

module.exports = {
  authLimiter,
  registerLimiter,
  otpLimiter,
  uploadLimiter,
  generalApiLimiter,
  adminApiLimiter,
  refreshLimiter,
  DynamicHybridRateLimitStore
};
