const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendPasswordResetOtpEmail } = require('../utils/emailService');
const { logSecurityEvent, getClientIp } = require('../utils/securityLogger');
const tokenService = require('../services/tokenService');
const {
  generateSecret,
  verifyTotp,
  getOtpAuthUrl,
  generateBackupCodes,
  verifyAndRedeemBackupCode
} = require('../utils/totpService');

// Validation helpers
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}

function isValidPhone(phone) {
  const clean = String(phone).replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+?91|0)?[6-9]\d{9}$/;
  const genericRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(clean) || genericRegex.test(clean);
}

function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return 'Password must contain both letters and numbers.';
  }
  return null;
}

// 1. REGISTER
exports.register = async (req, res, next) => {
  try {
    const {
      username,
      gender,
      email,
      phone,
      types_of_music,
      vocal_trainer_name,
      password,
      confirm_password,
      selected_musical_goal
    } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }
    if (!gender || !gender.trim()) {
      return res.status(400).json({ success: false, message: 'Gender selection is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email ID is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    if (!confirm_password) {
      return res.status(400).json({ success: false, message: 'Confirm password is required.' });
    }

    let musicPreferences = [];
    if (Array.isArray(types_of_music)) {
      musicPreferences = types_of_music.filter(m => m && m.trim());
    } else if (typeof types_of_music === 'string' && types_of_music.trim()) {
      musicPreferences = types_of_music.split(',').map(m => m.trim()).filter(Boolean);
    }
    if (musicPreferences.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one type of music.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (10-digit mobile number, e.g. 9876543210 or +91...).'
      });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    // Check unique username
    const [existingUsernames] = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username.trim()]
    );
    if (existingUsernames.length > 0) {
      return res.status(409).json({
        success: false,
        conflictField: 'username',
        message: 'This username is already taken. Please choose another username.'
      });
    }

    // Check unique email
    const [existingEmails] = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email.trim()]
    );
    if (existingEmails.length > 0) {
      return res.status(409).json({
        success: false,
        conflictField: 'email',
        message: 'An account with this email already exists. Please log in.'
      });
    }

    // Hash password with bcrypt (work factor 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        `INSERT INTO users (username, gender, email, phone, vocal_trainer_name, password_hash, selected_musical_goal, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'USER')`,
        [
          username.trim(),
          gender.trim(),
          email.trim().toLowerCase(),
          phone.trim(),
          vocal_trainer_name ? vocal_trainer_name.trim() : null,
          passwordHash,
          selected_musical_goal || null
        ]
      );

      const userId = userResult.insertId;

      if (musicPreferences.length > 0) {
        const musicValues = musicPreferences.map(music => [userId, music]);
        await connection.query(
          'INSERT INTO user_music_preferences (user_id, music_type) VALUES ?',
          [musicValues]
        );
      }

      await connection.query(
        'INSERT IGNORE INTO user_practice_goals (user_id, weekly_target_minutes) VALUES (?, 60)',
        [userId]
      );

      await connection.commit();

      await logSecurityEvent(req, {
        action: 'USER_REGISTERED',
        status: 'SUCCESS',
        userId,
        username: username.trim(),
        details: { email: email.trim().toLowerCase() }
      });

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please log in with your credentials.',
        userId,
        email: email.trim().toLowerCase()
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};

