/**
 * No Tre(ou)ble Cybersecurity Hardening Verification Suite
 * Tests OWASP ASVS 5.0 Level 2 controls, Zero Trust Access, Anti-IDOR, MFA & Binary Validation
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = require('../config/db');
const app = require('../server');
const totpService = require('../utils/totpService');

let server;
let baseUrl;

function request(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let postData = null;
    if (body) {
      if (typeof body === 'object' && !(body instanceof Buffer)) {
        postData = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      } else {
        postData = body;
        options.headers['Content-Length'] = Buffer.isBuffer(postData) ? postData.length : Buffer.byteLength(postData);
      }
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Multipart helper for upload testing
function requestMultipart(endpoint, headers = {}, boundary, buffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        ...headers,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': buffer.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('   NO TRE(OU)BLE ZERO TRUST CYBERSECURITY VERIFICATION SUITE   ');
  console.log('=============================================================\n');

  // Start test server on random high port
  const testPort = 5998;
  await new Promise((res) => {
    server = app.listen(testPort, () => {
      baseUrl = `http://127.0.0.1:${testPort}`;
      console.log(`[Test Runner] Test server listening on ${baseUrl}`);
      res();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // 1. HEALTH CHECK & SECURITY HEADERS
    console.log('\n--- 1. HTTP Security Headers (OWASP ASVS L2 / Helmet) ---');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'Health endpoint responds 200 OK');
    assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN' || healthRes.headers['content-security-policy']?.includes("frame-ancestors 'self'"), 'Clickjacking protection present (CSP frame-ancestors or X-Frame-Options)');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'MIME sniffing prevention (X-Content-Type-Options: nosniff)');

    // 2. PUBLIC UPLOADS REMOVAL TEST
    console.log('\n--- 2. Direct Static Storage Isolation ---');
    const directUploadRes = await request('GET', '/uploads/audio-u3-tgeneral-1795186504176-760058680.mp3');
    const isDirectlyExposed = directUploadRes.status === 200 && directUploadRes.headers['content-type']?.includes('audio');
    assert(!isDirectlyExposed, 'Unauthenticated static access to /uploads is blocked');

    // 3. UNAUTHENTICATED AUDIO STREAMING TEST
    console.log('\n--- 3. Media Streaming Authentication Verification ---');
    const unauthAudio = await request('GET', '/api/learning/recordings/20/audio');
    assert(unauthAudio.status === 401, 'Unauthenticated request to recording audio is rejected with 401');

    const spoofedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5LCJyb2xlIjoiVVNFUiJ9.fakeSignature';
    const fakeAuthAudio = await request('GET', '/api/learning/recordings/20/audio', {
      Authorization: `Bearer ${spoofedToken}`
    });
    assert(fakeAuthAudio.status === 403, 'Invalid/forged JWT token is rejected with 403 Forbidden');

    // 4. IDOR / BOLA CROSS-STUDENT PROTECTION TEST
    console.log('\n--- 4. IDOR / BOLA Cross-Student Media Protection ---');
    const jwtSecret = process.env.JWT_SECRET || 'resonova_jwt_secret_key_2026';
    
    // Create an authentic secondary student in DB to test cross-tenant IDOR
    const [attIns] = await pool.query(
      'INSERT INTO users (username, gender, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['idor_tester_' + Date.now(), 'Other', 'idor_student_' + Date.now() + '@test.com', '1234567890', 'dummy_hash', 'USER']
    );
    const attackerUserId = attIns.insertId;

    // Attacker token (Student B)
    const attackerToken = jwt.sign(
      { id: attackerUserId, email: 'idor_student@test.com', role: 'USER', isChallenge: false },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Victim / Owner token (Student ID 3)
    const ownerToken = jwt.sign(
      { id: 3, email: 'paulrenine9487@gmail.com', role: 'USER', isChallenge: false },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const idorRes = await request('GET', '/api/learning/recordings/20/audio', {
      Authorization: `Bearer ${attackerToken}`
    });
    assert(idorRes.status === 403, 'Cross-student audio access attempt (IDOR) is rejected with 403 Forbidden');

    // Clean up temporary student B
    await pool.query('DELETE FROM users WHERE id = ?', [attackerUserId]);

    const ownerRes = await request('GET', '/api/learning/recordings/20/audio', {
      Authorization: `Bearer ${ownerToken}`
    });
    // If the file exists on disk, it returns 200/206 with private headers; if not, 404, but NOT 403
    assert(ownerRes.status !== 403 && ownerRes.status !== 401, 'Owner is granted authorized media access permission (status: ' + ownerRes.status + ')');
    if (ownerRes.status === 200 || ownerRes.status === 206) {
      assert(ownerRes.headers['cache-control']?.includes('no-cache'), 'Private audio stream has Cache-Control: private, no-cache');
    }

    // 5. EVALUATIVE TASK SPOOFING DEFENSE
    console.log('\n--- 5. Learning Progress Calculation Integrity ---');
    const spoofProgress = await request('POST', '/api/learning/activity-progress', {
      Authorization: `Bearer ${ownerToken}`
    }, {
      stage_id: 4,
      activity_id: 's4_student_recording',
      timeSpentSeconds: 120
    });
    assert(spoofProgress.status === 403, 'Spoofing evaluative recording task via activity-progress is rejected with 403');

    // 6. MULTI-FACTOR AUTHENTICATION (MFA) WORKFLOW
    console.log('\n--- 6. Multi-Factor Authentication (MFA) for Privileged Roles ---');
    // Student login (direct, frictionless)
    // Note: check student login response
    const studentUser = await pool.query('SELECT * FROM users WHERE id = 3');
    assert(studentUser[0].length > 0, 'Student user exists in database');

    // Admin MFA Challenge test
    const [adminRows] = await pool.query("SELECT * FROM users WHERE role IN ('ADMIN', 'SUPERADMIN') LIMIT 1");
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const setupSecret = totpService.generateSecret();
      const currentTotp = totpService.generateTotp(setupSecret);

      // Set admin MFA secret in DB for testing
      await pool.query(
        'UPDATE users SET mfa_enabled = 1, mfa_secret = ?, failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
        [setupSecret, admin.id]
      );

      // Create an MFA challenge token
      const mfaChallengeToken = jwt.sign(
        { userId: admin.id, id: admin.id, email: admin.email, role: admin.role, purpose: 'MFA_CHALLENGE' },
        jwtSecret,
        { expiresIn: '5m' }
      );

      // Test 6a: Attempting to access admin resource with MFA challenge token must be rejected
      const blockedAdminReq = await request('GET', '/api/admin/users', {
        Authorization: `Bearer ${mfaChallengeToken}`
      });
      assert(blockedAdminReq.status === 401 || blockedAdminReq.status === 403, 'Challenge token cannot access administrative APIs before TOTP verification');

      // Test 6b: Submitting invalid TOTP code
      const invalidMfaRes = await request('POST', '/api/auth/verify-mfa', {}, {
        mfaToken: mfaChallengeToken,
        code: '000000'
      });
      assert(invalidMfaRes.status === 400 || invalidMfaRes.status === 401, 'Invalid TOTP code is rejected');

      // Test 6c: Submitting valid TOTP code
      const validMfaRes = await request('POST', '/api/auth/verify-mfa', {}, {
        mfaToken: mfaChallengeToken,
        code: currentTotp
      });
      assert(validMfaRes.status === 200 && validMfaRes.data.token, 'Valid TOTP code successfully completes MFA and issues full privileged token');
    }

    // 7. BRUTE FORCE PROTECTION & ACCOUNT LOCKOUT
    console.log('\n--- 7. Brute-Force & Credential Stuffing Defense ---');
    const testEmail = 'brutetest_' + Date.now() + '@example.com';
    const testHash = await bcrypt.hash('Password123!', 10);
    const [insertResult] = await pool.query(
      'INSERT INTO users (username, gender, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['brutetest_' + Date.now(), 'Other', testEmail, '1234567890', testHash, 'USER']
    );
    const testUserId = insertResult.insertId;

    let lockedTriggered = false;
    for (let i = 1; i <= 6; i++) {
      const loginAttempt = await request('POST', '/api/auth/login', {}, {
        email: testEmail,
        password: 'WrongPassword' + i
      });
      if (loginAttempt.status === 423) {
        lockedTriggered = true;
        break;
      }
    }
    assert(lockedTriggered, 'Account automatically locked (HTTP 423) after multiple consecutive failed attempts');

    // Clean up test user
    await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);

    // 8. MALICIOUS / CORRUPT FILE UPLOAD DEFENSE (MAGIC BYTE VALIDATION)
    console.log('\n--- 8. Media Upload & Binary Magic Byte Validation ---');
    const boundary = '----WebKitFormBoundarySecurityTest' + Date.now();
    const maliciousPayload = Buffer.from('<?php echo "evil code"; ?>', 'utf-8');
    const headerPart = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="fake_recording.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n`
    );
    const footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([headerPart, maliciousPayload, footerPart]);

    const uploadRes = await requestMultipart('/api/learning/recordings', {
      Authorization: `Bearer ${ownerToken}`
    }, boundary, multipartBody);

    assert(uploadRes.status === 400, 'Non-audio file with spoofed MIME/extension is rejected with 400 Bad Request');

    // 9. SECURITY AUDIT LOGGING VERIFICATION
    console.log('\n--- 9. Security Audit Logging (OWASP ASVS V8) ---');
    const [auditLogs] = await pool.query(
      'SELECT action, status, details FROM security_audit_logs ORDER BY id DESC LIMIT 5'
    );
    assert(auditLogs.length > 0, 'Security events successfully stored in security_audit_logs table');
    console.log(`  [Audit Log Sample] Latest events logged: ${auditLogs.map(l => l.action).join(', ')}`);

    // 10. TOKEN REVOCATION ON LOGOUT
    console.log('\n--- 10. Token Revocation & Secure Logout ---');
    const logoutRes = await request('POST', '/api/auth/logout', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(logoutRes.status === 200, 'Logout endpoint responds 200 OK');

    const reuseRes = await request('GET', '/api/users/profile', {
      Authorization: `Bearer ${ownerToken}`
    });
    assert(reuseRes.status === 401, 'Logged out token is rejected as revoked (HTTP 401)');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    console.log('\n=============================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
