-- Rate limit tracking table for external APIs
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  api_name TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 0,
  reset_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_api_rate_limits_reset_time ON public.api_rate_limits(reset_time);

-- Function to create table if it doesn't exist (for rate limit service initialization)
CREATE OR REPLACE FUNCTION public.create_rate_limit_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Table creation is handled by migration, this function is just a placeholder
  -- for the rate limit service to call without errors
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get rate limit status
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(p_api_name TEXT)
RETURNS TABLE (
  api_name TEXT,
  request_count INTEGER,
  reset_time TIMESTAMPTZ,
  remaining_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.api_name,
    rl.request_count,
    rl.reset_time,
    CASE 
      WHEN rl.reset_time IS NULL OR rl.reset_time <= NOW() THEN 0
      ELSE EXTRACT(EPOCH FROM (rl.reset_time - NOW()))::INTEGER
    END as remaining_seconds
  FROM public.api_rate_limits rl
  WHERE rl.api_name = p_api_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update rate limit
CREATE OR REPLACE FUNCTION public.update_rate_limit(
  p_api_name TEXT,
  p_request_count INTEGER,
  p_reset_time TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO public.api_rate_limits (
    api_name,
    request_count,
    reset_time,
    updated_at
  ) VALUES (
    p_api_name,
    p_request_count,
    p_reset_time,
    NOW()
  )
  ON CONFLICT (api_name) DO UPDATE SET
    request_count = EXCLUDED.request_count,
    reset_time = EXCLUDED.reset_time,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to reset rate limits (for testing or manual intervention)
CREATE OR REPLACE FUNCTION public.reset_rate_limit(p_api_name TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  IF p_api_name IS NULL THEN
    -- Reset all rate limits
    UPDATE public.api_rate_limits 
    SET request_count = 0,
        reset_time = NULL,
        updated_at = NOW();
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  ELSE
    -- Reset specific API rate limit
    UPDATE public.api_rate_limits 
    SET request_count = 0,
        reset_time = NULL,
        updated_at = NOW()
    WHERE api_name = p_api_name;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  END IF;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default rate limit configurations
INSERT INTO public.api_rate_limits (api_name, request_count, reset_time) VALUES
  ('massive', 0, NULL),
  ('alphavantage', 0, NULL),
  ('finnhub', 0, NULL),
  ('newsapi', 0, NULL),
  ('coingecko', 0, NULL)
ON CONFLICT (api_name) DO NOTHING;