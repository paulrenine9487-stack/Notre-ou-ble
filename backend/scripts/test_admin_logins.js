async function testLogins() {
  // Test Smirthi login
  const smirthiRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Smirthi',
      password: 'smirthi1234'
    })
  });
  const smirthiData = await smirthiRes.json();
  console.log('Smirthi Login Status:', smirthiRes.status);
  console.log('Smirthi Login Success:', smirthiData.success);
  console.log('Smirthi Role:', smirthiData.user?.role);
  console.log('Smirthi MFA Required:', smirthiData.mfaRequired);

  // Test Notreoblemccmrfip login
  const superRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Notreoblemccmrfip',
      password: 'notreoblesinger'
    })
  });
  const superData = await superRes.json();
  console.log('Notreoblemccmrfip Login Status:', superRes.status);
  console.log('Notreoblemccmrfip MFA Required:', superData.mfaRequired);
  console.log('Notreoblemccmrfip MFA Token exists:', !!superData.mfaToken);

  // Test MFA verification with 232425
  const mfaRes = await fetch('http://localhost:5000/api/auth/verify-mfa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mfaToken: superData.mfaToken,
      code: '232425'
    })
  });
  const mfaData = await mfaRes.json();
  console.log('MFA Verification Status:', mfaRes.status);
  console.log('MFA Verification Success:', mfaData.success);
  console.log('MFA User Role:', mfaData.user?.role);

  process.exit(0);
}

testLogins().catch(e => {
  console.error(e);
  process.exit(1);
});
