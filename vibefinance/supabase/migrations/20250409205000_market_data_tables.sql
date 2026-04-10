-- Market data tables for storing financial data from various API providers
-- This migration creates tables for storing quotes, historical data, and market metadata

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Market assets table (stores metadata about financial instruments)
CREATE TABLE IF NOT EXISTS market_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    asset_type VARCHAR(50) NOT NULL, -- 'stock', 'crypto', 'etf', 'forex', 'index', 'future'
    exchange VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    sector VARCHAR(100),
    industry VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(500),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    data_source VARCHAR(50) NOT NULL, -- 'yahoo', 'massive', 'alphavantage', 'finnhub', 'coingecko'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(symbol, data_source)
);

-- Create index for faster lookups
CREATE INDEX idx_market_assets_symbol ON market_assets(symbol);
CREATE INDEX idx_market_assets_asset_type ON market_assets(asset_type);
CREATE INDEX idx_market_assets_data_source ON market_assets(data_source);
CREATE INDEX idx_market_assets_last_updated ON market_assets(last_updated);

-- Market quotes table (stores real-time/latest quotes)
CREATE TABLE IF NOT EXISTS market_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    change DECIMAL(20, 8) NOT NULL,
    change_percent DECIMAL(10, 4) NOT NULL,
    previous_close DECIMAL(20, 8),
    open DECIMAL(20, 8),
    day_high DECIMAL(20, 8),
    day_low DECIMAL(20, 8),
    volume BIGINT,
    market_cap BIGINT,
    avg_volume BIGINT,
    pe_ratio DECIMAL(10, 4),
    dividend_yield DECIMAL(10, 4),
    fifty_two_week_high DECIMAL(20, 8),
    fifty_two_week_low DECIMAL(20, 8),
    currency VARCHAR(10) DEFAULT 'USD',
    data_source VARCHAR(50) NOT NULL,
    quote_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(asset_id, quote_time, data_source)
);

-- Create index for faster lookups
CREATE INDEX idx_market_quotes_asset_id ON market_quotes(asset_id);
CREATE INDEX idx_market_quotes_symbol ON market_quotes(symbol);
CREATE INDEX idx_market_quotes_quote_time ON market_quotes(quote_time);
CREATE INDEX idx_market_quotes_data_source ON market_quotes(data_source);

-- Market historical data table (stores time-series data)
CREATE TABLE IF NOT EXISTS market_historical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    time_interval VARCHAR(20) NOT NULL, -- '1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M'
    date DATE NOT NULL,
    data_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(20, 8) NOT NULL,
    high DECIMAL(20, 8) NOT NULL,
    low DECIMAL(20, 8) NOT NULL,
    close DECIMAL(20, 8) NOT NULL,
    volume BIGINT,
    adjusted_close DECIMAL(20, 8),
    dividends DECIMAL(20, 8) DEFAULT 0,
    stock_splits DECIMAL(10, 4) DEFAULT 0,
    data_source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(asset_id, time_interval, data_timestamp, data_source)
);

-- Create index for faster lookups
CREATE INDEX idx_market_historical_asset_id ON market_historical_data(asset_id);
CREATE INDEX idx_market_historical_symbol ON market_historical_data(symbol);
CREATE INDEX idx_market_historical_time_interval ON market_historical_data(time_interval);
CREATE INDEX idx_market_historical_data_timestamp ON market_historical_data(data_timestamp);
CREATE INDEX idx_market_historical_date ON market_historical_data(date);
CREATE INDEX idx_market_historical_data_source ON market_historical_data(data_source);

-- Market news table (stores financial news)
CREATE TABLE IF NOT EXISTS market_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES market_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(100),
    author VARCHAR(200),
    image_url VARCHAR(1000),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sentiment_score DECIMAL(5, 4), -- -1.0 to 1.0
    sentiment_label VARCHAR(20), -- 'positive', 'negative', 'neutral'
    categories TEXT[], -- Array of categories
    data_source VARCHAR(50) NOT NULL, -- 'newsapi', 'finnhub', 'massive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(url, data_source)
);

-- Create index for faster lookups
CREATE INDEX idx_market_news_asset_id ON market_news(asset_id);
CREATE INDEX idx_market_news_symbol ON market_news(symbol);
CREATE INDEX idx_market_news_published_at ON market_news(published_at);
CREATE INDEX idx_market_news_data_source ON market_news(data_source);
CREATE INDEX idx_market_news_sentiment ON market_news(sentiment_score);

