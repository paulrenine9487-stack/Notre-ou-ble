const nodemailer = require('nodemailer');

/**
 * Parses and validates SMTP environment configuration safely.
 * Never exposes passwords or secret tokens.
 */
function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  const cleanPass = rawPass.replace(/\s+/g, ''); // strip spaces from App Passwords
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from = (process.env.SMTP_FROM || process.env.EMAIL_FROM || '').trim() ||
               (user ? `"No Tre(ou)ble" <${user}>` : '"No Tre(ou)ble" <noreply@notreouble.com>');

  const isConfigured = Boolean(user && cleanPass);

  return {
    host,
    port,
    user,
    pass: cleanPass,
    secure,
    from,
    isConfigured
  };
}

/**
 * Creates and configures the nodemailer transporter.
 * Supports Gmail directly or custom SMTP hosts (port 465 SSL or 587 STARTTLS).
 */
function createTransporter(customConfig = null) {
  const config = customConfig || getSmtpConfig();
  if (!config.isConfigured) {
    return null;
  }

  // Gmail-optimized transport
  if (config.host.toLowerCase().includes('gmail') || config.user.toLowerCase().includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }

  // Standard SMTP transport (port 465 SSL or port 587 STARTTLS)
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure && config.port === 587,
    auth: {
      user: config.user,
      pass: config.pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

/**
 * Verifies the SMTP connection during startup or diagnostic checks.
 * Never exposes passwords in response or logs.
 */
async function verifySmtpConnection(customTransporter = null) {
  const config = getSmtpConfig();
  if (!config.isConfigured) {
    return {
      configured: false,
      connected: false,
      error: 'SMTP_NOT_CONFIGURED',
      message: 'SMTP credentials (SMTP_USER / SMTP_PASS) are not configured in backend/.env.'
    };
  }

  const transporter = customTransporter || createTransporter();
  if (!transporter) {
    return {
      configured: false,
      connected: false,
      error: 'TRANSPORTER_CREATION_FAILED',
      message: 'Failed to initialize SMTP transporter.'
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      connected: true,
      host: config.host,
      port: config.port,
      secure: config.secure,
      from: config.from,
      user: `${config.user.substring(0, 3)}***@${config.user.split('@')[1] || ''}`
    };
  } catch (err) {
    const isAuthError = err.code === 'EAUTH' || err.responseCode === 535 || err.message?.includes('Username and Password not accepted');
    return {
      configured: true,
      connected: false,
      error: isAuthError ? 'SMTP_AUTH_FAILED' : (err.code || 'SMTP_CONNECTION_FAILED'),
      message: isAuthError
        ? 'SMTP authentication failed. If using Gmail, an App Password is required.'
        : err.message
    };
  }
}

/**
 * Diagnostic status helper for health probes.
 */
function getSmtpStatus() {
  const config = getSmtpConfig();
  return {
    configured: config.isConfigured,
    host: config.host,
    port: config.port,
    secure: config.secure,
    from: config.from
  };
}

/**
 * Validates basic email address structure.
 */
function isValidRecipient(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

/**
 * Sends a registration email OTP verification code to activate a new account.
 * Follows strict security: never logs plaintext OTP or password.
 *
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.fullName - Recipient full name
 * @param {string} params.otpCode - 6-digit numeric OTP code
 * @param {string} [params.requestId] - Telemetry correlation ID
 * @param {Object} [params.transporterOverride] - Optional test transporter
 */
async function sendRegistrationOtpEmail({ toEmail, fullName, otpCode, requestId = 'req-local', transporterOverride = null }) {
  const config = getSmtpConfig();
  const transporter = transporterOverride || createTransporter();

  // 1. Recipient Validation
  if (!isValidRecipient(toEmail)) {
    console.error(`[Email Service] ❌ [${requestId}] Invalid recipient email format: ${toEmail}`);
    return {
      sent: false,
      error: 'INVALID_RECIPIENT',
      userMessage: 'The provided email address is invalid. Please enter a valid email address.'
    };
  }

  // 2. Transporter / SMTP Configuration Check
  if (!transporter) {
    console.warn(`[Email Service] ⚠️  [${requestId}] SMTP_USER / SMTP_PASS not configured in backend/.env. Delivery aborted.`);
    return {
      sent: false,
      reason: 'SMTP_UNCONFIGURED',
      error: 'SMTP_NOT_CONFIGURED',
      userMessage: 'Email delivery service is currently not configured. Please configure SMTP credentials in .env to receive verification codes.'
    };
  }

  const fromAddress = config.from;
  const safeName = (fullName || 'Singer').replace(/<[^>]*>/g, '').trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>No Tre(ou)ble - Verify your account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F5FF; margin: 0; padding: 24px; color: #191B35; }
        .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08); border: 1px solid #EAE5F3; }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #0D9488 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; opacity: 0.92; font-size: 14px; font-weight: 500; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #191B35; margin-bottom: 12px; }
        .text { font-size: 15px; color: #524B6B; line-height: 1.6; margin-bottom: 22px; }
        .otp-box { background: #F4EFFF; border: 2px dashed #7C3AED; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #7C3AED; margin: 0; }
        .otp-validity { font-size: 13px; color: #77728A; margin-top: 8px; font-weight: 600; }
        .warning { font-size: 13px; color: #8F8AA0; line-height: 1.5; border-top: 1px solid #F0ECF8; padding-top: 18px; margin-top: 22px; }
        .footer { background: #FAF8FF; padding: 18px; text-align: center; font-size: 12px; color: #9A95AA; border-top: 1px solid #EAE5F3; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>No Tre(ou)ble</h1>
          <p>Breathe Better. Sing Better.</p>
        </div>
        <div class="content">
          <div class="greeting">Welcome, ${safeName}! 🎵</div>
          <p class="text">
            Thank you for registering with No Tre(ou)ble. Please enter the 6-digit verification code below to verify your email address and activate your student account:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-validity">⏱️ Valid for 5 minutes</div>
          </div>
          <p class="text">
            Enter this code on the registration verification screen in your browser. This code is single-use and will expire in 5 minutes.
          </p>
          <div class="warning">
            If you did not initiate this registration, please ignore this email. No account will be activated without this verification code.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} No Tre(ou)ble · Breath Management Portal
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Verify your No Tre(ou)ble account',
      text: `Hello ${safeName},\n\nYour No Tre(ou)ble verification code is: ${otpCode}.\n\nThis single-use code is valid for 5 minutes.\n\nIf you did not initiate this registration, please ignore this email.`,
      html: htmlContent
    });

    if (info.rejected && info.rejected.length > 0) {
      console.error(`[Email Service] ❌ [${requestId}] Recipient rejected by SMTP server: ${info.rejected.join(', ')}`);
      return {
        sent: false,
        error: 'RECIPIENT_REJECTED',
        userMessage: 'The mail server rejected delivery to this email address.'
      };
    }

    console.log(`[Email Service] ✅ [${requestId}] Registration OTP successfully dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId,
      accepted: info.accepted
    };
  } catch (error) {
    const isAuth = error.code === 'EAUTH' || error.responseCode === 535 || error.message?.includes('Username and Password not accepted');
    const isTimeout = error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT';
    const isBadAddress = error.code === 'EENVELOPE' || error.responseCode === 550;

    console.error(`[Email Service] ❌ [${requestId}] SMTP dispatch failure to ${toEmail}: ${error.code || 'UNKNOWN'} - ${error.message}`);

    let userMessage = 'We were unable to deliver the verification code to your email. Please verify your email address and try again.';
    if (isAuth) {
      userMessage = 'Mail server authentication failed. Please contact the administrator or verify SMTP settings.';
    } else if (isTimeout) {
      userMessage = 'Mail server timed out. Please try resending in a few moments.';
    } else if (isBadAddress) {
      userMessage = 'The provided email address could not be reached by the mail server.';
    }

    return {
      sent: false,
      error: error.message,
      code: error.code || 'SMTP_DELIVERY_FAILED',
      userMessage
    };
  }
}

/**
 * Sends a password reset OTP verification email.
 * Follows strict security: never logs plaintext OTP or password.
 */
async function sendPasswordResetOtpEmail({ toEmail, username, otpCode, requestId = 'req-local', transporterOverride = null }) {
  const config = getSmtpConfig();
  const transporter = transporterOverride || createTransporter();

  if (!isValidRecipient(toEmail)) {
    console.error(`[Email Service] ❌ [${requestId}] Invalid recipient for password reset: ${toEmail}`);
    return {
      sent: false,
      error: 'INVALID_RECIPIENT',
      userMessage: 'Invalid email address provided.'
    };
  }

  if (!transporter) {
    console.warn(`[Email Service] ⚠️  [${requestId}] SMTP_USER / SMTP_PASS not configured in backend/.env. Password reset email aborted.`);
    return {
      sent: false,
      reason: 'SMTP_UNCONFIGURED',
      error: 'SMTP_NOT_CONFIGURED',
      userMessage: 'Email delivery service is currently not configured. Please contact support to reset your password.'
    };
  }

  const fromAddress = config.from;
  const safeName = (username || 'Singer').replace(/<[^>]*>/g, '').trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>No Tre(ou)ble - Password Reset Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F5FF; margin: 0; padding: 24px; color: #191B35; }
        .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08); border: 1px solid #EAE5F3; }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #0D9488 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .header p { margin: 6px 0 0; opacity: 0.92; font-size: 14px; font-weight: 500; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #191B35; margin-bottom: 12px; }
        .text { font-size: 15px; color: #524B6B; line-height: 1.6; margin-bottom: 22px; }
        .otp-box { background: #F4EFFF; border: 2px dashed #7C3AED; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #7C3AED; margin: 0; }
        .otp-validity { font-size: 13px; color: #77728A; margin-top: 8px; font-weight: 600; }
        .warning { font-size: 13px; color: #8F8AA0; line-height: 1.5; border-top: 1px solid #F0ECF8; padding-top: 18px; margin-top: 22px; }
        .footer { background: #FAF8FF; padding: 18px; text-align: center; font-size: 12px; color: #9A95AA; border-top: 1px solid #EAE5F3; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>No Tre(ou)ble</h1>
          <p>Breathe Better. Sing Better.</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${safeName},</div>
          <p class="text">
            We received a request to reset your password for your No Tre(ou)ble account. Enter the 6-digit verification code below to verify your identity and set a new password:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-validity">⏱️ Valid for 10 minutes</div>
          </div>
          <p class="text">
            Enter this code on the password reset window in your browser. Do not share this code with anyone.
          </p>
          <div class="warning">
            If you did not request this password reset, please ignore this email. Your existing password remains secure and unchanged.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} No Tre(ou)ble · Breath Management Portal
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `${otpCode} is your No Tre(ou)ble verification code`,
      text: `Hello ${safeName},\n\nYour No Tre(ou)ble password reset code is: ${otpCode}.\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this message.`,
      html: htmlContent
    });

    if (info.rejected && info.rejected.length > 0) {
      console.error(`[Email Service] ❌ [${requestId}] Password reset recipient rejected: ${info.rejected.join(', ')}`);
      return {
        sent: false,
        error: 'RECIPIENT_REJECTED',
        userMessage: 'The mail server rejected delivery to this email address.'
      };
    }

    console.log(`[Email Service] ✅ [${requestId}] Password reset email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId,
      accepted: info.accepted
    };
  } catch (error) {
    console.error(`[Email Service] ❌ [${requestId}] Failed to dispatch password reset email to ${toEmail}: ${error.message}`);
    return {
      sent: false,
      error: error.message,
      code: error.code || 'SMTP_DELIVERY_FAILED',
      userMessage: 'Unable to deliver password reset email. Please try again or contact support.'
    };
  }
}

module.exports = {
  createTransporter,
  getSmtpConfig,
  getSmtpStatus,
  verifySmtpConnection,
  sendRegistrationOtpEmail,
  sendPasswordResetOtpEmail
};
