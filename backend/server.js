const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = require('./config/db');
const { isRedisAvailable, getRedisClient } = require('./utils/redisClient');
const { getBreakersHealth } = require('./services/circuitBreakerService');
const gatewayMiddleware = require('./middleware/gatewayMiddleware');
const {
  generalApiLimiter,
  authLimiter,
  registerLimiter,
  otpLimiter,
  adminApiLimiter
} = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const learningRoutes = require('./routes/learningRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const songRoutes = require('./routes/songRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const breathManagementRoutes = require('./routes/breathManagementRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const errorHandler = require('./middleware/errorHandler');
const initDatabase = require('./config/initDb');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy for correct client IP detection behind reverse proxies
app.set('trust proxy', 1);

// 1. Enterprise HTTP Security Headers (OWASP ASVS 5.0 L2 / OWASP Top 10 A05)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      connectSrc: [
        "'self'",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://[::1]:*",
        "ws://localhost:*",
        "ws://127.0.0.1:*",
        "ws://[::1]:*"
      ],
      frameAncestors: ["'self'"], // Clickjacking protection (NIST / ASVS)
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Additional custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  next();
});

// Response compression (Brotli / Gzip)
app.use(compression({
  threshold: 1024, // compress responses over 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// API Gateway telemetry, request ID correlation, and 30s execution timeout
app.use(gatewayMiddleware());

// 2. Strict CORS Configuration (OWASP API Security API8)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://[::1]:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or curl/mobile requests without origin in dev
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://[::1]')
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Access denied from this origin.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Distributed Redis Rate Limiting Protection (Brute-force / Credential Stuffing / DoS Defense)
app.use('/api', generalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/verify-mfa', authLimiter);
app.use('/api/auth/refresh', authLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/admin', adminApiLimiter);

// 4. Request Body Parsing with strict size limits (OWASP DoS Protection)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 5. Enterprise Health & Readiness Probes (Kubernetes / Load Balancer / Observability)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'No Tre(ou)ble Breath Management API',
    securityStatus: 'Zero Trust Hardened (OWASP ASVS 5.0 L2)',
    version: '2.0.0-enterprise',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/ready', async (req, res) => {
  let dbReady = false;
  let redisReady = false;

  try {
    await pool.query('SELECT 1');
    dbReady = true;
  } catch (e) {
    console.error('[Health Probe] MySQL connection check failed:', e.message);
  }

  redisReady = isRedisAvailable();
  const isReady = dbReady; // Core requirement is MySQL; Redis operates with in-memory fallback
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'READY' : 'DEGRADED',
    checks: {
      database: dbReady ? 'CONNECTED' : 'DISCONNECTED',
      redis: redisReady ? 'CONNECTED' : 'FALLBACK_LOCAL_CACHE'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/live', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    status: 'ALIVE',
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/circuits', (req, res) => {
  res.status(200).json({
    status: 'OK',
    circuits: getBreakersHealth(),
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/modules', learningRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/breath-management', breathManagementRoutes);
app.use('/api/cms', cmsRoutes);

// Public CMS media assets (images, gifs, promotional videos uploaded by administrators)
const cmsUploadsDir = path.resolve(__dirname, 'uploads/cms');
const fs = require('fs');
if (!fs.existsSync(cmsUploadsDir)) {
  fs.mkdirSync(cmsUploadsDir, { recursive: true });
}
app.use('/uploads/cms', express.static(cmsUploadsDir, {
  maxAge: '1d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Public curriculum audio media (guides, backing tracks, song practice audio)
const audioUploadsDir = path.resolve(__dirname, 'uploads/audio');
if (!fs.existsSync(audioUploadsDir)) {
  fs.mkdirSync(audioUploadsDir, { recursive: true });
}
app.use('/uploads/audio', express.static(audioUploadsDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (filePath.endsWith('.mp3')) res.setHeader('Content-Type', 'audio/mpeg');
    else if (filePath.endsWith('.wav')) res.setHeader('Content-Type', 'audio/wav');
    else if (filePath.endsWith('.ogg')) res.setHeader('Content-Type', 'audio/ogg');
    else if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'audio/webm');
  }
}));

// Public videos media
const videosUploadsDir = path.resolve(__dirname, 'uploads/videos');
if (!fs.existsSync(videosUploadsDir)) {
  fs.mkdirSync(videosUploadsDir, { recursive: true });
}
app.use('/uploads/videos', express.static(videosUploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// NOTE: Direct public /uploads static mounting has been REMOVED for student recordings.
// Private student recordings are streamed strictly through authenticated,
// ownership-verified endpoints (/api/learning/recordings/:id/audio).

// Serve built frontend if available
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Safe API 404 JSON Handler (prevents leaking HTML or raw Express 404 errors)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Single Page Application (SPA) universal fallback: Refreshing on any route always loads index.html
app.get('*', (req, res) => {
  if (fs.existsSync(frontendDistPath)) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
  res.status(200).send(`<!DOCTYPE html><html><head><title>No Tre(ou)ble</title><meta http-equiv="refresh" content="1;url=http://localhost:5173${req.originalUrl}"></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>No Tre(ou)ble Learning Portal</h2><p>Connecting to application...</p></body></html>`);
});

// Error Handling Middleware
app.use(errorHandler);

// Initialize Database and Start Server
async function startServer() {
  try {
    console.log('[No Tre(ou)ble Server] Initializing MySQL database connection & security baseline...');
    await initDatabase();
    console.log('[No Tre(ou)ble Server] Database verified.');

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  No Tre(ou)ble - BREATH MANAGEMENT PORTAL BACKEND   `);
      console.log(`  Enterprise Zero Trust Cybersecurity Hardened      `);
      console.log(`  Server running on http://localhost:${PORT}        `);
      console.log(`  API Health: http://localhost:${PORT}/api/health   `);
      console.log(`====================================================`);
    });

    // Prevent ERR_CONNECTION_RESET by aligning keep-alive timeouts with client proxies
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[No Tre(ou)ble Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`Tip: Terminate the existing process using port ${PORT} or configure a different PORT in your .env file.\n`);
      } else {
        console.error('[No Tre(ou)ble Server Listen Error]:', err.message);
      }
    });

    // Graceful Shutdown handling for Kubernetes / Docker horizontal scale
    const gracefulShutdown = (signal) => {
      console.log(`\n[No Tre(ou)ble Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[No Tre(ou)ble Server] HTTP connections closed.');
        try {
          await pool.end();
          console.log('[No Tre(ou)ble Server] MySQL connection pool closed.');
          if (isRedisAvailable()) {
            const redis = getRedisClient();
            if (redis) await redis.quit();
            console.log('[No Tre(ou)ble Server] Redis connection closed.');
          }
        } catch (err) {
          console.error('[No Tre(ou)ble Server] Error during shutdown:', err.message);
        }
        process.exit(0);
      });

      // Force exit if connections do not close in 10s
      setTimeout(() => {
        console.error('[No Tre(ou)ble Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error('[No Tre(ou)ble Server Startup Error]:', err.message);
    const fallbackServer = app.listen(PORT, () => {
      console.log(`[No Tre(ou)ble Server] Running with DB initialization warning on port ${PORT}`);
    });
    fallbackServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[No Tre(ou)ble Server Error] Port ${PORT} is already in use.`);
      }
    });
  }
}

module.exports = app;

if (require.main === module) {
  startServer();
}