-- Market watchlist table (for tracking assets of interest)
CREATE TABLE IF NOT EXISTS market_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    notes TEXT,
    target_price DECIMAL(20, 8),
    alert_price DECIMAL(20, 8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, asset_id)
);

-- Create index for faster lookups
CREATE INDEX idx_market_watchlist_user_id ON market_watchlist(user_id);
CREATE INDEX idx_market_watchlist_asset_id ON market_watchlist(asset_id);

-- Market alerts table (for price alerts)
CREATE TABLE IF NOT EXISTS market_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'percent_change', 'volume_spike'
    trigger_value DECIMAL(20, 8) NOT NULL,
    current_value DECIMAL(20, 8),
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_market_alerts_user_id ON market_alerts(user_id);
CREATE INDEX idx_market_alerts_asset_id ON market_alerts(asset_id);
CREATE INDEX idx_market_alerts_is_triggered ON market_alerts(is_triggered);
CREATE INDEX idx_market_alerts_is_active ON market_alerts(is_active);

-- Market data update logs (for tracking data updates)
CREATE TABLE IF NOT EXISTS market_data_update_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES market_assets(id) ON DELETE CASCADE,
    symbol VARCHAR(50),
    data_type VARCHAR(50) NOT NULL, -- 'quote', 'historical', 'news', 'metadata'
    interval VARCHAR(20), -- For historical data
    from_date DATE,
    to_date DATE,
    records_updated INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'success', 'partial', 'failed'
    error_message TEXT,
    data_source VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_market_update_logs_asset_id ON market_data_update_logs(asset_id);
CREATE INDEX idx_market_update_logs_symbol ON market_data_update_logs(symbol);
CREATE INDEX idx_market_update_logs_data_type ON market_data_update_logs(data_type);
CREATE INDEX idx_market_update_logs_status ON market_data_update_logs(status);
CREATE INDEX idx_market_update_logs_data_source ON market_data_update_logs(data_source);
CREATE INDEX idx_market_update_logs_completed_at ON market_data_update_logs(completed_at);

-- Function to update asset last_updated timestamp
CREATE OR REPLACE FUNCTION update_asset_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE market_assets 
    SET last_updated = NOW()
    WHERE id = NEW.asset_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update asset last_updated when quote is inserted
CREATE TRIGGER trigger_update_asset_on_quote
    AFTER INSERT ON market_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_last_updated();

