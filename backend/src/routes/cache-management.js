// Cache management routes for monitoring and controlling cache
const express = require('express');
const router = express.Router();
const cacheInvalidationService = require('../services/cache-invalidation-service');
const { cacheService } = require('../middleware/cache-middleware');

// Get cache statistics
router.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheInvalidationService.getCacheStats();
    if (!stats) {
      return res.status(500).json({ error: 'Failed to get cache statistics' });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invalidate cache by API source
router.post('/api/cache/invalidate/source/:apiSource', async (req, res) => {
  try {
    const { apiSource } = req.params;
    const success = await cacheInvalidationService.invalidateByApiSource(apiSource);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Invalidated cache for API source: ${apiSource}` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Failed to invalidate cache for API source: ${apiSource}` 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invalidate cache by symbol
router.post('/api/cache/invalidate/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { source } = req.query;
    
    const success = await cacheInvalidationService.invalidateBySymbol(symbol, source);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Invalidated cache for symbol: ${symbol}${source ? ` (source: ${source})` : ''}` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Failed to invalidate cache for symbol: ${symbol}` 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invalidate expired cache entries
router.post('/api/cache/invalidate/expired', async (req, res) => {
  try {
    const success = await cacheInvalidationService.invalidateExpired();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Invalidated expired cache entries' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to invalidate expired cache entries' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all cache
router.post('/api/cache/clear', async (req, res) => {
  try {
    // Get all API sources from cache
    const { data: cacheEntries, error } = await cacheService.supabase
      .from('api_cache')
      .select('api_source')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    // Delete all cache entries
    const { error: deleteError } = await cacheService.supabase
      .from('api_cache')
      .delete()
      .neq('id', 0); // Delete all rows
    
    if (deleteError) {
      throw deleteError;
    }
    
    res.json({ 
      success: true, 
      message: 'Cleared all cache entries' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache hit/miss statistics
router.get('/api/cache/performance', async (req, res) => {
  try {
    // Get cache entries with hit counts
    const { data: cacheEntries, error } = await cacheService.supabase
      .from('api_cache')
      .select('api_source, endpoint, hit_count, last_accessed, expires_at')
      .order('hit_count', { ascending: false })
      .limit(50);
    
    if (error) {
      throw error;
    }
    
    // Calculate statistics
    const totalEntries = cacheEntries.length;
    const totalHits = cacheEntries.reduce((sum, entry) => sum + (entry.hit_count || 0), 0);
    const avgHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;
    
    // Group by API source
    const bySource = {};
    cacheEntries.forEach(entry => {
      const source = entry.api_source;
      if (!bySource[source]) {
        bySource[source] = {
          count: 0,
          totalHits: 0,
          endpoints: new Set()
        };
      }
      bySource[source].count++;
      bySource[source].totalHits += entry.hit_count || 0;
      bySource[source].endpoints.add(entry.endpoint);
    });
    
    // Format response
    const stats = {
      totalEntries,
      totalHits,
      avgHitsPerEntry: avgHitsPerEntry.toFixed(2),
      bySource: Object.entries(bySource).map(([source, data]) => ({
        source,
        count: data.count,
        totalHits: data.totalHits,
        avgHits: data.count > 0 ? (data.totalHits / data.count).toFixed(2) : '0.00',
        endpointCount: data.endpoints.size
      })),
      topEntries: cacheEntries.slice(0, 10).map(entry => ({
        source: entry.api_source,
        endpoint: entry.endpoint,
        hitCount: entry.hit_count || 0,
        lastAccessed: entry.last_accessed,
        expiresAt: entry.expires_at
      })),
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check for cache system
router.get('/api/cache/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await cacheService.supabase
      .from('api_cache')
      .select('count', { count: 'exact', head: true });
    
    const healthy = !error;
    
    res.json({
      healthy,
      databaseConnected: healthy,
      cacheServiceAvailable: true,
      invalidationServiceAvailable: true,
      timestamp: new Date().toISOString(),
      message: healthy ? 'Cache system is healthy' : 'Cache system has issues'
    });
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;