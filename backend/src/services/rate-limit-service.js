// Rate limiting service for external APIs
const { createClient } = require('@supabase/supabase-js');

class RateLimitService {
  constructor(supabase) {
    this.supabase = supabase;
    this.rateLimits = {
      massive: {
        requestsPerMinute: 5,
        windowMs: 60 * 1000, // 1 minute
        currentCount: 0,
        resetTime: null
      },
      alphavantage: {
        requestsPerMinute: 5, // Free tier limit
        windowMs: 60 * 1000,
        currentCount: 0,
        resetTime: null
      },
      finnhub: {
        requestsPerMinute: 60, // Free tier limit
        windowMs: 60 * 1000,
        currentCount: 0,
        resetTime: null
      },
      newsapi: {
        requestsPerMinute: 100, // Free tier limit
        windowMs: 60 * 1000,
        currentCount: 0,
        resetTime: null
      },
      coingecko: {
        requestsPerMinute: 10, // Free tier limit
        windowMs: 60 * 1000,
        currentCount: 0,
        resetTime: null
      },
      yahoofinance: {
        requestsPerMinute: 10, // Conservative limit for Yahoo Finance
        windowMs: 60 * 1000,
        currentCount: 0,
        resetTime: null
      }
    };
    
    // Initialize from database if available
    this.initializeFromDatabase();
  }

  async initializeFromDatabase() {
    try {
      // Create rate limit tracking table if it doesn't exist
      const { error } = await this.supabase.rpc('create_rate_limit_table_if_not_exists');
      if (error && error.message.includes('function does not exist')) {
        // Table doesn't exist yet, we'll create it on first use
        console.log('Rate limit table will be created on first use');
      }
    } catch (error) {
      console.error('Failed to initialize rate limit from database:', error);
    }
  }

  // Check if we can make a request to the API
  async canMakeRequest(apiName) {
    const limit = this.rateLimits[apiName];
    if (!limit) {
      return true; // No rate limit configured
    }

    const now = Date.now();
    
    // Reset counter if window has passed
    if (!limit.resetTime || now >= limit.resetTime) {
      limit.currentCount = 0;
      limit.resetTime = now + limit.windowMs;
    }

    // Check if we've exceeded the limit
    if (limit.currentCount >= limit.requestsPerMinute) {
      const waitTime = limit.resetTime - now;
      console.log(`Rate limit exceeded for ${apiName}. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
      return false;
    }

    return true;
  }

  // Record a request was made
  async recordRequest(apiName) {
    const limit = this.rateLimits[apiName];
    if (!limit) {
      return;
    }

    const now = Date.now();
    
    // Reset counter if window has passed
    if (!limit.resetTime || now >= limit.resetTime) {
      limit.currentCount = 0;
      limit.resetTime = now + limit.windowMs;
    }

    // Increment counter
    limit.currentCount++;
    
    // Also record in database for persistence across server restarts
    await this.recordRequestInDatabase(apiName, limit.currentCount, limit.resetTime);
    
    console.log(`Rate limit for ${apiName}: ${limit.currentCount}/${limit.requestsPerMinute} requests this minute`);
  }

  async recordRequestInDatabase(apiName, currentCount, resetTime) {
    try {
      const { error } = await this.supabase
        .from('api_rate_limits')
        .upsert({
          api_name: apiName,
          request_count: currentCount,
          reset_time: new Date(resetTime).toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'api_name'
        });

      if (error) {
        console.error('Failed to record rate limit in database:', error);
      }
    } catch (error) {
      console.error('Error recording rate limit:', error);
    }
  }

  // Get rate limit status
  getStatus(apiName) {
    const limit = this.rateLimits[apiName];
    if (!limit) {
      return { available: true, remaining: Infinity, resetIn: 0 };
    }

    const now = Date.now();
    const remaining = Math.max(0, limit.requestsPerMinute - limit.currentCount);
    const resetIn = limit.resetTime ? Math.max(0, limit.resetTime - now) : 0;
    
    return {
      available: remaining > 0,
      remaining,
      resetIn,
      limit: limit.requestsPerMinute,
      current: limit.currentCount
    };
  }

  // Get all rate limit statuses
  getAllStatuses() {
    const statuses = {};
    for (const [apiName, limit] of Object.entries(this.rateLimits)) {
      statuses[apiName] = this.getStatus(apiName);
    }
    return statuses;
  }

  // Create rate limit middleware for Express
  createRateLimitMiddleware(apiName) {
    return async (req, res, next) => {
      try {
        const canMakeRequest = await this.canMakeRequest(apiName);
        
        if (!canMakeRequest) {
          const status = this.getStatus(apiName);
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Too many requests to ${apiName} API. Please try again in ${Math.ceil(status.resetIn / 1000)} seconds.`,
            retryAfter: Math.ceil(status.resetIn / 1000),
            limit: status.limit,
            remaining: 0,
            resetIn: status.resetIn
          });
        }

        // Add rate limit headers to response
        res.set('X-RateLimit-Limit', this.rateLimits[apiName].requestsPerMinute.toString());
        res.set('X-RateLimit-Remaining', (this.rateLimits[apiName].requestsPerMinute - this.rateLimits[apiName].currentCount).toString());
        
        // Record the request after sending response
        const originalEnd = res.end;
        res.end = async (...args) => {
          // Only record successful requests (2xx status codes)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await this.recordRequest(apiName);
          }
          return originalEnd.call(res, ...args);
        };

        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // Allow request to proceed on error (fail open)
        next();
      }
    };
  }
}

// Initialize with Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

const rateLimitService = new RateLimitService(supabase);

module.exports = rateLimitService;