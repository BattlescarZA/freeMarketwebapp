-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tables

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "theme": "dark",
    "currency": "USD",
    "notifications": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Portfolios Table
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_portfolios_default ON public.portfolios(user_id, is_default);

-- Add trigger for updated_at
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default portfolio per user
CREATE UNIQUE INDEX idx_one_default_portfolio 
  ON public.portfolios(user_id) 
  WHERE is_default = true;

-- Auto-create default portfolio on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.portfolios (user_id, name, is_default)
  VALUES (NEW.id, 'My Portfolio', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

-- 3. Assets Table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'etf', 'crypto', 'other')),
  exchange TEXT,
  logo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_assets_ticker ON public.assets(ticker);
CREATE INDEX idx_assets_type ON public.assets(asset_type);
CREATE INDEX idx_assets_exchange ON public.assets(exchange);

-- Add trigger for updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Holdings Table
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity >= 0),
  average_cost DECIMAL(20, 8) NOT NULL CHECK (average_cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, asset_id)
);

-- Add indexes
CREATE INDEX idx_holdings_portfolio ON public.holdings(portfolio_id);
CREATE INDEX idx_holdings_asset ON public.holdings(asset_id);

-- Add trigger for updated_at
CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Transactions Table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  price DECIMAL(20, 8) NOT NULL CHECK (price >= 0),
  fees DECIMAL(20, 8) DEFAULT 0 CHECK (fees >= 0),
  transaction_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_transactions_portfolio ON public.transactions(portfolio_id);
CREATE INDEX idx_transactions_asset ON public.transactions(asset_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);

-- Function to update holdings after transaction
CREATE OR REPLACE FUNCTION public.update_holdings_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_holding RECORD;
  new_quantity DECIMAL(20, 8);
  new_avg_cost DECIMAL(20, 8);
BEGIN
  -- Get current holding
  SELECT * INTO current_holding
  FROM public.holdings
  WHERE portfolio_id = NEW.portfolio_id AND asset_id = NEW.asset_id;

  IF NEW.transaction_type = 'buy' THEN
    IF current_holding IS NULL THEN
      -- Create new holding
      INSERT INTO public.holdings (portfolio_id, asset_id, quantity, average_cost)
      VALUES (NEW.portfolio_id, NEW.asset_id, NEW.quantity, NEW.price);
    ELSE
      -- Update existing holding
      new_quantity := current_holding.quantity + NEW.quantity;
      new_avg_cost := (
        (current_holding.quantity * current_holding.average_cost) +
        (NEW.quantity * NEW.price)
      ) / new_quantity;
      
      UPDATE public.holdings
      SET quantity = new_quantity,
          average_cost = new_avg_cost,
          updated_at = NOW()
      WHERE id = current_holding.id;
    END IF;
  ELSIF NEW.transaction_type = 'sell' THEN
    IF current_holding IS NULL THEN
      RAISE EXCEPTION 'Cannot sell asset not in portfolio';
    END IF;
    
    new_quantity := current_holding.quantity - NEW.quantity;
    
    IF new_quantity < 0 THEN
      RAISE EXCEPTION 'Cannot sell more than owned';
    ELSIF new_quantity = 0 THEN
      -- Remove holding if quantity reaches 0
      DELETE FROM public.holdings WHERE id = current_holding.id;
    ELSE
      -- Update quantity
      UPDATE public.holdings
      SET quantity = new_quantity,
          updated_at = NOW()
      WHERE id = current_holding.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_holdings_on_transaction();

-- 6. Watchlist Table
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  target_price DECIMAL(20, 8),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

-- Add indexes
CREATE INDEX idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX idx_watchlist_asset ON public.watchlist(asset_id);

-- 7. Price Alerts Table
CREATE TABLE public.price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below')),
  target_price DECIMAL(20, 8) NOT NULL CHECK (target_price > 0),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_price_alerts_user ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_asset ON public.price_alerts(asset_id);
CREATE INDEX idx_price_alerts_active ON public.price_alerts(is_active);

-- Row Level Security (RLS)

-- Enable RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Portfolios Policies
CREATE POLICY "Users can view own portfolios"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON public.portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
  ON public.portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Assets Policies
CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

-- Holdings Policies
CREATE POLICY "Users can view own holdings"
  ON public.holdings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own holdings"
  ON public.holdings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own holdings"
  ON public.holdings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own holdings"
  ON public.holdings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = holdings.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- Watchlist Policies
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own watchlist"
  ON public.watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
  ON public.watchlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Price Alerts Policies
CREATE POLICY "Users can view own price alerts"
  ON public.price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price alerts"
  ON public.price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price alerts"
  ON public.price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own price alerts"
  ON public.price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Seed Data: Add Sample Assets
INSERT INTO public.assets (ticker, name, asset_type, exchange) VALUES
  ('AAPL', 'Apple Inc.', 'stock', 'NASDAQ'),
  ('MSFT', 'Microsoft Corporation', 'stock', 'NASDAQ'),
  ('GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ'),
  ('AMZN', 'Amazon.com Inc.', 'stock', 'NASDAQ'),
  ('TSLA', 'Tesla Inc.', 'stock', 'NASDAQ'),
  ('META', 'Meta Platforms Inc.', 'stock', 'NASDAQ'),
  ('NVDA', 'NVIDIA Corporation', 'stock', 'NASDAQ'),
  ('SPY', 'SPDR S&P 500 ETF Trust', 'etf', 'NYSE'),
  ('QQQ', 'Invesco QQQ Trust', 'etf', 'NASDAQ'),
  ('BTC-USD', 'Bitcoin', 'crypto', 'Crypto'),
  ('ETH-USD', 'Ethereum', 'crypto', 'Crypto')
ON CONFLICT (ticker) DO NOTHING;