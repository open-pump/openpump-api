-- OpenPump Database Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(64) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'starter', 'pro', 'elite'))
);

CREATE INDEX idx_api_keys_key ON api_keys(key) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- API Usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

-- Token cache (stores discovered tokens)
CREATE TABLE IF NOT EXISTS tokens (
  mint VARCHAR(44) PRIMARY KEY,
  name VARCHAR(255),
  symbol VARCHAR(100),
  description TEXT,
  image TEXT,
  decimals INTEGER NOT NULL DEFAULT 6,
  supply NUMERIC(20, 0),
  creator VARCHAR(44),
  uri TEXT,
  quality_score INTEGER DEFAULT 0,
  category VARCHAR(20) DEFAULT 'unknown',
  bonding_progress NUMERIC(5, 2) DEFAULT 0,
  sol_raised NUMERIC(20, 9) DEFAULT 0,
  market_cap_usd NUMERIC(20, 2) DEFAULT 0,
  is_graduated BOOLEAN DEFAULT FALSE,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT valid_category CHECK (category IN ('new', 'final-stretch', 'graduated', 'unknown'))
);

CREATE INDEX idx_tokens_category ON tokens(category);
CREATE INDEX idx_tokens_quality_score ON tokens(quality_score);
CREATE INDEX idx_tokens_first_seen_at ON tokens(first_seen_at DESC);
CREATE INDEX idx_tokens_bonding_progress ON tokens(bonding_progress);
CREATE INDEX idx_tokens_is_graduated ON tokens(is_graduated);
CREATE INDEX idx_tokens_metadata ON tokens USING GIN (metadata);

-- Social links
CREATE TABLE IF NOT EXISTS token_social_links (
  id BIGSERIAL PRIMARY KEY,
  mint VARCHAR(44) NOT NULL REFERENCES tokens(mint) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mint, platform)
);

CREATE INDEX idx_token_social_links_mint ON token_social_links(mint);

-- Price history (time-series data)
CREATE TABLE IF NOT EXISTS price_snapshots (
  id BIGSERIAL PRIMARY KEY,
  mint VARCHAR(44) NOT NULL REFERENCES tokens(mint) ON DELETE CASCADE,
  price_usd NUMERIC(20, 10) NOT NULL,
  price_sol NUMERIC(20, 10) NOT NULL,
  market_cap_usd NUMERIC(20, 2),
  liquidity_usd NUMERIC(20, 2),
  volume_24h NUMERIC(20, 2),
  source VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_price_snapshots_mint_timestamp ON price_snapshots(mint, timestamp DESC);
CREATE INDEX idx_price_snapshots_timestamp ON price_snapshots(timestamp);

-- Token pairs
CREATE TABLE IF NOT EXISTS token_pairs (
  id BIGSERIAL PRIMARY KEY,
  pair_address VARCHAR(44) UNIQUE NOT NULL,
  mint VARCHAR(44) NOT NULL REFERENCES tokens(mint) ON DELETE CASCADE,
  dex VARCHAR(50) NOT NULL,
  base_token VARCHAR(44) NOT NULL,
  quote_token VARCHAR(44) NOT NULL,
  liquidity_usd NUMERIC(20, 2),
  volume_24h NUMERIC(20, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_token_pairs_mint ON token_pairs(mint);
CREATE INDEX idx_token_pairs_pair_address ON token_pairs(pair_address);

-- Views for common queries
CREATE OR REPLACE VIEW recent_tokens AS
SELECT
  t.*,
  COALESCE(
    json_agg(
      json_build_object('platform', tsl.platform, 'url', tsl.url)
    ) FILTER (WHERE tsl.id IS NOT NULL),
    '[]'::json
  ) as social_links
FROM tokens t
LEFT JOIN token_social_links tsl ON t.mint = tsl.mint
WHERE t.first_seen_at > NOW() - INTERVAL '24 hours'
GROUP BY t.mint
ORDER BY t.first_seen_at DESC;

CREATE OR REPLACE VIEW final_stretch_tokens AS
SELECT
  t.*,
  COALESCE(
    json_agg(
      json_build_object('platform', tsl.platform, 'url', tsl.url)
    ) FILTER (WHERE tsl.id IS NOT NULL),
    '[]'::json
  ) as social_links
FROM tokens t
LEFT JOIN token_social_links tsl ON t.mint = tsl.mint
WHERE t.category = 'final-stretch'
  AND t.bonding_progress >= 70
  AND t.bonding_progress < 100
  AND t.is_graduated = FALSE
GROUP BY t.mint
ORDER BY t.bonding_progress DESC;

CREATE OR REPLACE VIEW graduated_tokens AS
SELECT
  t.*,
  COALESCE(
    json_agg(
      json_build_object('platform', tsl.platform, 'url', tsl.url)
    ) FILTER (WHERE tsl.id IS NOT NULL),
    '[]'::json
  ) as social_links
FROM tokens t
LEFT JOIN token_social_links tsl ON t.mint = tsl.mint
WHERE t.is_graduated = TRUE
  OR t.bonding_progress >= 100
GROUP BY t.mint
ORDER BY t.last_updated_at DESC;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup old API usage data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM api_usage
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old price snapshots (keep last 90 days of 1-min data, aggregate older)
CREATE OR REPLACE FUNCTION cleanup_old_price_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM price_snapshots
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