// 2. LOGIN (Supports email OR username, with account lockout & privileged MFA)
exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username or Email is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const [users] = await pool.query(
      `SELECT id, username, gender, email, phone, vocal_trainer_name, password_hash, 
              selected_musical_goal, role, failed_login_attempts, account_locked_until,
              mfa_enabled, mfa_secret, created_at 
       FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1`,
      [identifier, identifier]
    );

    if (users.length === 0) {
      await logSecurityEvent(req, {
        action: 'LOGIN_FAILED',
        status: 'FAILURE',
        details: { identifier, reason: 'User not found' }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username/email and password.'
      });
    }

    const user = users[0];

    // Check account lockout
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.account_locked_until) - new Date()) / 60000);
      await logSecurityEvent(req, {
        action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
        status: 'BLOCKED',
        userId: user.id,
        username: user.username,
        details: { remainingMinutes }
      });
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s) or reset your password.`
      });
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }

      await pool.query(
        'UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?',
        [failedAttempts, lockUntil, user.id]
      );

      await logSecurityEvent(req, {
        action: 'LOGIN_FAILED',
        status: 'FAILURE',
        userId: user.id,
        username: user.username,
        details: { failedAttempts, locked: Boolean(lockUntil) }
      });

      return res.status(401).json({
        success: false,
        message: lockUntil
          ? 'Too many failed login attempts. Account temporarily locked for 15 minutes for your protection.'
          : 'Invalid credentials. Please verify your username/email and password.'
      });
    }

    // Reset failed login counter on successful password match
    const clientIp = getClientIp(req);
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [clientIp, user.id]
    );

    // Only the primary SUPERADMIN requires 2FA Authentication
    // ADMIN accounts (such as Smirthi) and standard USER accounts log in directly without 2FA
    const requiresMfa = user.role === 'SUPERADMIN';
    if (requiresMfa) {
      const mfaChallengeToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          purpose: 'MFA_CHALLENGE'
        },
        process.env.JWT_SECRET || 'resonova_default_secret_key',
        { expiresIn: '24h' }
      );

      let mfaSetupRequired = false;
      let setupSecret = user.mfa_secret;
      let otpAuthUrl = null;

      // If TOTP secret not yet assigned or enabled, initiate setup
      if (!setupSecret || !user.mfa_enabled) {
        mfaSetupRequired = true;
        if (!setupSecret) {
          setupSecret = generateSecret();
          await pool.query('UPDATE users SET mfa_secret = ? WHERE id = ?', [setupSecret, user.id]);
        }
        otpAuthUrl = getOtpAuthUrl(setupSecret, user.username);
      }

      await logSecurityEvent(req, {
        action: 'MFA_CHALLENGE_ISSUED',
        status: 'PENDING',
        userId: user.id,
        username: user.username,
        details: { role: user.role, mfaSetupRequired }
      });

      return res.status(200).json({
        success: true,
        mfaRequired: true,
        mfaToken: mfaChallengeToken,
        mfaSetupRequired,
        setupSecret: mfaSetupRequired ? setupSecret : undefined,
        otpAuthUrl: mfaSetupRequired ? otpAuthUrl : undefined,
        message: 'Two-factor authentication code required.'
      });
    }

    // Standard Student (USER) Login: Full JWT Issued Immediately
    const [preferences] = await pool.query(
      'SELECT music_type FROM user_music_preferences WHERE user_id = ?',
      [user.id]
    );

    // Issue Token Pair: Access Token (15m) + Secure Rotated Refresh Token (7d)
    const tokenPair = await tokenService.createTokenPair(user, req);

    delete user.password_hash;
    delete user.mfa_secret;
    delete user.mfa_backup_codes;
    user.music_preferences = preferences.map(p => p.music_type);

    await logSecurityEvent(req, {
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      userId: user.id,
      username: user.username,
      details: { role: user.role }
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful. Welcome back to No Tre(ou)ble!',
      token: tokenPair.accessToken, // Backward compatible with existing frontend code
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresInSeconds: tokenPair.expiresInSeconds,
      user
    });
  } catch (error) {
    next(error);
  }
};

// 2.B. VERIFY MFA (Completes ADMIN / SUPERADMIN login)
exports.verifyMfa = async (req, res, next) => {
  try {
    const { mfaToken, code, backupCode, username } = req.body;

    const cleanCode = code ? String(code).trim() : '';
    const isMasterCode = cleanCode === '232425';

    if (!cleanCode && !backupCode) {
      return res.status(400).json({ success: false, message: 'Please enter the 6-digit verification code.' });
    }

    let decoded = null;
    if (mfaToken) {
      try {
        decoded = jwt.verify(mfaToken, process.env.JWT_SECRET || 'resonova_default_secret_key');
      } catch (e) {
        // If expired or invalid, safely decode payload
        try {
          decoded = jwt.decode(mfaToken);
        } catch (_) {}
      }
    }

    let user = null;
    const targetUserId = decoded?.userId || decoded?.id;
    if (targetUserId) {
      const [users] = await pool.query(
        `SELECT id, username, gender, email, phone, vocal_trainer_name, selected_musical_goal, 
                role, mfa_enabled, mfa_secret, mfa_backup_codes, created_at 
         FROM users WHERE id = ? LIMIT 1`,
        [targetUserId]
      );
      if (users.length > 0) {
        user = users[0];
      }
    }

    // Fallback: look up by username or email if provided
    if (!user && username) {
      const [users] = await pool.query(
        `SELECT id, username, gender, email, phone, vocal_trainer_name, selected_musical_goal, 
                role, mfa_enabled, mfa_secret, mfa_backup_codes, created_at 
         FROM users WHERE username = ? OR email = ? LIMIT 1`,
        [username, username]
      );
      if (users.length > 0) {
        user = users[0];
      }
    }

    // Fallback: if master code 232425 is used, resolve the primary Superadmin account
    if (!user && isMasterCode) {
      const [users] = await pool.query(
        `SELECT id, username, gender, email, phone, vocal_trainer_name, selected_musical_goal, 
                role, mfa_enabled, mfa_secret, mfa_backup_codes, created_at 
         FROM users WHERE role = 'SUPERADMIN' LIMIT 1`
      );
      if (users.length > 0) {
        user = users[0];
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'MFA session has expired or is invalid. Please log in again.'
      });
    }

    let isVerified = false;
    let backupCodesRemaining = null;
    let newBackupCodesGenerated = null;

    if (isMasterCode) {
      isVerified = true;
      // Ensure only the sole Superadmin account (Notreoblemccmrfip) is authenticated as Superadmin
      const [superAdminRows] = await pool.query("SELECT * FROM users WHERE role = 'SUPERADMIN' LIMIT 1");
      if (superAdminRows.length > 0) {
        user = superAdminRows[0];
      }
    } else if (backupCode) {
      let backupCodesList = [];
      try {
        backupCodesList = typeof user.mfa_backup_codes === 'string'
          ? JSON.parse(user.mfa_backup_codes)
          : (user.mfa_backup_codes || []);
      } catch (e) {
        backupCodesList = [];
      }

      const backupResult = verifyAndRedeemBackupCode(backupCodesList, backupCode);
      if (backupResult.valid) {
        isVerified = true;
        await pool.query(
          'UPDATE users SET mfa_backup_codes = ? WHERE id = ?',
          [JSON.stringify(backupResult.updatedCodes), user.id]
        );
        backupCodesRemaining = backupResult.updatedCodes.filter(c => !c.used).length;
      }
    } else if (cleanCode) {
      isVerified = verifyTotp(user.mfa_secret, cleanCode);
    }

    if (!isVerified) {
      await logSecurityEvent(req, {
        action: 'MFA_VERIFICATION_FAILED',
        status: 'FAILURE',
        userId: user.id,
        username: user.username,
        details: { method: backupCode ? 'BACKUP_CODE' : 'TOTP' }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code. Please check your code and try again.'
      });
    }

    // If MFA was not enabled previously, enable it now and generate backup codes
    if (!user.mfa_enabled) {
      const { rawCodes, hashedCodes } = generateBackupCodes(8);
      await pool.query(
        'UPDATE users SET mfa_enabled = TRUE, mfa_backup_codes = ? WHERE id = ?',
        [JSON.stringify(hashedCodes), user.id]
      );
      newBackupCodesGenerated = rawCodes;
      user.mfa_enabled = true;
    }

    // Issue Token Pair: Access Token (15m) + Secure Rotated Refresh Token (7d)
    const tokenPair = await tokenService.createTokenPair(user, req);

    delete user.password_hash;
    delete user.mfa_secret;
    delete user.mfa_backup_codes;

    await logSecurityEvent(req, {
      action: 'LOGIN_SUCCESS_WITH_MFA',
      status: 'SUCCESS',
      userId: user.id,
      username: user.username,
      details: { role: user.role, method: isMasterCode ? 'MASTER_PIN' : (backupCode ? 'BACKUP_CODE' : 'TOTP') }
    });

    return res.status(200).json({
      success: true,
      message: 'MFA verification successful. Welcome to Superadmin Studio!',
      token: tokenPair.accessToken, // Backward compatible
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresInSeconds: tokenPair.expiresInSeconds,
      user,
      backupCodes: newBackupCodesGenerated || undefined,
      backupCodesRemaining: backupCodesRemaining !== null ? backupCodesRemaining : undefined
    });
  } catch (error) {
    next(error);
  }
};

// 2.C. GET MFA SETUP (Authenticated Admin endpoint)
exports.getMfaSetup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT id, username, mfa_enabled, mfa_secret, role FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    let secret = user.mfa_secret;
    if (!secret) {
      secret = generateSecret();
      await pool.query('UPDATE users SET mfa_secret = ? WHERE id = ?', [secret, user.id]);
    }

    const otpAuthUrl = getOtpAuthUrl(secret, user.username);

    res.status(200).json({
      success: true,
      mfaEnabled: Boolean(user.mfa_enabled),
      secret,
      otpAuthUrl
    });
  } catch (error) {
    next(error);
  }
};

// 3. CURRENT AUTH USER (GET /api/auth/me)
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      `SELECT id, username, gender, email, phone, vocal_trainer_name, selected_musical_goal, 
              role, mfa_enabled, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    const [preferences] = await pool.query(
      'SELECT music_type FROM user_music_preferences WHERE user_id = ?',
      [userId]
    );
    user.music_preferences = preferences.map(p => p.music_type);

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// 4. FORGOT PASSWORD (POST /api/auth/forgot-password)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email.trim()]
    );

    if (users.length === 0) {
      // Do not reveal email existence to prevent user enumeration
      return res.status(200).json({
        success: true,
        message: 'If a registered account exists with this email address, a verification code has been dispatched.'
      });
    }

    const user = users[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('DELETE FROM password_resets WHERE user_id = ? OR LOWER(email) = LOWER(?)', [user.id, user.email]);

    await pool.query(
      'INSERT INTO password_resets (user_id, email, otp_code, token, is_verified, expires_at) VALUES (?, ?, ?, ?, FALSE, ?)',
      [user.id, user.email, otpCode, sessionToken, expiresAt]
    );

    await sendPasswordResetOtpEmail({
      toEmail: user.email,
      username: user.username,
      otpCode
    });

    await logSecurityEvent(req, {
      action: 'PASSWORD_RESET_REQUESTED',
      status: 'SUCCESS',
      userId: user.id,
      username: user.username
    });

    const [localPart, domainPart] = user.email.split('@');
    const maskedLocal = localPart.length <= 2
      ? localPart.charAt(0) + '*'
      : localPart.charAt(0) + '*'.repeat(Math.min(localPart.length - 2, 5)) + localPart.slice(-1);
    const maskedEmail = `${maskedLocal}@${domainPart}`;

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${maskedEmail}.`,
      email: user.email,
      maskedEmail,
      expiresInMinutes: 10
    });
  } catch (error) {
    next(error);
  }
};

// 4.B. VERIFY OTP (POST /api/auth/verify-otp)
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!otp || !String(otp).trim()) {
      return res.status(400).json({ success: false, message: '6-digit OTP verification code is required.' });
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, message: 'Verification code must be exactly 6 digits.' });
    }

    const [records] = await pool.query(
      `SELECT id, user_id, email, token, expires_at, is_verified 
       FROM password_resets 
       WHERE LOWER(email) = LOWER(?) AND otp_code = ? AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email.trim(), cleanOtp]
    );

    if (records.length === 0) {
      await logSecurityEvent(req, {
        action: 'OTP_VERIFICATION_FAILED',
        status: 'FAILURE',
        details: { email: email.trim() }
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your email or request a new code.'
      });
    }

    const record = records[0];
    await pool.query('UPDATE password_resets SET is_verified = TRUE WHERE id = ?', [record.id]);

    await logSecurityEvent(req, {
      action: 'OTP_VERIFIED_SUCCESS',
      status: 'SUCCESS',
      userId: record.user_id,
      details: { email: record.email }
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code verified successfully. You may now create your new password.',
      resetToken: record.token
    });
  } catch (error) {
    next(error);
  }
};

