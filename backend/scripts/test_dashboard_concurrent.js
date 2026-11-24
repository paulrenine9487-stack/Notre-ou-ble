async function testDashboard() {
  console.log('Testing /api/dashboard/overview concurrency and resilience...');

  // 1. Authenticate with admin or student credentials
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Smirthi', password: 'smirthi1234' })
  });

  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken;

  if (!token) {
    console.error('Failed to obtain token for testing. Response:', loginData);
    process.exit(1);
  }

  console.log('Obtained JWT token for user Smirthi.');

  // 2. Initial single fetch
  const t0 = Date.now();
  const res1 = await fetch('http://127.0.0.1:5000/api/dashboard/overview', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const latency1 = Date.now() - t0;
  const json1 = await res1.json();

  console.log(`Initial GET /api/dashboard/overview: Status ${res1.status} (${latency1}ms)`);
  if (res1.status !== 200 || !json1.success || !json1.data?.statistics) {
    console.error('Dashboard data invalid:', json1);
    process.exit(1);
  }

  // 3. 10 Concurrent Requests (Burst)
  console.log('\nFiring 10 concurrent requests to /api/dashboard/overview...');
  const burstStart = Date.now();
  const requests = Array.from({ length: 10 }, (_, i) => {
    const start = Date.now();
    return fetch('http://127.0.0.1:5000/api/dashboard/overview', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async res => {
      const ms = Date.now() - start;
      const body = await res.json();
      return { id: i + 1, status: res.status, ok: res.ok, ms, success: body.success };
    }).catch(err => {
      return { id: i + 1, error: err.message };
    });
  });

  const results = await Promise.all(requests);
  const totalBurstMs = Date.now() - burstStart;

  console.log(`Burst completed in ${totalBurstMs}ms:`);
  let allPassed = true;
  for (const r of results) {
    if (r.error || r.status !== 200) {
      allPassed = false;
      console.error(`  Req #${r.id}: FAILED - ${r.error || r.status}`);
    } else {
      console.log(`  Req #${r.id}: Status ${r.status} (${r.ms}ms) - Cache/DB OK`);
    }
  }

  if (allPassed) {
    console.log('\n✓ ALL 10 CONCURRENT DASHBOARD REQUESTS SUCCEEDED WITH 200 OK!');
    console.log('✓ Zero ECONNRESET detected.');
    console.log('✓ Zero ECONNREFUSED detected.');
  } else {
    console.error('\n✗ One or more requests failed.');
    process.exit(1);
  }
}

testDashboard().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
