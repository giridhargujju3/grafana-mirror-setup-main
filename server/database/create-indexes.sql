-- Grafana Mirror PostgreSQL Indexes
-- Create indexes for better query performance

-- API Keys Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys("user");
CREATE INDEX IF NOT EXISTS idx_api_keys_role ON api_keys(role);
CREATE INDEX IF NOT EXISTS idx_api_keys_created ON api_keys(created DESC);

-- Dashboards Indexes
CREATE INDEX IF NOT EXISTS idx_dashboards_title ON dashboards(title);
CREATE INDEX IF NOT EXISTS idx_dashboards_tags ON dashboards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboards_updated_at ON dashboards(updated_at DESC);

-- Datasources Indexes
CREATE INDEX IF NOT EXISTS idx_datasources_name ON datasources(datasource_name);
CREATE INDEX IF NOT EXISTS idx_datasources_type ON datasources(type);
CREATE INDEX IF NOT EXISTS idx_datasources_created_at ON datasources(created_at DESC);
