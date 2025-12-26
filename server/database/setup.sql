-- Complete setup script for Grafana Mirror PostgreSQL database
-- Run this script to create database, tables, and indexes

-- Step 1: Create database (run this first in your postgres database)
-- CREATE DATABASE grafana_mirror;

-- Step 2: Connect to grafana_mirror database and run the following:

-- Create tables
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY,
    "user" VARCHAR(255) NOT NULL,
    api_key VARCHAR(500) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used TIMESTAMP
);

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

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datasources_updated_at BEFORE UPDATE ON datasources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys("user");
CREATE INDEX IF NOT EXISTS idx_api_keys_role ON api_keys(role);
CREATE INDEX IF NOT EXISTS idx_api_keys_created ON api_keys(created DESC);

CREATE INDEX IF NOT EXISTS idx_dashboards_title ON dashboards(title);
CREATE INDEX IF NOT EXISTS idx_dashboards_tags ON dashboards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboards_updated_at ON dashboards(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_datasources_name ON datasources(datasource_name);
CREATE INDEX IF NOT EXISTS idx_datasources_type ON datasources(type);
CREATE INDEX IF NOT EXISTS idx_datasources_created_at ON datasources(created_at DESC);

-- Verify tables created
SELECT 'Tables created successfully!' AS status;
\dt
