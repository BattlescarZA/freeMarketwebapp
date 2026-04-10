-- API Cache Table for storing external API responses
CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Cache key: combination of endpoint and parameters
  cache_key TEXT NOT NULL UNIQUE,
  
  -- Source API (massive, alphavantage, coingecko, etc.)
  api_source TEXT NOT NULL,
  
  -- Endpoint path
  endpoint TEXT NOT NULL,
  
  -- Request parameters (stored as JSON)
  parameters JSONB DEFAULT '{}'::jsonb,
  
  -- Response data (stored as JSON)
  response_data JSONB NOT NULL,
  
  -- Metadata
  status_code INTEGER NOT NULL,
  content_type TEXT,
  
  -- Cache control
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_cache_cache_key ON public.api_cache(cache_key);
CREATE INDEX idx_api_cache_api_source ON public.api_cache(api_source);
CREATE INDEX idx_api_cache_endpoint ON public.api_cache(endpoint);
CREATE INDEX idx_api_cache_expires_at ON public.api_cache(expires_at);
CREATE INDEX idx_api_cache_last_accessed ON public.api_cache(last_accessed);

-- Function to generate cache key
CREATE OR REPLACE FUNCTION public.generate_cache_key(
  p_api_source TEXT,
  p_endpoint TEXT,
  p_parameters JSONB
) RETURNS TEXT AS $$
BEGIN
  RETURN p_api_source || ':' || p_endpoint || ':' || md5(p_parameters::text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get cached response
CREATE OR REPLACE FUNCTION public.get_cached_response(
  p_cache_key TEXT,
  p_update_access BOOLEAN DEFAULT true
) RETURNS TABLE (
  response_data JSONB,
  status_code INTEGER,
  content_type TEXT,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_update_access THEN
    UPDATE public.api_cache
    SET last_accessed = NOW(),
        hit_count = hit_count + 1,
        updated_at = NOW()
    WHERE cache_key = p_cache_key
      AND expires_at > NOW()
    RETURNING api_cache.response_data, api_cache.status_code, api_cache.content_type, api_cache.expires_at
    INTO response_data, status_code, content_type, expires_at;
  ELSE
    SELECT ac.response_data, ac.status_code, ac.content_type, ac.expires_at
    INTO response_data, status_code, content_type, expires_at
    FROM public.api_cache ac
    WHERE ac.cache_key = p_cache_key
      AND ac.expires_at > NOW();
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to store cached response
CREATE OR REPLACE FUNCTION public.store_cached_response(
  p_api_source TEXT,
  p_endpoint TEXT,
  p_parameters JSONB,
  p_response_data JSONB,
  p_status_code INTEGER,
  p_content_type TEXT DEFAULT 'application/json',
  p_ttl_seconds INTEGER DEFAULT 300 -- 5 minutes default TTL
) RETURNS UUID AS $$
DECLARE
  v_cache_key TEXT;
  v_cache_id UUID;
BEGIN
  -- Generate cache key
  v_cache_key := public.generate_cache_key(p_api_source, p_endpoint, p_parameters);
  
  -- Insert or update cache entry
  INSERT INTO public.api_cache (
    cache_key,
    api_source,
    endpoint,
    parameters,
    response_data,
    status_code,
    content_type,
    expires_at
  ) VALUES (
    v_cache_key,
    p_api_source,
    p_endpoint,
    p_parameters,
    p_response_data,
    p_status_code,
    p_content_type,
    NOW() + (p_ttl_seconds || ' seconds')::INTERVAL
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    response_data = EXCLUDED.response_data,
    status_code = EXCLUDED.status_code,
    content_type = EXCLUDED.content_type,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW(),
    hit_count = api_cache.hit_count + 1
  RETURNING id INTO v_cache_id;
  
  RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache(
  p_batch_size INTEGER DEFAULT 1000
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_cache
  WHERE id IN (
    SELECT id
    FROM public.api_cache
    WHERE expires_at <= NOW()
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION public.get_cache_stats()
RETURNS TABLE (
  total_entries BIGINT,
  active_entries BIGINT,
  expired_entries BIGINT,
  total_hits BIGINT,
  avg_hits_per_entry NUMERIC,
  oldest_entry TIMESTAMPTZ,
  newest_entry TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_entries,
    COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_entries,
    COALESCE(SUM(hit_count), 0) AS total_hits,
    COALESCE(AVG(hit_count), 0) AS avg_hits_per_entry,
    MIN(created_at) AS oldest_entry,
    MAX(created_at) AS newest_entry
  FROM public.api_cache;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER update_api_cache_updated_at
  BEFORE UPDATE ON public.api_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a scheduled job to clean expired cache (run every hour)
-- Note: This requires pg_cron extension to be enabled
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('clean-expired-cache', '0 * * * *', 'SELECT public.clean_expired_cache(1000);');

-- Insert initial cache configuration
INSERT INTO public.api_cache (cache_key, api_source, endpoint, parameters, response_data, status_code, expires_at)
VALUES (
  'config:cache_settings',
  'internal',
  '/config/cache',
  '{}'::jsonb,
  '{"default_ttl": 300, "max_ttl": 3600, "cleanup_batch_size": 1000}'::jsonb,
  200,
  NOW() + INTERVAL '1 year'
) ON CONFLICT (cache_key) DO NOTHING;

-- RLS Policies (if needed)
-- ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Cache is read-only for authenticated users" ON public.api_cache
--   FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Cache can be managed by service role" ON public.api_cache
--   FOR ALL USING (auth.role() = 'service_role');