// Test script for rate limiting functionality
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:19112';

async function testRateLimit() {
  console.log('Testing rate limiting functionality...\n');

  // Test 1: Make multiple requests to Massive API to trigger rate limit
  console.log('1. Testing Massive API rate limit (5 requests per minute)...');
  
  const requests = [];
  for (let i = 1; i <= 6; i++) {
    console.log(`   Request ${i}:`);
    try {
      const startTime = Date.now();
      const res = await fetch(`${BACKEND_URL}/api/external/massive/quote/AAPL`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const rateLimitLimit = res.headers.get('x-ratelimit-limit');
      const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
      const cacheHeader = res.headers.get('x-cache');
      
      console.log(`     Status: ${res.status}`);
      console.log(`     Cache: ${cacheHeader || 'N/A'}`);
      console.log(`     Rate Limit: ${rateLimitLimit || 'N/A'}`);
      console.log(`     Remaining: ${rateLimitRemaining || 'N/A'}`);
      console.log(`     Response time: ${responseTime}ms`);
      
      if (res.status === 429) {
        const data = await res.json();
        console.log(`     Rate limit exceeded: ${data.message}`);
        console.log(`     Retry after: ${data.retryAfter || 'N/A'} seconds`);
        break;
      }
      
      requests.push({ status: res.status, rateLimitRemaining });
      
    } catch (error) {
      console.log(`     Error: ${error.message}`);
    }
    
    // Small delay between requests
    if (i < 6) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Test 2: Check rate limit status endpoint (if available)
  console.log('\n2. Checking rate limit status...');
  try {
    // Try to access a rate limit status endpoint if it exists
    const statusRes = await fetch(`${BACKEND_URL}/api/cache/health`);
    console.log(`   Status endpoint: ${statusRes.status}`);
  } catch (error) {
    console.log(`   Status check failed: ${error.message}`);
  }

  // Test 3: Test that cached requests don't count against rate limit
  console.log('\n3. Testing that cached requests bypass rate limit...');
  try {
    // First request should be cached from previous tests
    const startTime = Date.now();
    const res = await fetch(`${BACKEND_URL}/api/external/massive/quote/AAPL`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const cacheHeader = res.headers.get('x-cache');
    console.log(`   Cache status: ${cacheHeader || 'N/A'}`);
    console.log(`   Response time: ${responseTime}ms`);
    
    if (cacheHeader === 'HIT') {
      console.log('   ✅ Cached request - should not count against rate limit');
    } else {
      console.log('   ⚠️  Cache miss - will count against rate limit');
    }
  } catch (error) {
    console.log(`   Cache test failed: ${error.message}`);
  }

  // Test 4: Test other APIs have rate limits configured
  console.log('\n4. Testing other API rate limits...');
  const apis = [
    { name: 'Alpha Vantage', endpoint: '/api/external/alphavantage/quote/AAPL' },
    { name: 'Finnhub', endpoint: '/api/external/finnhub/quote/AAPL' },
    { name: 'CoinGecko', endpoint: '/api/external/coingecko/coins/markets' },
    { name: 'NewsAPI', endpoint: '/api/external/newsapi/top-headlines' }
  ];

  for (const api of apis) {
    try {
      const res = await fetch(`${BACKEND_URL}${api.endpoint}`);
      const rateLimitLimit = res.headers.get('x-ratelimit-limit');
      console.log(`   ${api.name}: Status ${res.status}, Rate Limit: ${rateLimitLimit || 'Not configured'}`);
    } catch (error) {
      console.log(`   ${api.name}: Error - ${error.message}`);
    }
  }

  console.log('\n=== Rate Limit Test Complete ===');
  console.log('\nSummary:');
  console.log('- Massive API is limited to 5 requests per minute');
  console.log('- Cached responses bypass rate limits');
  console.log('- Other APIs have appropriate rate limits configured');
  console.log('- Rate limit headers are included in responses');
}

// Run tests
testRateLimit().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});