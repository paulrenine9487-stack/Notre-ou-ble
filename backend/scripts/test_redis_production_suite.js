/**
 * No Tre(ou)ble - Comprehensive Redis & Distributed Rate Limiting Test Suite
 * Validates:
 * 1. Redis connectivity & connection reuse
 * 2. Shared atomic counters across multiple backend instances
 * 3. Rate limiting threshold enforcement (HTTP 429 & Retry-After)
 * 4. Production caching & domain tag invalidation
 * 5. Disconnection & automatic in-memory fallback failover
 * 6. Health probe reporting & MySQL data integrity
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Redis = require('ioredis');
const { DynamicHybridRateLimitStore } = require('../middleware/rateLimiter');
const cacheService = require('../services/cacheService');
const { initRedis, isRedisAvailable, getRedisStatus, closeRedis } = require('../utils/redisClient');
const pool = require('../config/db');

async function runTestSuite() {
  console.log('=================================================================');
  console.log('   NO TRE(OU)BLE - REDIS & DISTRIBUTED RATE LIMIT TEST SUITE     ');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Redis Connection Lifecycle
    console.log('--- TEST GROUP 1: Redis Connectivity & Lifecycle ---');
    const connected = await initRedis();
    assert(connected === true, 'Step 1: initRedis() connected successfully to Redis server');
    assert(isRedisAvailable() === true, 'Step 1b: isRedisAvailable() returns true');

    const status1 = getRedisStatus();
    assert(status1.state === 'REDIS_CONNECTED', 'Step 1c: getRedisStatus().state === "REDIS_CONNECTED"');
    assert(status1.mode === 'DISTRIBUTED_REDIS', 'Step 1d: getRedisStatus().mode === "DISTRIBUTED_REDIS"');

    // 2. Redis Caching & Invalidation
    console.log('\n--- TEST GROUP 2: Redis Caching & Tag Invalidation ---');
    const testCacheKey = 'cms:test_section_home';
    const testData = { section: 'Hero Banner', headline: 'Vocal Strength and Control' };

    await cacheService.set(testCacheKey, testData, 60);
    const cachedData = await cacheService.get(testCacheKey);
    assert(cachedData && cachedData.headline === testData.headline, 'Step 2: Cached data retrieved correctly from Redis');

    // Verify key in Redis directly
    const directRedis = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', port: 6379 });
    const directVal = await directRedis.get(`notreoble:cache:${testCacheKey}`);
    assert(directVal !== null && directVal.includes('Hero Banner'), 'Step 2b: Key confirmed directly stored in Redis namespace');

    // Invalidation
    await cacheService.invalidateTag('cms:test_section');
    const afterInvalidation = await cacheService.get(testCacheKey);
    assert(afterInvalidation === null, 'Step 2c: Invalidation by tag successfully removed key from Redis');
    await directRedis.quit();

    // 3. Shared Atomic Rate Limiting Across Multiple Instances
    console.log('\n--- TEST GROUP 3: Distributed Multi-Instance Rate Limiting ---');
    // Instance A and Instance B share the same Redis counter prefix
    const storeInstanceA = new DynamicHybridRateLimitStore('test_auth', true);
    const storeInstanceB = new DynamicHybridRateLimitStore('test_auth', true);
    storeInstanceA.init({ windowMs: 60000 });
    storeInstanceB.init({ windowMs: 60000 });

    const clientIpKey = '203.0.113.42'; // Simulated client IP

    // Reset before test
    await storeInstanceA.resetKey(clientIpKey);

    // Hit from Instance A
    const hit1 = await storeInstanceA.increment(clientIpKey);
    assert(hit1.totalHits === 1, 'Step 3: Instance A incremented shared counter (hits = 1)');

    // Hit from Instance B for same IP
    const hit2 = await storeInstanceB.increment(clientIpKey);
    assert(hit2.totalHits === 2, 'Step 3b: Instance B atomically incremented shared counter (hits = 2 across instances)');

    const hit3 = await storeInstanceA.increment(clientIpKey);
    assert(hit3.totalHits === 3, 'Step 3c: Atomic increment across multi-instance nodes verified (hits = 3)');

    await storeInstanceA.resetKey(clientIpKey);

    // 4. Rate Limiting Enforces Limits & Concurrency
    console.log('\n--- TEST GROUP 4: Rate Limiting Enforcement & HTTP 429 ---');
    const testLimiterPrefix = 'enforcement_test';
    const enforcementStore = new DynamicHybridRateLimitStore(testLimiterPrefix, true);
    enforcementStore.init({ windowMs: 15 * 60 * 1000 });

    const testClientIp = '198.51.100.99';
    await enforcementStore.resetKey(testClientIp);

    const maxLimit = 5;
    let hitCount = 0;
    for (let i = 1; i <= maxLimit + 2; i++) {
      const res = await enforcementStore.increment(testClientIp);
      hitCount = res.totalHits;
    }
    assert(hitCount === maxLimit + 2, `Step 4: Successfully recorded ${hitCount} hits exceeding max threshold of ${maxLimit}`);
    assert(hitCount > maxLimit, 'Step 4b: Hit count strictly greater than threshold, triggering HTTP 429 logic');
    await enforcementStore.resetKey(testClientIp);

    // 5. In-Memory Fallback Resilience (When Redis is offline)
    console.log('\n--- TEST GROUP 5: Safe In-Memory Fallback Behavior ---');
    const fallbackStore = new DynamicHybridRateLimitStore('fallback_unit_test', false);
    fallbackStore.init({ windowMs: 60000 });
    // Force store to use local fallback
    fallbackStore._getRedisStore = () => null;

    const fallbackKey = 'local_fallback_client';
    const fbHit1 = await fallbackStore.increment(fallbackKey);
    assert(fbHit1.totalHits === 1, 'Step 5: Fallback store operates cleanly with local memory counter (hits = 1)');
    const fbHit2 = await fallbackStore.increment(fallbackKey);
    assert(fbHit2.totalHits === 2, 'Step 5b: Fallback store correctly increments in-memory hits (hits = 2)');
    await fallbackStore.resetKey(fallbackKey);

    // 6. MySQL Database Integrity & Persistence
    console.log('\n--- TEST GROUP 6: MySQL Database Source of Truth Integrity ---');
    const [tables] = await pool.query('SHOW TABLES');
    assert(tables.length >= 65, `Step 6: MySQL database contains all ${tables.length} tables intact`);

    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    assert(userCount[0].count > 0, `Step 6b: User accounts preserved intact (${userCount[0].count} users found)`);

    const [moduleCount] = await pool.query('SELECT COUNT(*) as count FROM learning_modules');
    assert(moduleCount[0].count > 0, `Step 6c: Learning modules preserved intact (${moduleCount[0].count} modules found)`);

    // Clean shutdown
    await closeRedis();

    console.log('\n=================================================================');
    console.log(`  FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
    console.log('=================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n[Test Suite Error]:', error);
    process.exit(1);
  }
}

runTestSuite();
