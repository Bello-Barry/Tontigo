const fetch = require('node-fetch');

async function test() {
  try {
    console.log("Testing AI Stream...");
    // Note: This won't work without a valid session cookie in a real environment,
    // but we can check if it at least returns 401/500 correctly or try to mock the session if we could.
    // However, the primary goal here is to check the CODE correctness.
    console.log("Check app/api/ia/stream/route.ts content for manual TextDecoder compatibility.");
  } catch (e) {
    console.error(e);
  }
}

test();
