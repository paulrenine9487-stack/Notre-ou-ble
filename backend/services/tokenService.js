const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { logSecurityEvent } = require('../utils/securityLogger');

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15-minute short-lived access token
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10); // 7-day refresh token
const JWT_SECRET = process.env.JWT_SECRET || 'resonova_default_secret_key';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

const tokenService = {
  /**
   * Issue a short-lived access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'USER'
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  },

  /**
   * Issue an initial token pair (Access Token + Refresh Token)
   */
  async createTokenPair(user, req = null) {
    const accessToken = this.generateAccessToken(user);

    // Cryptographically secure refresh token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
       VALUES (?, ?, ?, ?)`,
      [user.id, tokenHash, familyId, expiresAt]
    );

    if (req) {
      await logSecurityEvent(req, {
        action: 'TOKEN_PAIR_ISSUED',
        status: 'SUCCESS',
        userId: user.id,
        username: user.username,
        details: { familyId }
      });
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresInSeconds: 900 // 15 min
    };
  },

  /**
   * Rotate Refresh Token with automatic token reuse theft detection
   */
  async rotateRefreshToken(rawRefreshToken, req = null) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      const err = new Error('Refresh token is required.');
      err.statusCode = 400;
      throw err;
    }

    const tokenHash = hashToken(rawRefreshToken);

    const [rows] = await pool.query(
      `SELECT rt.id, rt.user_id, rt.family_id, rt.is_revoked, rt.expires_at,
              u.id as user_actual_id, u.username, u.email, u.role, u.account_locked_until
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      const err = new Error('Invalid refresh token.');
      err.statusCode = 401;
      throw err;
    }

    const tokenRecord = rows[0];

    // Check account lockout
    if (tokenRecord.account_locked_until && new Date(tokenRecord.account_locked_until) > new Date()) {
      const err = new Error('Account is temporarily locked.');
      err.statusCode = 423;
      throw err;
    }

    // THEFT / REUSE DETECTION: If this token was already revoked/rotated, a compromised token is being reused!
    if (tokenRecord.is_revoked) {
      // Invalidate ENTIRE token family immediately
      await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE family_id = ?', [tokenRecord.family_id]);

      if (req) {
        await logSecurityEvent(req, {
          action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE_DETECTED',
          status: 'BLOCKED',
          userId: tokenRecord.user_id,
          username: tokenRecord.username,
          details: { familyId: tokenRecord.family_id, reason: 'Attempted reuse of already rotated refresh token' }
        });
      }

      const err = new Error('Security alert: Invalidated session due to token reuse detection. Please re-authenticate.');
      err.statusCode = 401;
      throw err;
    }

    // Check expiry
    if (new Date(tokenRecord.expires_at) < new Date()) {
      const err = new Error('Refresh token has expired. Please log in again.');
      err.statusCode = 401;
      throw err;
    }

    // Generate new rotated refresh token in the same family
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Revoke old token and record replaced_by_hash
      await connection.query(
        'UPDATE refresh_tokens SET is_revoked = TRUE, replaced_by_hash = ? WHERE id = ?',
        [newTokenHash, tokenRecord.id]
      );

      // Insert new rotated token
      await connection.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
         VALUES (?, ?, ?, ?)`,
        [tokenRecord.user_id, newTokenHash, tokenRecord.family_id, newExpiresAt]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const user = {
      id: tokenRecord.user_actual_id,
      username: tokenRecord.username,
      email: tokenRecord.email,
      role: tokenRecord.role
    };

    const newAccessToken = this.generateAccessToken(user);

    if (req) {
      await logSecurityEvent(req, {
        action: 'TOKEN_ROTATED',
        status: 'SUCCESS',
        userId: user.id,
        username: user.username,
        details: { familyId: tokenRecord.family_id }
      });
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresInSeconds: 900,
      user
    };
  },

  /**
   * Revoke a refresh token on logout
   */
  async revokeRefreshToken(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = ?', [tokenHash]);
  }
};

module.exports = tokenService;
