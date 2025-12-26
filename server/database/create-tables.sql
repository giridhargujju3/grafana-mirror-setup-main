-- Grafana Mirror PostgreSQL Schema
-- Create tables for storing API keys, dashboards, and datasources

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY,
    "user" VARCHAR(255) NOT NULL,
    api_key VARCHAR(500) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used TIMESTAMP
);

-- 2. Dashboards Table
CREATE TABLE IF NOT EXISTS dashboards (
    id BIGINT PRIMARY KEY,
    uid VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    tags TEXT[],
    timezone VARCHAR(100),
    schema_version INTEGER,
    version INTEGER DEFAULT 1,
    refresh VARCHAR(50),
    time JSONB,
    panels JSONB NOT NULL,
    dashboard_link TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Datasources Table
CREATE TABLE IF NOT EXISTS datasources (
    uid VARCHAR(100) PRIMARY KEY,
    datasource_name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    database VARCHAR(255),
    dashboard_link TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to dashboards table
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to datasources table
CREATE TRIGGER update_datasources_updated_at BEFORE UPDATE ON datasources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
