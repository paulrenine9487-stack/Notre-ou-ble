const Redis = require('ioredis');

// Environment-driven Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_URL = process.env.REDIS_URL || undefined;
const REDIS_TLS = process.env.REDIS_TLS === 'true' ? {} : undefined;

// Explicit disable flag (default enabled)
const isExplicitlyDisabled = process.env.REDIS_ENABLED === 'false' || process.env.REDIS_ENABLED === '0';

let redisClient = null;
let isRedisConnected = false;
let hasConnectedOnce = false;
let lastErrorMessage = null;

if (!isExplicitlyDisabled) {
  try {
    const redisOptions = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: REDIS_DB,
      tls: REDIS_TLS,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 2500,
      lazyConnect: true, // Connection managed explicitly during startup lifecycle
      retryStrategy: (times) => {
        // Exponential backoff between 500ms and 10,000ms
        const delay = Math.min(500 * Math.pow(1.5, Math.min(times, 8)), 10000);
        return delay;
      }
    };

    redisClient = REDIS_URL ? new Redis(REDIS_URL, redisOptions) : new Redis(redisOptions);

    redisClient.on('connect', () => {
      // TCP connection opened
    });

    redisClient.on('ready', () => {
      const wasDisconnected = !isRedisConnected;
      isRedisConnected = true;
      hasConnectedOnce = true;
      lastErrorMessage = null;
      if (wasDisconnected) {
        console.log(`[Redis] Connection established successfully (${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB})`);
      }
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      lastErrorMessage = err.code || err.message || 'ECONNREFUSED';
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    redisClient.on('reconnecting', () => {
      isRedisConnected = false;
    });
  } catch (error) {
    redisClient = null;
    isRedisConnected = false;
    lastErrorMessage = error.message;
  }
}

/**
 * Initializes Redis connection during server startup
 */
async function initRedis() {
  if (isExplicitlyDisabled || !redisClient) {
    isRedisConnected = false;
    console.log('[Redis] Redis disabled by configuration (REDIS_ENABLED=false). Local in-memory fallback active.');
    return false;
  }

  try {
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (2500ms exceeded)')), 2500))
    ]);
    isRedisConnected = true;
    hasConnectedOnce = true;
    lastErrorMessage = null;
    return true;
  } catch (err) {
    isRedisConnected = false;
    lastErrorMessage = err.code || err.message || 'ECONNREFUSED';
    console.warn(`[Redis Warning] Connection issue (${lastErrorMessage}). Local in-memory fallback active.`);
    return false;
  }
}

/**
 * Check if Redis is connected and ready to process commands
 */
function isRedisAvailable() {
  return Boolean(isRedisConnected && redisClient && redisClient.status === 'ready');
}

/**
 * Safe accessor for the active Redis client
 */
function getRedisClient() {
  return isRedisAvailable() ? redisClient : null;
}

/**
 * Returns accurate, structured status of the Redis subsystem
 */
function getRedisStatus() {
  const isEnabled = !isExplicitlyDisabled && Boolean(redisClient);
  return {
    state: isRedisConnected ? 'REDIS_CONNECTED' : 'REDIS_DISCONNECTED',
    enabled: isEnabled,
    connected: isRedisConnected,
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
    mode: isRedisConnected ? 'DISTRIBUTED_REDIS' : (isEnabled ? 'IN_MEMORY_FALLBACK_ACTIVE' : 'IN_MEMORY_FALLBACK_DISABLED_REDIS'),
    error: isRedisConnected ? null : (lastErrorMessage || (isEnabled ? 'Connection not established' : 'Disabled via REDIS_ENABLED=false'))
  };
}

/**
 * Graceful shutdown of Redis connection
 */
async function closeRedis() {
  if (redisClient) {
    try {
      if (isRedisConnected) {
        await redisClient.quit();
      } else {
        redisClient.disconnect();
      }
    } catch (_) {}
    isRedisConnected = false;
  }
}

module.exports = {
  redisClient,
  initRedis,
  isRedisAvailable,
  getRedisClient,
  getRedisStatus,
  closeRedis
};
