const crypto = require('crypto');

// RFC 4648 Base32 alphabet
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32Str) {
  const clean = base32Str.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates an RFC 6238 TOTP token for a given Base32 secret and counter.
 */
function generateHOTP(secretBuffer, counter) {
  const counterBuffer = Buffer.alloc(8);
  // Write counter as 64-bit big endian integer
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226 section 5.4)
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Generate a new random Base32 secret (20 bytes = 160 bits recommended by RFC 4226).
 */
function generateSecret(lengthBytes = 20) {
  const buffer = crypto.randomBytes(lengthBytes);
  return base32Encode(buffer);
}

/**
 * Generates the current 6-digit TOTP code for a Base32 secret.
 */
function generateTotp(secret, stepSeconds = 30) {
  const secretBuffer = base32Decode(secret);
  const currentCounter = Math.floor(Date.now() / 1000 / stepSeconds);
  return generateHOTP(secretBuffer, currentCounter);
}

/**
 * Verifies a 6-digit TOTP code against a secret.
 * Allows a drift of +/- 1 time step (30 seconds) to account for slight client clock skew.
 */
function verifyTotp(secret, token, window = 1, stepSeconds = 30) {
  if (!secret || !token) return false;
  const cleanToken = String(token).trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const secretBuffer = base32Decode(secret);
  if (secretBuffer.length === 0) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / stepSeconds);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const calculated = generateHOTP(secretBuffer, currentCounter + errorWindow);
    // Constant-time comparison to prevent timing attacks
    if (crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(cleanToken))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates standard OTPAuth URL for QR code generation.
 */
function getOtpAuthUrl(secret, username, issuer = 'No Tre(ou)ble') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedUser = encodeURIComponent(username);
  return `otpauth://totp/${encodedIssuer}:${encodedUser}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates 8 cryptographically secure single-use backup codes.
 * Returns both raw codes (to show once to the user) and hashed codes (to store in MySQL).
 */
function generateBackupCodes(count = 8) {
  const rawCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A8F19B2C"
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`; // e.g. "A8F1-9B2C"
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    rawCodes.push(formatted);
    hashedCodes.push({ hash, used: false, createdAt: new Date().toISOString() });
  }

  return { rawCodes, hashedCodes };
}

/**
 * Verifies and redeems a single-use backup code.
 */
function verifyAndRedeemBackupCode(backupCodesArray, submittedCode) {
  if (!Array.isArray(backupCodesArray) || !submittedCode) return { valid: false, updatedCodes: backupCodesArray };
  const clean = String(submittedCode).replace(/[\s-]/g, '').toUpperCase();
  const submittedHash = crypto.createHash('sha256').update(clean).digest('hex');

  let valid = false;
  const updatedCodes = backupCodesArray.map(item => {
    if (!item.used && item.hash === submittedHash) {
      valid = true;
      return { ...item, used: true, usedAt: new Date().toISOString() };
    }
    return item;
  });

  return { valid, updatedCodes };
}

module.exports = {
  generateSecret,
  generateTotp,
  verifyTotp,
  getOtpAuthUrl,
  generateBackupCodes,
  verifyAndRedeemBackupCode
};

