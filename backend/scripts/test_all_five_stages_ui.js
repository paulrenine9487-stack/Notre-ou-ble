const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function testAllStages() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'learner@notreoble.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const user = loginData.user;

  // Verify API stages endpoint
  const stagesRes = await fetch('http://localhost:5000/api/learning/stages', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const stagesData = await stagesRes.json();
  console.log('Stages from backend:');
  stagesData.stages.forEach(s => {
    console.log(`- Stage ${s.stage_number}: "${s.title}" (${s.subtitle}) [${s.status}]`);
  });

  const expectedTitles = [
    'Introduction',
    'What Do You Know?',
    'How To Do It',
    "Let's Check Ourselves",
    'Keep It Going'
  ];

  let allMatch = true;
  stagesData.stages.forEach((s, idx) => {
    if (s.title !== expectedTitles[idx]) {
      console.error(`Mismatch for stage ${idx + 1}: expected "${expectedTitles[idx]}", got "${s.title}"`);
      allMatch = false;
    }
  });

  if (allMatch) {
    console.log('ALL 5 STAGE TITLES MATCH EXPECTED SPECIFICATION 100%!');
  } else {
    process.exit(1);
  }

  process.exit(0);
}

testAllStages().catch(err => {
  console.error(err);
  process.exit(1);
});
