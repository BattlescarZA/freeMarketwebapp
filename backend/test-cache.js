// Test script for cache functionality
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:19112';

async function testCache() {
  console.log('Testing cache functionality...\n');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`   Health: ${healthRes.status} - ${JSON.stringify(healthData)}`);
  } catch (error) {
    console.log(`   Health check failed: ${error.message}`);
  }

  // Test 2: Cache health
  console.log('\n2. Testing cache health endpoint...');
  try {
    const cacheHealthRes = await fetch(`${BACKEND_URL}/api/cache/health`);
    const cacheHealthData = await cacheHealthRes.json();
    console.log(`   Cache Health: ${cacheHealthRes.status} - ${JSON.stringify(cacheHealthData)}`);
  } catch (error) {
    console.log(`   Cache health check failed: ${error.message}`);
  }

  // Test 3: Cache stats
  console.log('\n3. Testing cache stats endpoint...');
  try {
    const cacheStatsRes = await fetch(`${BACKEND_URL}/api/cache/stats`);
    const cacheStatsData = await cacheStatsRes.json();
    console.log(`   Cache Stats: ${cacheStatsRes.status}`);
    console.log(`   Total entries: ${cacheStatsData.total || 0}`);
    console.log(`   Expired entries: ${cacheStatsData.expired || 0}`);
  } catch (error) {
    console.log(`   Cache stats failed: ${error.message}`);
  }

  // Test 4: Test external API with cache (Massive quote)
  console.log('\n4. Testing external API with cache (first request - should be MISS)...');
  try {
    const startTime = Date.now();
    const quoteRes = await fetch(`${BACKEND_URL}/api/external/massive/quote/AAPL`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const cacheHeader = quoteRes.headers.get('x-cache');
    console.log(`   Status: ${quoteRes.status}`);
    console.log(`   Cache: ${cacheHeader || 'N/A'}`);
    console.log(`   Response time: ${responseTime}ms`);
    
    if (quoteRes.ok) {
      const data = await quoteRes.json();
      console.log(`   Response has data: ${!!data}`);
    }
  } catch (error) {
    console.log(`   First request failed: ${error.message}`);
  }

  // Test 5: Same request again (should be HIT if cached)
  console.log('\n5. Testing same request again (should be HIT if cached)...');
  try {
    const startTime = Date.now();
    const quoteRes = await fetch(`${BACKEND_URL}/api/external/massive/quote/AAPL`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const cacheHeader = quoteRes.headers.get('x-cache');
    const cacheExpires = quoteRes.headers.get('x-cache-expires');
    console.log(`   Status: ${quoteRes.status}`);
    console.log(`   Cache: ${cacheHeader || 'N/A'}`);
    console.log(`   Cache expires: ${cacheExpires || 'N/A'}`);
    console.log(`   Response time: ${responseTime}ms`);
    
    if (quoteRes.ok) {
      const data = await quoteRes.json();
      console.log(`   Response has cached flag: ${data._cached || false}`);
    }
  } catch (error) {
    console.log(`   Second request failed: ${error.message}`);
  }

  // Test 6: Cache performance stats
  console.log('\n6. Testing cache performance endpoint...');
  try {
    const perfRes = await fetch(`${BACKEND_URL}/api/cache/performance`);
    const perfData = await perfRes.json();
    console.log(`   Performance Stats: ${perfRes.status}`);
    console.log(`   Total entries: ${perfData.totalEntries || 0}`);
    console.log(`   Total hits: ${perfData.totalHits || 0}`);
    console.log(`   Avg hits per entry: ${perfData.avgHitsPerEntry || 0}`);
  } catch (error) {
    console.log(`   Performance stats failed: ${error.message}`);
  }

  // Test 7: Test cache invalidation
  console.log('\n7. Testing cache invalidation...');
  try {
    const invalidateRes = await fetch(`${BACKEND_URL}/api/cache/invalidate/source/massive`, {
      method: 'POST'
    });
    const invalidateData = await invalidateRes.json();
    console.log(`   Invalidation result: ${invalidateRes.status}`);
    console.log(`   Success: ${invalidateData.success || false}`);
    console.log(`   Message: ${invalidateData.message || 'N/A'}`);
  } catch (error) {
    console.log(`   Invalidation failed: ${error.message}`);
  }

  console.log('\n=== Cache Test Complete ===');
}

// Run tests
testCache().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});