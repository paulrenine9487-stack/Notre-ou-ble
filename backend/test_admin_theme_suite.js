const pool = require('./config/db');

const API_BASE = 'http://localhost:5000/api';

async function runThemeSuite() {
  console.log('================================================================');
  console.log('  No Tre(ou)ble - ADMIN ACCESS & BRANDING THEME PALETTE TESTS    ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Superadmin Login with exact requested credentials
    const superLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Notreoblemccmrfip',
        password: 'notreoblesinger'
      })
    });
    const superLoginData = await superLoginRes.json();
    assert(superLoginRes.status === 200 && superLoginData.success, '1. SuperAdmin login with username "Notreoblemccmrfip" succeeded');
    assert(superLoginData.user?.role === 'SUPERADMIN', '2. User role is confirmed SUPERADMIN');

    const superToken = superLoginData.token;

    // 2. Admin Login with exact requested credentials
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Smirthi',
        password: 'smirthi1234'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.success, '3. Admin login with username "Smirthi" succeeded');
    assert(adminLoginData.user?.role === 'ADMIN', '4. User role is confirmed ADMIN');

    const adminToken = adminLoginData.token;

    // 3. Public Theme Fetch
    const publicThemeRes = await fetch(`${API_BASE}/admin/public-theme`);
    const publicThemeData = await publicThemeRes.json();
    assert(publicThemeRes.status === 200 && publicThemeData.success, '5. GET /api/admin/public-theme is accessible without authentication');
    assert(Boolean(publicThemeData.theme?.primary_color && publicThemeData.theme?.secondary_color), '6. Public theme contains primary_color and secondary_color');

    // 4. Update Theme via Admin Studio (PUT /api/admin/theme)
    const updateThemeRes = await fetch(`${API_BASE}/admin/theme`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        theme_name: 'No Tre(ou)ble Harmonic Vocal Palette',
        primary_color: '#193B40',
        secondary_color: '#398575',
        accent_bg_color: '#DCECE5',
        main_bg_color: '#F3F6F3'
      })
    });
    const updateThemeData = await updateThemeRes.json();
    assert(updateThemeRes.status === 200 && updateThemeData.success, '7. Admin can update branding theme via PUT /api/admin/theme');
    assert(updateThemeData.theme?.primary_color === '#193B40', '8. Updated primary_color saved in MySQL');
    assert(updateThemeData.theme?.secondary_color === '#398575', '9. Updated secondary_color saved in MySQL');

    // 5. Verify database persistence
    const [dbRows] = await pool.query('SELECT * FROM branding_settings WHERE id = 1');
    assert(dbRows.length > 0 && dbRows[0].primary_color === '#193B40', '10. Theme persisted in MySQL table branding_settings');

    // 6. Security Check: Vocalist / Unauthenticated cannot PUT /api/admin/theme
    const unauthPut = await fetch(`${API_BASE}/admin/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_color: '#FF0000', secondary_color: '#00FF00' })
    });
    assert(unauthPut.status === 401, '11. Security: Unauthenticated update to branding theme is rejected (HTTP 401)');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log(`  BRANDING & ADMIN RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    await pool.end();
  }
}

runThemeSuite();

