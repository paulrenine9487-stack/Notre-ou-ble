const assert = require('assert');

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('\n======================================================');
  console.log('TESTING DIRECT REGISTRATION & LOGIN WORKFLOW (NO OTP)');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const testStudent = {
    full_name: 'Direct Student Chloe',
    gender: 'Female',
    email: `direct_student_${timestamp}@notreouble.test`,
    password: 'Password@123',
    confirm_password: 'Password@123',
    types_of_music: ['Carnatic Music', 'Western Pop'],
    vocal_trainer_name: 'Trainer Maria',
    selected_musical_goal: 'Develop steady vibrato'
  };

  // Test 1: Check Email Availability on brand new email
  console.log('1. Checking email availability for new email...');
  const checkRes1 = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(testStudent.email)}`);
  const checkJson1 = await checkRes1.json();
  console.log('   Response:', checkJson1);
  assert.strictEqual(checkRes1.status, 200, 'Check email returns 200');
  assert.strictEqual(checkJson1.available, true, 'Email is available');

  // Test 2: Register user directly without OTP
  console.log('\n2. Registering new student (direct creation, no OTP dispatch)...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent)
  });
  const regJson = await regRes.json();
  console.log('   Status:', regRes.status);
  console.log('   Response:', regJson);
  assert.strictEqual(regRes.status, 201, 'Registration returns 201 Created');
  assert.strictEqual(regJson.success, true, 'Registration success is true');
  assert.strictEqual(regJson.requireOtp, undefined, 'requireOtp is not present');
  assert.strictEqual(regJson.user.email, testStudent.email, 'User email matches');
  assert.strictEqual(regJson.user.is_email_verified, 1, 'User is immediately email verified');

  // Test 3: Check Email Availability on now-registered email
  console.log('\n3. Checking email availability for now-registered email...');
  const checkRes2 = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(testStudent.email)}`);
  const checkJson2 = await checkRes2.json();
  console.log('   Response:', checkJson2);
  assert.strictEqual(checkRes2.status, 200, 'Check email returns 200');
  assert.strictEqual(checkJson2.available, false, 'Email is not available');
  assert.strictEqual(checkJson2.code, 'EMAIL_ALREADY_REGISTERED', 'Returns EMAIL_ALREADY_REGISTERED');

  // Test 4: Duplicate registration returns 409 Conflict
  console.log('\n4. Attempting duplicate registration (should return 409 Conflict)...');
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent)
  });
  const dupJson = await dupRes.json();
  console.log('   Status:', dupRes.status);
  console.log('   Response:', dupJson);
  assert.strictEqual(dupRes.status, 409, 'Duplicate registration returns 409 Conflict');
  assert.strictEqual(dupJson.code, 'EMAIL_ALREADY_REGISTERED', 'Conflict code matches');

  // Test 5: Immediate login with newly registered student
  console.log('\n5. Logging in with newly registered student...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testStudent.email,
      password: testStudent.password
    })
  });
  const loginJson = await loginRes.json();
  console.log('   Status:', loginRes.status);
  console.log('   Login User:', loginJson.user);
  assert.strictEqual(loginRes.status, 200, 'Login returns 200 OK');
  assert.strictEqual(loginJson.success, true, 'Login success is true');
  assert.ok(loginJson.token, 'Token returned on login');

  // Test 6: Verify /api/auth/me session with the token
  console.log('\n6. Fetching /api/auth/me with auth token...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${loginJson.token}`
    }
  });
  const meJson = await meRes.json();
  console.log('   Status:', meRes.status);
  console.log('   Current User:', meJson.user);
  assert.strictEqual(meRes.status, 200, '/api/auth/me returns 200 OK');
  assert.strictEqual(meJson.user.email, testStudent.email, 'Current user email matches');

  // Test 7: Verify backwards-compatible OTP endpoints return graceful success
  console.log('\n7. Checking backwards-compatible OTP endpoints...');
  const otpRes = await fetch(`${BASE_URL}/auth/verify-email-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testStudent.email, otp: '123456' })
  });
  const otpJson = await otpRes.json();
  assert.strictEqual(otpRes.status, 200, 'verify-email-otp returns 200 OK');
  assert.strictEqual(otpJson.success, true, 'verify-email-otp success is true');

  console.log('\n======================================================');
  console.log('ALL DIRECT REGISTRATION & LOGIN TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
