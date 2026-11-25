/**
 * AUTOMATED TEST SUITE: NO TRE(OU)BLE REGISTRATION UPDATE, VALIDATION & EMAIL OTP
 * Comprehensive test runner verifying:
 * - Phase 2: Phone number removal
 * - Phase 3: Full Name strong validation
 * - Phase 4: Email validation and duplicate handling
 * - Phase 5: Email OTP generation, hashing, rate-limiting & activation
 * - Phase 6: Strong Password validation
 * - Phase 7: Confirm Password validation
 * - Phase 8: Preservation of Gender, Music Types, Trainer Name
 * - Phase 10: API compatibility & login verification gates
 * - Phase 11: Existing user preservation & backwards compatibility
 */

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const authCtrl = require('../controllers/authController');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

// Mock request / response helper
function createMockReqRes(body = {}, params = {}, headers = {}) {
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };
  const req = {
    body,
    params,
    headers,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    get: (h) => headers[h]
  };
  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData
  };
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING REGISTRATION, VALIDATION & EMAIL OTP TEST SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testEmail = `newstudent_${timestamp}@notreouble.test`;
  let testUserId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: FULL NAME VALIDATION
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Full Name Validation ---');
    {
      // 1.1 Empty name
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: '',
        gender: 'Female',
        email: `fn1_${timestamp}@test.com`,
        types_of_music: ['Carnatic Music'],
        password: 'Password123!',
        confirm_password: 'Password123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400, 'Empty Full Name returns 400 Bad Request');
      assert(getData().message === 'Full Name is required.', 'Returns "Full Name is required."');
    }

    {
      // 1.2 Too short (< 3 chars)
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Al',
        gender: 'Male',
        email: `fn2_${timestamp}@test.com`,
        types_of_music: ['Western Pop'],
        password: 'Password123!',
        confirm_password: 'Password123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400, 'Name with < 3 characters returns 400 Bad Request');
      assert(getData().message.includes('at least 3 characters'), 'Returns minimum 3 characters error');
    }

    {
      // 1.3 Too long (> 50 chars)
      const longName = 'A'.repeat(51);
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: longName,
        gender: 'Male',
        email: `fn3_${timestamp}@test.com`,
        types_of_music: ['Western Pop'],
        password: 'Password123!',
        confirm_password: 'Password123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400, 'Name with > 50 characters returns 400 Bad Request');
      assert(getData().message.includes('cannot exceed 50 characters'), 'Returns max 50 characters error');
    }

    {
      // 1.4 Contains numbers
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'John Doe 99',
        gender: 'Male',
        email: `fn4_${timestamp}@test.com`,
        types_of_music: ['Western Pop'],
        password: 'Password123!',
        confirm_password: 'Password123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400, 'Name with numbers is rejected with 400 Bad Request');
      assert(getData().message.includes('cannot contain numbers') || getData().message.includes('valid full name'), 'Returns numbers not allowed error');
    }

    {
      // 1.5 Valid hyphen, apostrophe and Unicode characters
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: "Renée O'Connor-Smith",
        gender: 'Female',
        email: `fn5_${timestamp}@test.com`,
        types_of_music: ['Western Classical'],
        password: 'Password123!',
        confirm_password: 'Password123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 201, 'Name with hyphens, apostrophes and accents accepted (201 Created)');
      // Cleanup this quick check
      await pool.query('DELETE FROM users WHERE email = ?', [`fn5_${timestamp}@test.com`]);
    }

    // -------------------------------------------------------------------------
    // TEST 2: PASSWORD VALIDATION & CONFIRM PASSWORD
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Password & Confirm Password Validation ---');
    {
      // Missing uppercase
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Valid Singer',
        gender: 'Male',
        email: `pw1_${timestamp}@test.com`,
        types_of_music: ['Carnatic Music'],
        password: 'password123!',
        confirm_password: 'password123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400 && getData().message.includes('uppercase'), 'Missing uppercase letter rejected');
    }

    {
      // Missing lowercase
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Valid Singer',
        gender: 'Male',
        email: `pw2_${timestamp}@test.com`,
        types_of_music: ['Carnatic Music'],
        password: 'PASSWORD123!',
        confirm_password: 'PASSWORD123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400 && getData().message.includes('lowercase'), 'Missing lowercase letter rejected');
    }

    {
      // Missing number
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Valid Singer',
        gender: 'Male',
        email: `pw3_${timestamp}@test.com`,
        types_of_music: ['Carnatic Music'],
        password: 'PasswordSecret!',
        confirm_password: 'PasswordSecret!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400 && getData().message.includes('number'), 'Missing number rejected');
    }

    {
      // Missing special character
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Valid Singer',
        gender: 'Male',
        email: `pw4_${timestamp}@test.com`,
        types_of_music: ['Carnatic Music'],
        password: 'Password1234',
        confirm_password: 'Password1234'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400 && getData().message.includes('special character'), 'Missing special character rejected');
    }

    {
      // Mismatched confirm password
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Valid Singer',
        gender: 'Male',
        email: `pw5_${timestamp}@test.com`,
        types_of_music: ['Carnatic Music'],
        password: 'Password123!',
        confirm_password: 'DifferentPassword123!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 400 && getData().message === 'Passwords do not match.', 'Password mismatch rejected with "Passwords do not match."');
    }

    // -------------------------------------------------------------------------
    // TEST 3: VALID REGISTRATION WITHOUT PHONE NUMBER & OTP CREATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Valid Registration (No Phone Number, Pending Account & OTP) ---');
    {
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Aria Montgomery',
        gender: 'Female',
        email: testEmail,
        // Notice: NO phone number sent!
        types_of_music: ['Carnatic Music', 'Playback Singing'],
        vocal_trainer_name: 'Guru Krishnan',
        password: 'StrongPassword2026!',
        confirm_password: 'StrongPassword2026!'
      });

      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 201, 'Registration returns 201 Created without phone number');
      assert(getData().success === true, 'Response success is true');
      assert(getData().requireOtp === true, 'Response requires OTP verification');
      assert(getData().email === testEmail.toLowerCase(), 'Response returns normalized email');
      testUserId = getData().userId;

      // Verify database record
      const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [testEmail.toLowerCase()]);
      assert(userRows.length === 1, 'User record created in MySQL users table');
      assert(userRows[0].username === 'Aria Montgomery', 'Full Name stored in users.username');
      assert(userRows[0].phone === null, 'Phone column is NULL in database for new account');
      assert(userRows[0].vocal_trainer_name === 'Guru Krishnan', 'Optional Vocal Trainer Name preserved');
      assert(userRows[0].is_email_verified === 0, 'New user is initially unverified (is_email_verified = 0)');

      // Verify OTP in email_verification_otps
      const [otpRows] = await pool.query(
        'SELECT * FROM email_verification_otps WHERE LOWER(email) = ? AND is_used = 0',
        [testEmail.toLowerCase()]
      );
      assert(otpRows.length === 1, 'Single active OTP record created in email_verification_otps');
      assert(otpRows[0].otp_hash && otpRows[0].otp_hash.startsWith('$2'), 'OTP is hashed with bcrypt ($2a/$2b), never stored plaintext');
      assert(new Date(otpRows[0].expires_at) > new Date(), 'OTP expires in future (5-minute window)');
    }

    // -------------------------------------------------------------------------
    // TEST 4: LOGIN BLOCKED BEFORE EMAIL VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Login Blocked Before Email Verification ---');
    {
      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail,
        password: 'StrongPassword2026!'
      });
      await authCtrl.login(req, res, () => {});
      assert(getStatus() === 403, 'Unverified user login rejected with 403 Forbidden');
      assert(getData().emailUnverified === true, 'Response contains emailUnverified flag');
      assert(getData().message.includes('not verified yet'), 'Helpful message to enter verification code');
    }

    // -------------------------------------------------------------------------
    // TEST 5: DUPLICATE EMAIL CHECK & CASE INSENSITIVITY
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Duplicate Email Check ---');
    {
      // If student tries to register again while pending, it allows continuation / fresh OTP without duplicate error
      const { req, res, getStatus, getData } = createMockReqRes({
        full_name: 'Aria Montgomery',
        gender: 'Female',
        email: testEmail.toUpperCase(), // Case insensitive
        types_of_music: ['Playback Singing'],
        password: 'StrongPassword2026!',
        confirm_password: 'StrongPassword2026!'
      });
      await authCtrl.register(req, res, () => {});
      assert(getStatus() === 201, 'Pending registration re-submission updates record and returns 201 Created');
      assert(getData().requireOtp === true, 'Dispatches fresh OTP');
    }

    // -------------------------------------------------------------------------
    // TEST 6: OTP VERIFICATION SECURITY (Incorrect Code, Attempt Limits, Expiry)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: OTP Verification Security & Rate Limiting ---');
    {
      // 6.1 Invalid code length
      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail,
        otp: '123'
      });
      await authCtrl.verifyEmailOtp(req, res, () => {});
      assert(getStatus() === 400, 'Invalid length OTP rejected with 400 Bad Request');
      assert(getData().message.includes('6 digits'), 'Informs user code must be 6 digits');
    }

    {
      // 6.2 Wrong OTP code attempt
      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail,
        otp: '000000'
      });
      await authCtrl.verifyEmailOtp(req, res, () => {});
      assert(getStatus() === 400, 'Wrong OTP code rejected with 400 Bad Request');
      assert(getData().message.includes('Invalid verification code'), 'Returns invalid code message');

      const [otpRows] = await pool.query(
        'SELECT attempts FROM email_verification_otps WHERE LOWER(email) = ? AND is_used = 0',
        [testEmail.toLowerCase()]
      );
      assert(otpRows[0].attempts === 1, 'Failed attempts incremented to 1 in database');
    }

    // -------------------------------------------------------------------------
    // TEST 7: RESEND OTP & COOLDOWN
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Resend OTP & Cooldown ---');
    {
      // Try resending immediately (under 30s) -> should be rate limited
      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail
      });
      await authCtrl.resendRegistrationOtp(req, res, () => {});
      assert(getStatus() === 429, 'Immediate OTP resend rate-limited with 429');
      assert(getData().message.includes('30 seconds'), 'Cooldown notice displayed');
    }

    // -------------------------------------------------------------------------
    // TEST 8: SUCCESSFUL OTP VERIFICATION & ACCOUNT ACTIVATION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Successful OTP Verification & Account Activation ---');
    {
      // We will create a known test OTP for this test user
      const knownOtp = '789123';
      const knownHash = await bcrypt.hash(knownOtp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await pool.query(
        'UPDATE email_verification_otps SET is_used = 1 WHERE LOWER(email) = ?',
        [testEmail.toLowerCase()]
      );
      await pool.query(
        `INSERT INTO email_verification_otps (user_id, email, otp_hash, attempts, max_attempts, is_used, expires_at)
         VALUES (?, ?, ?, 0, 5, 0, ?)`,
        [testUserId, testEmail.toLowerCase(), knownHash, expiresAt]
      );

      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail,
        otp: knownOtp
      });
      await authCtrl.verifyEmailOtp(req, res, () => {});
      assert(getStatus() === 200, 'Correct OTP returns 200 OK');
      assert(getData().success === true, 'Verification response success is true');

      // Verify user is now active in database
      const [userRows] = await pool.query('SELECT is_email_verified, email_verified_at FROM users WHERE email = ?', [testEmail.toLowerCase()]);
      assert(userRows[0].is_email_verified === 1, 'User is_email_verified updated to 1');
      assert(userRows[0].email_verified_at !== null, 'email_verified_at timestamp is populated');

      // Verify OTP is marked used
      const [otpRows] = await pool.query(
        'SELECT is_used FROM email_verification_otps WHERE LOWER(email) = ? AND otp_hash = ?',
        [testEmail.toLowerCase(), knownHash]
      );
      assert(otpRows[0].is_used === 1, 'OTP is marked as used (single-use enforcement)');
    }

    // -------------------------------------------------------------------------
    // TEST 9: REUSED OTP REJECTION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Reused OTP Rejection ---');
    {
      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail,
        otp: '789123'
      });
      await authCtrl.verifyEmailOtp(req, res, () => {});
      assert(getStatus() === 400, 'Reused OTP is rejected with 400 Bad Request');
    }

    // -------------------------------------------------------------------------
    // TEST 10: LOGIN AFTER VERIFICATION & VERIFIED DUPLICATE REJECTION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: Login After Verification & Duplicate Rejection ---');
    {
      // 10.1 Login succeeds
      const { req, res, getStatus, getData } = createMockReqRes({
        email: testEmail,
        password: 'StrongPassword2026!'
      });
      await authCtrl.login(req, res, () => {});
      assert(getStatus() === 200, 'Verified user login succeeds with 200 OK');
      assert(getData().token || getData().accessToken, 'JWT access token is granted');

      // 10.2 Registering again with verified email rejected with 409 Conflict
      const { req: regReq, res: regRes, getStatus: getRegStatus, getData: getRegData } = createMockReqRes({
        full_name: 'Aria Montgomery',
        gender: 'Female',
        email: testEmail,
        types_of_music: ['Carnatic Music'],
        password: 'StrongPassword2026!',
        confirm_password: 'StrongPassword2026!'
      });
      await authCtrl.register(regReq, regRes, () => {});
      assert(getRegStatus() === 409, 'Duplicate registration for verified email returns 409 Conflict');
      assert(getRegData().message === 'This email address is already registered. Please log in.', 'Helpful duplicate login prompt returned');
    }

    // -------------------------------------------------------------------------
    // TEST 11: EXISTING USERS PRESERVATION & DASHBOARD API
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Existing Users Preservation & Backwards Compatibility ---');
    {
      // User 3 (Renin)
      const [reninRows] = await pool.query('SELECT id, username, email, phone, role, is_email_verified FROM users WHERE id = 3');
      assert(reninRows.length === 1, 'Existing student Renin (ID 3) exists');
      assert(reninRows[0].phone === '6381420141', 'Existing phone number preserved');
      assert(reninRows[0].is_email_verified === 1, 'Existing user email remains verified');

      // Superadmin & Admin
      const [admins] = await pool.query("SELECT username, role, is_email_verified FROM users WHERE role IN ('ADMIN', 'SUPERADMIN')");
      assert(admins.length >= 2, 'Admin and Superadmin accounts intact');
      assert(admins.every(a => a.is_email_verified === 1), 'All admin accounts remain verified');
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    failedTests++;
  } finally {
    // CLEANUP
    if (testUserId) {
      await pool.query('DELETE FROM email_verification_otps WHERE user_id = ? OR email = ?', [testUserId, testEmail.toLowerCase()]);
      await pool.query('DELETE FROM user_music_preferences WHERE user_id = ?', [testUserId]);
      await pool.query('DELETE FROM user_practice_goals WHERE user_id = ?', [testUserId]);
      await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
      console.log('\nCleaned up test registration records from MySQL.');
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
