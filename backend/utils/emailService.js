const nodemailer = require('nodemailer');

/**
 * Creates and configures the nodemailer transporter.
 * Supports Gmail SMTP directly or custom SMTP hosts.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !rawPass) {
    return null;
  }

  const cleanUser = user.trim();
  // Strip spaces from Google App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const cleanPass = rawPass.trim().replace(/\s+/g, '');

  // If host is Gmail, nodemailer's built-in 'gmail' service is fastest and most reliable
  if (host.toLowerCase().includes('gmail') || cleanUser.toLowerCase().includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass
      }
    });
  }

  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: cleanUser,
      pass: cleanPass
    }
  });
}

/**
 * Sends a password reset OTP verification email.
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.username - Recipient username
 * @param {string} params.otpCode - 6-digit numeric OTP code
 */
async function sendPasswordResetOtpEmail({ toEmail, username, otpCode }) {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"No Tre(ou)ble" <${process.env.SMTP_USER}>` : '"No Tre(ou)ble" <support@notreouble.com>');

  console.log(`[Email Service] ✉️  Password Reset OTP for ${toEmail}: [${otpCode}]`);

  if (!transporter) {
    console.warn('[Email Service] ⚠️  SMTP_USER / SMTP_PASS not configured in .env. Email logged to console.');
    return {
      sent: false,
      reason: 'SMTP_UNCONFIGURED',
      otpCode
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
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
          <div class="greeting">Hello ${username || 'Singer'},</div>
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
      text: `Hello ${username || 'Singer'},\n\nYour No Tre(ou)ble password reset code is: ${otpCode}.\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this message.`,
      html: htmlContent
    });
    console.log(`[Email Service] ✅ Email delivered to ${toEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[Email Service] ❌ Failed to dispatch email to ${toEmail}:`, error.message);
    return {
      sent: false,
      error: error.message,
      otpCode
    };
  }
}

/**
 * Sends a registration email OTP verification code to activate a new account.
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.fullName - Recipient full name
 * @param {string} params.otpCode - 6-digit numeric OTP code
 */
async function sendRegistrationOtpEmail({ toEmail, fullName, otpCode }) {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"No Tre(ou)ble" <${process.env.SMTP_USER}>` : '"No Tre(ou)ble" <support@notreouble.com>');

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Email Service] ✉️  Registration OTP for ${toEmail}: [${otpCode}]`);
  } else {
    console.log(`[Email Service] ✉️  Registration OTP dispatched to ${toEmail}`);
  }

  if (!transporter) {
    console.warn('[Email Service] ⚠️  SMTP_USER / SMTP_PASS not configured in .env. Email fallback active.');
    return {
      sent: false,
      reason: 'SMTP_UNCONFIGURED',
      otpCode
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>No Tre(ou)ble - Verify Your Email Address</title>
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
          <div class="greeting">Welcome, ${fullName || 'Singer'}! 🎵</div>
          <p class="text">
            Thank you for registering with No Tre(ou)ble. Please enter the 6-digit verification code below to verify your email address and activate your student account:
          </p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-validity">⏱️ Valid for 5 minutes</div>
          </div>
          <p class="text">
            Enter this code on the registration page in your browser. This code is single-use and will expire in 5 minutes.
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
      subject: `${otpCode} is your No Tre(ou)ble registration verification code`,
      text: `Hello ${fullName || 'Singer'},\n\nYour No Tre(ou)ble email verification code is: ${otpCode}.\n\nThis code is valid for 5 minutes.\n\nIf you did not initiate this registration, please ignore this email.`,
      html: htmlContent
    });
    console.log(`[Email Service] ✅ Registration OTP delivered to ${toEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[Email Service] ❌ Failed to dispatch registration OTP to ${toEmail}:`, error.message);
    return {
      sent: false,
      error: error.message,
      otpCode
    };
  }
}

module.exports = {
  sendPasswordResetOtpEmail,
  sendRegistrationOtpEmail
};
