const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9222;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture() {
  console.log('Logging in user...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'learner@notreoble.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const user = loginData.user;
  console.log('Logged in as:', user.username);

  console.log('Starting Edge headless...');
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--window-size=1280,1100',
    'about:blank'
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.type === 'page');
    if (!pageTab) throw new Error('No page tab found');
    const wsUrl = pageTab.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    await sendCDP(ws, 'Page.enable');
    await sendCDP(ws, 'Runtime.enable');
    await sendCDP(ws, 'DOM.enable');

    console.log('Navigating to root to inject auth...');
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:5000/' });
    await sleep(1500);

    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        localStorage.setItem('resonova_token', '${token}');
        localStorage.setItem('resonova_user', '${JSON.stringify(user).replace(/'/g, "\\'")}');
      `
    });

    console.log('Navigating to Stage 01...');
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:5000/learning/modules/breath-management?stage=1' });
    await sleep(2500);

    // Scroll to objectives section
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const el = document.querySelector('.objectives-flip-section');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await sleep(600);

    // Screenshot 1: All 4 Front Cards
    const shot1 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '../stage01_objectives_all_front.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved stage01_objectives_all_front.png');

    // Click Card 1 to flip it
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        const cards = document.querySelectorAll('.objective-flip-card-wrapper');
        if (cards[0]) cards[0].click();
      `
    });
    await sleep(800);

    // Screenshot 2: Card 1 Flipped
    const shot2 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '../stage01_objectives_card1_flipped.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved stage01_objectives_card1_flipped.png');

    // Click Card 2 to flip Card 2 (Card 1 should auto-close)
    const click2Res = await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('.objective-flip-card-wrapper');
          if (cards[1]) {
            cards[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return 'clicked card 1 with length ' + cards.length;
          }
          return 'no card 1 found';
        })()
      `,
      returnByValue: true
    });
    console.log('Click 2 eval:', click2Res);
    await sleep(1000);

    const classCheck = await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('.objective-flip-card-wrapper')).map(c => c.className)
      `,
      returnByValue: true
    });
    console.log('Card classes after clicking Card 2:', classCheck.result.value);

    // Screenshot 3: Card 2 Flipped
    const shot3 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '../stage01_objectives_card2_flipped.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved stage01_objectives_card2_flipped.png');

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

capture().then(() => {
  console.log('Capture completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