-- Function to clean old historical data (keep only last 2 years of daily data)
CREATE OR REPLACE FUNCTION clean_old_historical_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM market_historical_data
    WHERE time_interval = '1d'
    AND data_timestamp < NOW() - INTERVAL '2 years'
    AND data_source != 'manual'; -- Don't delete manually entered data
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest quote for a symbol
CREATE OR REPLACE FUNCTION get_latest_quote(p_symbol VARCHAR)
RETURNS TABLE (
    symbol VARCHAR,
    price DECIMAL,
    change DECIMAL,
    change_percent DECIMAL,
    volume BIGINT,
    quote_time TIMESTAMP WITH TIME ZONE,
    data_source VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.symbol,
        q.price,
        q.change,
        q.change_percent,
        q.volume,
        q.quote_time,
        q.data_source
    FROM market_quotes q
    WHERE q.symbol = p_symbol
    ORDER BY q.quote_time DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get historical data for a symbol
CREATE OR REPLACE FUNCTION get_historical_data(
    p_symbol VARCHAR,
    p_interval_val VARCHAR,
    p_from_date DATE,
    p_to_date DATE
)
RETURNS TABLE (
    date_val DATE,
    timestamp_val TIMESTAMP WITH TIME ZONE,
    open_val DECIMAL,
    high_val DECIMAL,
    low_val DECIMAL,
    close_val DECIMAL,
    volume_val BIGINT,
    data_source_val VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.date,
        h.data_timestamp,
        h.open,
        h.high,
        h.low,
        h.close,
        h.volume,
        h.data_source
    FROM market_historical_data h
    WHERE h.symbol = p_symbol
    AND h.time_interval = p_interval_val
    AND h.date >= p_from_date
    AND h.date <= p_to_date
    ORDER BY h.data_timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE market_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_update_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (market data should be publicly readable)
CREATE POLICY "Public can read market assets" ON market_assets
    FOR SELECT USING (true);

CREATE POLICY "Public can read market quotes" ON market_quotes
    FOR SELECT USING (true);

CREATE POLICY "Public can read market historical data" ON market_historical_data
    FOR SELECT USING (true);

CREATE POLICY "Public can read market news" ON market_news
    FOR SELECT USING (true);

CREATE POLICY "Public can read market data update logs" ON market_data_update_logs
    FOR SELECT USING (true);

-- Create policies for authenticated users (watchlist and alerts)
CREATE POLICY "Users can manage their own watchlist" ON market_watchlist
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own alerts" ON market_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Insert some popular assets as seed data
INSERT INTO market_assets (symbol, name, asset_type, exchange, currency, data_source) VALUES
    ('AAPL', 'Apple Inc.', 'stock', 'NASDAQ', 'USD', 'yahoo'),
    ('GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ', 'USD', 'yahoo'),
    ('MSFT', 'Microsoft Corporation', 'stock', 'NASDAQ', 'USD', 'yahoo'),
    ('AMZN', 'Amazon.com Inc.', 'stock', 'NASDAQ', 'USD', 'yahoo'),
    ('TSLA', 'Tesla Inc.', 'stock', 'NASDAQ', 'USD', 'yahoo'),
    ('BTC-USD', 'Bitcoin USD', 'crypto', 'CRYPTO', 'USD', 'yahoo'),
    ('ETH-USD', 'Ethereum USD', 'crypto', 'CRYPTO', 'USD', 'yahoo'),
    ('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 'NYSEARCA', 'USD', 'yahoo'),
    ('QQQ', 'Invesco QQQ Trust', 'etf', 'NASDAQ', 'USD', 'yahoo'),
    ('VTI', 'Vanguard Total Stock Market ETF', 'etf', 'NYSEARCA', 'USD', 'yahoo')
ON CONFLICT (symbol, data_source) DO NOTHING;

-- Create a view for latest quotes with asset details
CREATE OR REPLACE VIEW latest_market_quotes AS
SELECT 
    a.symbol,
    a.name,
    a.asset_type,
    a.exchange,
    a.currency,
    q.price,
    q.change,
    q.change_percent,
    q.volume,
    q.market_cap,
    q.quote_time,
    q.data_source,
    a.last_updated
FROM market_assets a
LEFT JOIN LATERAL (
    SELECT *
    FROM market_quotes q2
    WHERE q2.asset_id = a.id
    ORDER BY q2.quote_time DESC
    LIMIT 1
) q ON true
WHERE a.is_active = true;

-- Create a view for asset statistics
CREATE OR REPLACE VIEW asset_statistics AS
SELECT
    a.symbol,
    a.name,
    a.asset_type,
    COUNT(DISTINCT q.id) as quote_count,
    COUNT(DISTINCT h.id) as historical_data_count,
    MIN(h.data_timestamp) as first_data_date,
    MAX(h.data_timestamp) as last_data_date,
    COUNT(DISTINCT n.id) as news_count
FROM market_assets a
LEFT JOIN market_quotes q ON q.asset_id = a.id
LEFT JOIN market_historical_data h ON h.asset_id = a.id
LEFT JOIN market_news n ON n.asset_id = a.id
GROUP BY a.id, a.symbol, a.name, a.asset_type;

-- Create a materialized view for daily market summary (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_market_summary AS
SELECT 
    DATE(quote_time) as date,
    asset_type,
    COUNT(DISTINCT symbol) as asset_count,
    AVG(price) as avg_price,
    SUM(volume) as total_volume,
    SUM(market_cap) as total_market_cap,
    COUNT(CASE WHEN change_percent > 0 THEN 1 END) as gainers,
    COUNT(CASE WHEN change_percent < 0 THEN 1 END) as losers
FROM latest_market_quotes
GROUP BY DATE(quote_time), asset_type
WITH DATA;

-- Create index on materialized view
CREATE INDEX idx_daily_market_summary_date ON daily_market_summary(date);
CREATE INDEX idx_daily_market_summary_asset_type ON daily_market_summary(asset_type);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_market_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_market_summary;
END;
$$ LANGUAGE plpgsql;