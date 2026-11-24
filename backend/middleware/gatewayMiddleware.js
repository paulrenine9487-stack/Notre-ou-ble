/**
 * API Gateway Middleware
 * Enterprise routing, observability, request ID tracking, timeout management,
 * and standardized API response shaping.
 */

const crypto = require('crypto');

/**
 * Gateway Request Context Middleware
 * Generates unique X-Request-Id, attaches start time, and instruments response.
 */
function gatewayMiddleware(options = {}) {
  const defaultTimeoutMs = options.timeoutMs || 30000; // 30 seconds default
  const uploadTimeoutMs = options.uploadTimeoutMs || 120000; // 120 seconds for media & uploads

  return (req, res, next) => {
    // 1. Generate or forward correlation ID
    const correlationId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || crypto.randomUUID();
    req.id = correlationId;
    res.setHeader('X-Request-Id', correlationId);

    // 2. Attach start time for latency instrumentation
    req._startTime = process.hrtime();

    // Set X-Response-Time header before headers are dispatched
    const origWriteHead = res.writeHead;
    res.writeHead = function (...args) {
      if (!res.headersSent) {
        const [seconds, nanoseconds] = process.hrtime(req._startTime);
        const latencyMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
        res.setHeader('X-Response-Time', `${latencyMs}ms`);
      }
      return origWriteHead.apply(this, args);
    };

    // 3. Adaptive Request timeout handler
    const isUploadOrStream = req.path.includes('/recordings') ||
      req.path.includes('/audio') ||
      req.path.includes('/media') ||
      req.path.includes('/upload') ||
      req.path.includes('/stream');
    const effectiveTimeoutMs = isUploadOrStream ? uploadTimeoutMs : defaultTimeoutMs;

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const timeoutSeconds = Math.round(effectiveTimeoutMs / 1000);
        res.status(504).json({
          success: false,
          message: `The requested operation exceeded the gateway execution threshold (${timeoutSeconds}s).`,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: `The requested operation exceeded the gateway execution threshold (${timeoutSeconds}s).`,
            requestId: correlationId
          }
        });
      }
    }, effectiveTimeoutMs);

    // Logging on completion
    res.on('finish', () => {
      clearTimeout(timer);
      const [seconds, nanoseconds] = process.hrtime(req._startTime);
      const latencyMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

      // Structured access logging in production / verbose mode
      if (process.env.NODE_ENV !== 'test' && !req.path.startsWith('/uploads')) {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress;
        const status = res.statusCode;
        const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
        console.log(`[API-GATEWAY] ${color}${req.method} ${req.originalUrl} ${status}\x1b[0m - ${latencyMs}ms (IP: ${clientIp}, ID: ${correlationId.slice(0, 8)})`);
      }
    });

    res.on('close', () => {
      clearTimeout(timer);
    });

    // 4. Standardized Response Helpers
    res.apiSuccess = (data, message = 'Success', meta = {}) => {
      return res.status(res.statusCode === 200 || res.statusCode === 201 ? res.statusCode : 200).json({
        success: true,
        message,
        data,
        meta: {
          requestId: correlationId,
          timestamp: new Date().toISOString(),
          ...meta
        }
      });
    };

    res.apiError = (message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message,
          details: process.env.NODE_ENV === 'production' && statusCode === 500 ? undefined : details,
          requestId: correlationId,
          timestamp: new Date().toISOString()
        }
      });
    };

    next();
  };
}

module.exports = gatewayMiddleware;
