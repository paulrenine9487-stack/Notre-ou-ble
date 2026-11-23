const Redis = require('ioredis');

// Environment-driven Redis configuration (Kubernetes DNS / Docker service names / localhost)
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let redisClient = null;
let isRedisConnected = false;
let hasLoggedRedisWarning = false;

try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: 2000,
    lazyConnect: false,
    retryStrategy: (times) => {
      // Exponential backoff up to 10 seconds, continuous background reconnect attempts
      const delay = Math.min(times * 500, 10000);
      return delay;
    }
  });

  redisClient.on('connect', () => {
    hasLoggedRedisWarning = false;
    console.log(`[No Tre(ou)ble Redis] Connected to Redis server at ${REDIS_HOST}:${REDIS_PORT}`);
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    hasLoggedRedisWarning = false;
    console.log('[No Tre(ou)ble Redis] Redis ready for distributed caching & rate limiting.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Log once gracefully without spamming logs or crashing backend Node.js process
    if (!hasLoggedRedisWarning) {
      console.warn(`[No Tre(ou)ble Redis Warning] Connection issue (${err.code || err.message}). Graceful in-memory fallback active.`);
      hasLoggedRedisWarning = true;
    }
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });
} catch (error) {
  console.warn('[No Tre(ou)ble Redis] Could not initialize Redis client, fallback active:', error.message);
  redisClient = null;
  isRedisConnected = false;
}

function isRedisAvailable() {
  return Boolean(isRedisConnected && redisClient && redisClient.status === 'ready');
}

module.exports = {
  redisClient,
  isRedisAvailable
};
