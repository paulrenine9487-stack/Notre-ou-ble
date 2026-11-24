const nativeFetch = globalThis.fetch;
let customFetchCalled = false;

const fetch = async (url, options) => {
  customFetchCalled = true;
  return { ok: true, custom: true };
};

async function testCall() {
  const res = await fetch('http://example.com');
  console.log('Custom fetch called:', customFetchCalled, 'result:', res);
}

testCall();
