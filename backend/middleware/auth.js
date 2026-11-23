const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided. Please log in.'
    });
  }

  try {
    // 1. Check if token has been revoked (logout / session termination)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [revoked] = await pool.query(
      'SELECT id FROM revoked_tokens WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
      [tokenHash]
    );

    if (revoked.length > 0) {
      return res.status(401).json({
        success: false,
        message: 'Your session has been logged out or revoked. Please log in again.'
      });
    }

    // 2. Verify signature & expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resonova_default_secret_key');

    // 3. Prevent MFA challenge tokens from accessing standard authenticated APIs
    if (decoded.purpose === 'MFA_CHALLENGE') {
      return res.status(401).json({
        success: false,
        message: 'MFA verification required before accessing this resource.'
      });
    }

    // 4. Query current user state from database
    const [rows] = await pool.query(
      `SELECT id, username, email, gender, phone, vocal_trainer_name, selected_musical_goal, 
              role, mfa_enabled, account_locked_until, created_at 
       FROM users WHERE id = ?`,
      [decoded.userId || decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User account no longer exists.'
      });
    }

    const user = rows[0];

    // 5. Check if user account is temporarily locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to security policy. Please try again later.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed authentication token.'
    });
  }
}

module.exports = authenticateToken;
