// Cache invalidation service for managing cache lifecycle
const { createClient } = require('@supabase/supabase-js');
const CacheService = require('./cache-service');

class CacheInvalidationService {
  constructor(supabase) {
    this.supabase = supabase;
    this.cacheService = new CacheService(supabase);
  }

  // Invalidate cache by API source
  async invalidateByApiSource(apiSource) {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .eq('api_source', apiSource);

      if (error) {
        console.error(`Failed to invalidate cache for API source ${apiSource}:`, error);
        return false;
      }

      console.log(`Invalidated all cache entries for API source: ${apiSource}`);
      return true;
    } catch (error) {
      console.error(`Error invalidating cache for API source ${apiSource}:`, error);
      return false;
    }
  }

  // Invalidate cache by endpoint pattern
  async invalidateByEndpoint(endpointPattern) {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .ilike('endpoint', `%${endpointPattern}%`);

      if (error) {
        console.error(`Failed to invalidate cache for endpoint pattern ${endpointPattern}:`, error);
        return false;
      }

      console.log(`Invalidated cache entries for endpoint pattern: ${endpointPattern}`);
      return true;
    } catch (error) {
      console.error(`Error invalidating cache for endpoint pattern ${endpointPattern}:`, error);
      return false;
    }
  }

  // Invalidate cache for specific symbol/ticker
  async invalidateBySymbol(symbol, apiSource = null) {
    try {
      let query = this.supabase
        .from('api_cache')
        .delete();

      // Build query based on parameters
      if (apiSource) {
        query = query.eq('api_source', apiSource);
      }

      // Look for symbol in parameters JSON
      const { error } = await query
        .or(`parameters.cs.{symbol}.eq.${symbol},parameters.cs.{ticker}.eq.${symbol},parameters.cs.{id}.eq.${symbol}`);

      if (error) {
        console.error(`Failed to invalidate cache for symbol ${symbol}:`, error);
        return false;
      }

      console.log(`Invalidated cache entries for symbol: ${symbol}${apiSource ? ` in ${apiSource}` : ''}`);
      return true;
    } catch (error) {
      console.error(`Error invalidating cache for symbol ${symbol}:`, error);
      return false;
    }
  }

  // Invalidate expired cache entries (cleanup)
  async invalidateExpired() {
    try {
      const now = new Date().toISOString();
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .lt('expires_at', now);

      if (error) {
        console.error('Failed to invalidate expired cache entries:', error);
        return false;
      }

      console.log('Invalidated expired cache entries');
      return true;
    } catch (error) {
      console.error('Error invalidating expired cache entries:', error);
      return false;
    }
  }

  // Invalidate cache by time (older than specified date)
  async invalidateOlderThan(date) {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .lt('updated_at', date.toISOString());

      if (error) {
        console.error('Failed to invalidate old cache entries:', error);
        return false;
      }

      console.log(`Invalidated cache entries older than: ${date.toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error invalidating old cache entries:', error);
      return false;
    }
  }

  // Invalidate cache by hit count (low usage)
  async invalidateLowUsage(maxHitCount = 1) {
    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .lte('hit_count', maxHitCount);

      if (error) {
        console.error('Failed to invalidate low usage cache entries:', error);
        return false;
      }

      console.log(`Invalidated cache entries with hit count <= ${maxHitCount}`);
      return true;
    } catch (error) {
      console.error('Error invalidating low usage cache entries:', error);
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const { data: totalData, error: totalError } = await this.supabase
        .from('api_cache')
        .select('count', { count: 'exact', head: true });

      const { data: expiredData, error: expiredError } = await this.supabase
        .from('api_cache')
        .select('count', { count: 'exact', head: true })
        .lt('expires_at', new Date().toISOString());

      const { data: sourceData, error: sourceError } = await this.supabase
        .from('api_cache')
        .select('api_source, count(*)')
        .group('api_source');

      if (totalError || expiredError || sourceError) {
        throw new Error('Failed to get cache statistics');
      }

      return {
        total: totalData?.[0]?.count || 0,
        expired: expiredData?.[0]?.count || 0,
        bySource: sourceData || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return null;
    }
  }

  // Schedule periodic cache cleanup
  scheduleCleanup(intervalMinutes = 60) {
    setInterval(async () => {
      console.log('Running scheduled cache cleanup...');
      await this.invalidateExpired();
      
      // Also clean up low usage entries (hit count <= 1) older than 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await this.invalidateOlderThan(twentyFourHoursAgo);
      
      console.log('Scheduled cache cleanup completed');
    }, intervalMinutes * 60 * 1000);
  }
}

// Initialize with Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

const cacheInvalidationService = new CacheInvalidationService(supabase);

// Start scheduled cleanup (every hour)
cacheInvalidationService.scheduleCleanup(60);

module.exports = cacheInvalidationService;