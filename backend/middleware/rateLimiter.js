const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient, isRedisAvailable } = require('../utils/redisClient');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Build Redis store if Redis is available, otherwise undefined (defaults to memory store)
 */
function createStore(prefix) {
  if (isRedisAvailable() && redisClient) {
    return new RedisStore({
      prefix: `notreoble:rl:${prefix}:`,
      sendCommand: (...args) => redisClient.call(...args)
    });
  }
  return undefined; // fallback to express-rate-limit internal memory store
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
        clientIp: req.ip || req.connection?.remoteAddress
      }
    });

    res.status(429).json({
      success: false,
      message,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    });
  };
}

// 1. Strict Authentication Limiter (Login, MFA challenge)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('auth'),
  handler: rateLimitHandler(
    'Too many login attempts from this network. For your security, access is temporarily locked. Please wait 15 minutes or reset your password.',
    'SECURITY_ALERT_BRUTE_FORCE_RATE_LIMIT'
  )
});

// 2. Registration Limiter (Account enumeration and bot signup defense)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 signups per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('register'),
  handler: rateLimitHandler(
    'Too many accounts created from this network. Please wait an hour before attempting further registrations.',
    'SECURITY_ALERT_REGISTRATION_RATE_LIMIT'
  )
});

// 3. OTP & Password Reset Limiter (Prevents OTP brute-forcing / SMS exhaustion)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('otp'),
  handler: rateLimitHandler(
    'Too many verification code attempts. Please wait 15 minutes before requesting a new code.',
    'SECURITY_ALERT_OTP_ABUSE_RATE_LIMIT'
  )
});

// 4. File & Audio/Video Upload Limiter (Mitigates storage exhaustion & DoS)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25, // 25 uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('upload'),
  handler: rateLimitHandler(
    'Upload rate limit exceeded. Please wait a few minutes before submitting additional audio or media files.',
    'SECURITY_ALERT_UPLOAD_RATE_LIMIT'
  )
});

// 5. General API Limiter (Standard student application traffic)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600, // 600 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('general'),
  handler: rateLimitHandler(
    'High request volume detected from this client. Please slow down your requests.',
    'GENERAL_RATE_LIMIT_EXCEEDED'
  )
});

// 6. Admin API Limiter
const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('admin'),
  handler: rateLimitHandler(
    'Administrative request threshold exceeded. Please throttle API requests.',
    'ADMIN_RATE_LIMIT_EXCEEDED'
  )
});

module.exports = {
  authLimiter,
  registerLimiter,
  otpLimiter,
  uploadLimiter,
  generalApiLimiter,
  adminApiLimiter
};
