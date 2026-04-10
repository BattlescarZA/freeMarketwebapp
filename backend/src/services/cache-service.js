// Cache service for storing and retrieving external API responses
const { createClient } = require('@supabase/supabase-js');

class CacheService {
  constructor(supabase) {
    this.supabase = supabase;
    this.defaultTTL = 300; // 5 minutes in seconds
  }

  // Generate cache key from API source, endpoint, and parameters
  generateCacheKey(apiSource, endpoint, parameters = {}) {
    const paramsString = JSON.stringify(parameters);
    return `${apiSource}:${endpoint}:${this.hashString(paramsString)}`;
  }

  // Simple hash function
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Get cached response
  async getCachedResponse(apiSource, endpoint, parameters = {}) {
    try {
      const cacheKey = this.generateCacheKey(apiSource, endpoint, parameters);
      
      const { data, error } = await this.supabase
        .from('api_cache')
        .select('response_data, status_code, content_type, expires_at')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null; // Cache miss or expired
      }

      // Update last accessed time and hit count
      await this.supabase
        .from('api_cache')
        .update({
          last_accessed: new Date().toISOString(),
          hit_count: this.supabase.rpc('increment', { x: 1 }), // Simplified
          updated_at: new Date().toISOString()
        })
        .eq('cache_key', cacheKey);

      return {
        data: data.response_data,
        statusCode: data.status_code,
        contentType: data.content_type,
        expiresAt: new Date(data.expires_at),
        cached: true
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Store response in cache
  async storeCachedResponse(apiSource, endpoint, parameters = {}, responseData, statusCode = 200, contentType = 'application/json', ttlSeconds = null) {
    try {
      const cacheKey = this.generateCacheKey(apiSource, endpoint, parameters);
      const ttl = ttlSeconds || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttl * 1000);

      const { error } = await this.supabase
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          api_source: apiSource,
          endpoint: endpoint,
          parameters: parameters,
          response_data: responseData,
          status_code: statusCode,
          content_type: contentType,
          expires_at: expiresAt.toISOString(),
          last_accessed: new Date().toISOString(),
          hit_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('Cache store error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache store error:', error);
      return false;
    }
  }

  // Clear cache for specific API source or endpoint
  async clearCache(apiSource = null, endpoint = null) {
    try {
      let query = this.supabase.from('api_cache').delete();

      if (apiSource) {
        query = query.eq('api_source', apiSource);
      }

      if (endpoint) {
        query = query.eq('endpoint', endpoint);
      }

      const { error } = await query;

      if (error) {
        console.error('Cache clear error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      // Use the database function if available, otherwise calculate manually
      const { data, error } = await this.supabase
        .rpc('get_cache_stats');

      if (error) {
        // Fallback to manual calculation
        return await this.calculateCacheStats();
      }

      return data;
    } catch (error) {
      console.error('Cache stats error:', error);
      return await this.calculateCacheStats();
    }
  }

  async calculateCacheStats() {
    try {
      const now = new Date().toISOString();
      
      // Get total entries
      const { count: totalEntries } = await this.supabase
        .from('api_cache')
        .select('*', { count: 'exact', head: true });

      // Get active entries
      const { count: activeEntries } = await this.supabase
        .from('api_cache')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', now);

      // Get expired entries
      const { count: expiredEntries } = await this.supabase
        .from('api_cache')
        .select('*', { count: 'exact', head: true })
        .lte('expires_at', now);

      // Get total hits
      const { data: hitsData } = await this.supabase
        .from('api_cache')
        .select('hit_count');

      const totalHits = hitsData?.reduce((sum, item) => sum + (item.hit_count || 0), 0) || 0;
      const avgHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;

      // Get oldest and newest entries
      const { data: timeData } = await this.supabase
        .from('api_cache')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      const oldestEntry = timeData?.[0]?.created_at || null;

      const { data: newestData } = await this.supabase
        .from('api_cache')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      const newestEntry = newestData?.[0]?.created_at || null;

      return {
        total_entries: totalEntries || 0,
        active_entries: activeEntries || 0,
        expired_entries: expiredEntries || 0,
        total_hits: totalHits,
        avg_hits_per_entry: avgHitsPerEntry,
        oldest_entry: oldestEntry,
        newest_entry: newestEntry
      };
    } catch (error) {
      console.error('Cache stats calculation error:', error);
      return {
        total_entries: 0,
        active_entries: 0,
        expired_entries: 0,
        total_hits: 0,
        avg_hits_per_entry: 0,
        oldest_entry: null,
        newest_entry: null
      };
    }
  }

  // Clean expired cache entries
  async cleanExpiredCache(batchSize = 1000) {
    try {
      const now = new Date().toISOString();
      
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .lte('expires_at', now)
        .limit(batchSize);

      if (error) {
        console.error('Cache cleanup error:', error);
        return 0;
      }

      // Note: Supabase doesn't return count for DELETE, so we can't know exact number
      return batchSize;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  // Get TTL for different API types
  getTTLForApiSource(apiSource) {
    const ttlConfig = {
      'massive': 60, // 1 minute for real-time data
      'alphavantage': 300, // 5 minutes
      'coingecko': 120, // 2 minutes for crypto
      'finnhub': 60, // 1 minute
      'newsapi': 900, // 15 minutes for news
      'yahoofinance': 120, // 2 minutes for Yahoo Finance
      'default': 300 // 5 minutes default
    };

    return ttlConfig[apiSource] || ttlConfig.default;
  }
}

module.exports = CacheService;