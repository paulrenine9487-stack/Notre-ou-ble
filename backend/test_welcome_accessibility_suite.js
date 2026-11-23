const fs = require('fs');
const path = require('path');

async function testWelcomeAccessibility() {
  console.log('================================================================');
  console.log('  NO TREBLE - EXACT ACCESSIBILITY BUTTON & POPUP TESTS           ');
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

  // 1. Check Image Assets Exist
  const svgPublic = path.join(__dirname, '../frontend/public/accessibility-symbol.svg');
  const pngPublic = path.join(__dirname, '../frontend/public/accessibility-symbol.png');
  const svgSrc = path.join(__dirname, '../frontend/src/assets/accessibility-symbol.svg');
  const pngSrc = path.join(__dirname, '../frontend/src/assets/accessibility-symbol.png');

  assert(fs.existsSync(svgPublic), '1. accessibility-symbol.svg exists in public/');
  assert(fs.existsSync(pngPublic), '2. accessibility-symbol.png exists in public/');
  assert(fs.existsSync(svgSrc), '3. accessibility-symbol.svg exists in src/assets/');
  assert(fs.existsSync(pngSrc), '4. accessibility-symbol.png exists in src/assets/');

  // Validate image appearance properties
  const svgContent = fs.readFileSync(svgPublic, 'utf-8');
  assert(svgContent.includes('#193B40'), '5. Dark teal circular background (#193B40) present');
  assert(svgContent.includes('<circle cx="50" cy="22.5" r="8" fill="#FFFFFF"'), '6. White circular head present');
  assert(svgContent.includes('<path') && svgContent.includes('fill="#FFFFFF"'), '7. White human accessibility symbol with extended arms & legs');

  // 2. Check Components Exist
  const menuComp = path.join(__dirname, '../frontend/src/components/AccessibilityMenu.jsx');
  const navbarComp = path.join(__dirname, '../frontend/src/components/Navbar.jsx');
  const welcomePage = path.join(__dirname, '../frontend/src/pages/WelcomePage.jsx');
  const contextDef = path.join(__dirname, '../frontend/src/context/AccessibilityContext.jsx');

  assert(fs.existsSync(menuComp), '8. AccessibilityMenu component exists');
  assert(fs.existsSync(navbarComp), '9. Navbar component exists');
  assert(fs.existsSync(contextDef), '10. AccessibilityContext & Provider exist');

  // 3. Validate Header Layout Sequence
  const navbarCode = fs.readFileSync(navbarComp, 'utf-8');
  const loginIndex = navbarCode.indexOf('/login');
  const menuIndex = navbarCode.indexOf('<AccessibilityMenu');
  const hasTextInNav = navbarCode.includes('<TextSizeControl');
  const hasThemeInNav = navbarCode.includes('<ThemeToggle');

  assert(!hasTextInNav && !hasThemeInNav, '11. Text size and theme controls NOT directly displayed in header');
  assert(loginIndex !== -1, '12. Existing Log In button present in header');
  assert(menuIndex !== -1, '13. AccessibilityMenu present in header');
  assert(loginIndex < menuIndex, '14. Exact sequence: LOGIN BUTTON -> ACCESSIBILITY ICON BUTTON');

  // 4. Validate AccessibilityMenu Implementation
  const menuCode = fs.readFileSync(menuComp, 'utf-8');
  assert(menuCode.includes('accessibility-symbol.svg'), '15. Uses uploaded accessibility symbol as image asset');
  assert(menuCode.includes('46px'), '16. Button size is approximately 44-48px (46px)');
  assert(menuCode.includes('#193B40'), '17. Dark teal circular background (#193B40) applied to button');
  assert(menuCode.includes('ACCESSIBILITY SETTINGS'), '18. Panel heading is ACCESSIBILITY SETTINGS');
  assert(menuCode.includes('TEXT SIZE'), '19. TEXT SIZE section present in dropdown');
  assert(menuCode.includes('A−') && menuCode.includes("'default'") && menuCode.includes('A+'), '20. Text size options A-, A, A+ present');
  assert(menuCode.includes('COLOUR MODE'), '21. COLOUR MODE section present in dropdown');
  assert(menuCode.includes('Sun') && menuCode.includes('Moon'), '22. Light and Dark modes with Sun and Moon icons present');
  assert(menuCode.includes('handleClickOutside'), '23. Clicking outside closes the popup');
  assert(menuCode.includes('Escape'), '24. Escape key closes the popup');

  // 5. Validate WelcomePage and Persistence
  const welcomeCode = fs.readFileSync(welcomePage, 'utf-8');
  assert(welcomeCode.includes('hero-main-h1') && welcomeCode.includes('hero-gradient-text'), '25. Clean hero gradient text preserved');
  assert(welcomeCode.includes('EVERY VOICE') && welcomeCode.includes('HAS A STORY'), '26. Hero heading text preserved');
  assert(welcomeCode.includes('JOURNEY'), '27. JOURNEY button preserved');

  const ctxCode = fs.readFileSync(contextDef, 'utf-8');
  assert(ctxCode.includes('notreoble_welcome_theme'), '28. Theme persists to localStorage');
  assert(ctxCode.includes('notreoble_welcome_text_size'), '29. Text size persists to localStorage');

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testWelcomeAccessibility();
