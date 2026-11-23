const pool = require('../config/db');

/**
 * Sanitizes an object by removing sensitive credentials before logging.
 */
function sanitizeLogDetails(details) {
  if (!details || typeof details !== 'object') return details;
  const sensitiveKeys = ['password', 'confirm_password', 'token', 'secret', 'otp', 'otp_code', 'jwt', 'mfa_secret'];
  const sanitized = Array.isArray(details) ? [...details] : { ...details };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogDetails(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * Extracts client IP from request, handling reverse proxies securely.
 */
function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Records a security event to MySQL security_audit_logs.
 * Asynchronous & non-blocking: never crashes incoming request if DB write fails.
 */
async function logSecurityEvent(req, { action, status = 'SUCCESS', userId = null, username = null, details = null }) {
  try {
    const ip = getClientIp(req);
    const userAgent = (req && req.headers && req.headers['user-agent']) 
      ? String(req.headers['user-agent']).slice(0, 255) 
      : null;
    const finalUserId = userId || req?.user?.id || null;
    const finalUsername = username || req?.user?.username || null;
    const sanitizedDetails = sanitizeLogDetails(details);

    await pool.query(
      `INSERT INTO security_audit_logs (user_id, username, action, status, ip_address, user_agent, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUserId,
        finalUsername,
        action,
        status,
        ip,
        userAgent,
        sanitizedDetails ? JSON.stringify(sanitizedDetails) : null
      ]
    );
  } catch (err) {
    console.error('[Security Logger Failure]:', err.message);
  }
}

module.exports = {
  logSecurityEvent,
  sanitizeLogDetails,
  getClientIp
};
