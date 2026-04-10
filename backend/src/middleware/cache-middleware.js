// Cache middleware for external API calls
const CacheService = require('../services/cache-service');

// Initialize cache service with Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);
const cacheService = new CacheService(supabase);

// Cache middleware factory
function createCacheMiddleware(apiSource, endpoint, ttlSeconds = null) {
  return async (req, res, next) => {
    try {
      // Extract parameters from request
      const parameters = {
        ...req.params,
        ...req.query,
        ...(req.body && Object.keys(req.body).length > 0 ? { body: req.body } : {})
      };

      // Try to get cached response
      const cachedResponse = await cacheService.getCachedResponse(apiSource, endpoint, parameters);
      
      if (cachedResponse) {
        console.log(`Cache hit for ${apiSource}:${endpoint}`);
        
        // Set response headers
        if (cachedResponse.contentType) {
          res.set('Content-Type', cachedResponse.contentType);
        }
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Expires', cachedResponse.expiresAt.toISOString());
        
        // Return cached response
        return res.status(cachedResponse.statusCode).json({
          ...cachedResponse.data,
          _cached: true,
          _cacheExpires: cachedResponse.expiresAt
        });
      }

      console.log(`Cache miss for ${apiSource}:${endpoint}`);
      
      // Store original res.json method
      const originalJson = res.json;
      const originalSend = res.send;
      const originalStatus = res.status;
      
      let responseData = null;
      let statusCode = 200;
      let contentType = 'application/json';
      
      // Override res.json to capture response data
      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };
      
      // Override res.send to capture response data
      res.send = function(data) {
        responseData = data;
        return originalSend.call(this, data);
      };
      
      // Override res.status to capture status code
      res.status = function(code) {
        statusCode = code;
        return originalStatus.call(this, code);
      };
      
      // Add cache headers for miss
      res.set('X-Cache', 'MISS');
      
      // Store the original end method
      const originalEnd = res.end;
      res.end = async function(...args) {
        // Restore original methods
        res.json = originalJson;
        res.send = originalSend;
        res.status = originalStatus;
        res.end = originalEnd;
        
        // Only cache successful responses (2xx status codes)
        if (statusCode >= 200 && statusCode < 300 && responseData) {
          try {
            // Determine content type
            const resContentType = res.get('Content-Type') || contentType;
            
            // Store response in cache
            await cacheService.storeCachedResponse(
              apiSource,
              endpoint,
              parameters,
              responseData,
              statusCode,
              resContentType,
              ttlSeconds
            );
            
            console.log(`Cached response for ${apiSource}:${endpoint}`);
          } catch (cacheError) {
            console.error('Failed to cache response:', cacheError);
          }
        }
        
        // Call original end method
        return originalEnd.call(this, ...args);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      res.set('X-Cache', 'ERROR');
      next();
    }
  };
}

// Simple cache middleware for specific routes
function cacheMiddleware(req, res, next) {
  // Determine API source and endpoint from request
  const apiSource = determineApiSource(req);
  const endpoint = determineEndpoint(req);
  const ttl = determineTTL(req);
  
  // Use the factory to create middleware for this specific request
  return createCacheMiddleware(apiSource, endpoint, ttl)(req, res, next);
}

// Helper functions
function determineApiSource(req) {
  const path = req.path;
  
  if (path.includes('/massive/')) return 'massive';
  if (path.includes('/alphavantage/')) return 'alphavantage';
  if (path.includes('/coingecko/')) return 'coingecko';
  if (path.includes('/finnhub/')) return 'finnhub';
  if (path.includes('/newsapi/')) return 'newsapi';
  
  return 'unknown';
}

function determineEndpoint(req) {
  // Remove API prefix and parameters to get endpoint
  let endpoint = req.path
    .replace('/api/external/', '')
    .replace(/\/:[^/]+/g, '/:param') // Replace path parameters
    .replace(/\/\d+/g, '/:id'); // Replace numeric IDs
  
  // Remove query string
  endpoint = endpoint.split('?')[0];
  
  return endpoint || req.path;
}

function determineTTL(req) {
  const path = req.path;
  
  // Different TTLs for different types of data
  if (path.includes('/quote/') || path.includes('/price/')) {
    return 60; // 1 minute for price quotes (fast-changing)
  }
  
  if (path.includes('/daily/') || path.includes('/historical/')) {
    return 3600; // 1 hour for daily data
  }
  
  if (path.includes('/company/') || path.includes('/overview/')) {
    return 86400; // 24 hours for company info
  }
  
  if (path.includes('/news/')) {
    return 1800; // 30 minutes for news
  }
  
  return 300; // Default 5 minutes
}

// Export middleware
module.exports = {
  cacheMiddleware,
  createCacheMiddleware,
  cacheService
};