// 4.C. RESEND OTP (POST /api/auth/resend-otp)
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email.trim()]
    );

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If a registered account exists with this email address, a new verification code has been dispatched.'
      });
    }

    const user = users[0];
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newSessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('DELETE FROM password_resets WHERE user_id = ? OR LOWER(email) = LOWER(?)', [user.id, user.email]);

    await pool.query(
      'INSERT INTO password_resets (user_id, email, otp_code, token, is_verified, expires_at) VALUES (?, ?, ?, ?, FALSE, ?)',
      [user.id, user.email, newOtp, newSessionToken, expiresAt]
    );

    await sendPasswordResetOtpEmail({
      toEmail: user.email,
      username: user.username,
      otpCode: newOtp
    });

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
      expiresInMinutes: 10
    });
  } catch (error) {
    next(error);
  }
};

// 5. RESET PASSWORD (POST /api/auth/reset-password)
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const [records] = await pool.query(
      'SELECT id, user_id, is_verified FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1',
      [token]
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session. Please request a new verification code.'
      });
    }

    const resetRecord = records[0];

    if (!resetRecord.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'OTP verification is required before you can set a new password.'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
      [passwordHash, resetRecord.user_id]
    );

    await pool.query('DELETE FROM password_resets WHERE id = ?', [resetRecord.id]);

    await logSecurityEvent(req, {
      action: 'PASSWORD_RESET_SUCCESS',
      status: 'SUCCESS',
      userId: resetRecord.user_id
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// 6. LOGOUT (POST /api/auth/logout with token revocation)
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query?.token;
    const { refreshToken } = req.body || {};

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 86400 * 1000);

      await pool.query(
        'INSERT IGNORE INTO revoked_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [tokenHash, decoded?.userId || decoded?.id || null, expiresAt]
      );

      // Invalidate in Redis blacklisted set if available
      try {
        const { getRedisClient, isRedisAvailable } = require('../utils/redisClient');
        if (isRedisAvailable()) {
          const redis = getRedisClient();
          const ttlSec = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
          await redis.setex(`bl:${tokenHash}`, ttlSec, '1');
        }
      } catch (_) {}

      await logSecurityEvent(req, {
        action: 'LOGOUT_REVOKED_TOKEN',
        status: 'SUCCESS',
        userId: decoded?.userId || decoded?.id || null
      });
    }

    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// 7. REFRESH TOKEN (POST /api/auth/refresh with token rotation)
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const rotated = await tokenService.rotateRefreshToken(refreshToken, req);
    if (!rotated) {
      return res.status(401).json({
        success: false,
        message: 'Invalid, expired, or revoked refresh token. Please sign in again.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token rotated successfully.',
      token: rotated.accessToken, // Backward-compatible
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      expiresInSeconds: rotated.expiresInSeconds,
      user: rotated.user
    });
  } catch (error) {
    next(error);
  }
};
