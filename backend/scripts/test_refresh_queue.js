// Verification test for token refresh queueing logic
let refreshCount = 0;
let isRefreshing = false;
let refreshPromise = null;

async function renewToken() {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    refreshCount++;
    await new Promise(r => setTimeout(r, 100)); // simulate network delay
    return 'new_access_token_123';
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function simulateConcurrentRequests() {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(renewToken());
  }
  const results = await Promise.all(promises);
  console.log('Results match:', results.every(r => r === 'new_access_token_123'));
  console.log('Total refresh API calls made:', refreshCount);
}

simulateConcurrentRequests();
