# PostgreSQL Setup Guide for Grafana Mirror

## Prerequisites
- PostgreSQL installed (local or remote server)
- Database access credentials

---

## Step 1: Create Database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

```sql
CREATE DATABASE grafana_mirror;
\q
```

---

## Step 2: Run Setup Script

### Option A: Using the complete setup.sql file

```bash
cd server/database
psql -U postgres -d grafana_mirror -f setup.sql
```

### Option B: Run individual files

```bash
cd server/database
psql -U postgres -d grafana_mirror -f create-tables.sql
psql -U postgres -d grafana_mirror -f create-indexes.sql
```

---

## Step 3: Configure Environment Variables

Update `server/.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=grafana_mirror
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_SSL=false
```

**For Remote/Server Database:**
```env
POSTGRES_HOST=your.server.ip.address
POSTGRES_PORT=5432
POSTGRES_DB=grafana_mirror
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_SSL=true
```

---

## Step 4: Migrate Existing Data (Optional)

If you have existing data in JSON files:

```bash
cd server
npm run migrate
```

This will:
- ✅ Read data from `data/api-keys.json`
- ✅ Read data from `data/dashboards.json`
- ✅ Read data from `data/datasources.json`
- ✅ Insert all data into PostgreSQL tables

---

## Step 5: Start the Server

```bash
cd server
npm run dev
```

You should see:
```
✅ PostgreSQL connected
✅ Loaded X datasources from database
Server running on port 3002
```

---

## Verification

### Check Tables Created

```sql
psql -U postgres -d grafana_mirror

\dt
```

You should see:
- `api_keys`
- `dashboards`
- `datasources`

### Check Data Migrated

```sql
SELECT COUNT(*) FROM api_keys;
SELECT COUNT(*) FROM dashboards;
SELECT COUNT(*) FROM datasources;
```

### Test API Endpoints

```bash
# List dashboards
curl http://localhost:3002/api/dashboards

# List datasources
curl http://localhost:3002/api/datasources

# List API keys (requires authentication)
curl http://localhost:3002/api/auth/keys
```

---

## Troubleshooting

### Error: "relation 'api_keys' does not exist"
**Solution:** Run the setup.sql script again

### Error: "password authentication failed"
**Solution:** Check your POSTGRES_PASSWORD in .env file

### Error: "duplicate key value violates unique constraint"
**Solution:** Data already exists in database (this is normal during re-migration)

### Migration Script Not Working
**Solution:** 
1. Ensure JSON files exist in `server/data/` folder
2. Check file permissions
3. Run with `tsx src/scripts/migrate-json-to-postgres.ts` directly

----------(table query)----------------

## Database Schema

-- Create API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY,
    "user" VARCHAR(255) NOT NULL,
    api_key VARCHAR(500) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used TIMESTAMP
);

-- Create Dashboards Table
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

-- Create Datasources Table
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

-- Apply trigger to dashboards table
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to datasources table
CREATE TRIGGER update_datasources_updated_at BEFORE UPDATE ON datasources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
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


---------------------(table query)---------------

## Benefits of PostgreSQL Storage

✅ **Scalability**: No file size limits
✅ **Performance**: Indexed queries, faster searches
✅ **Concurrency**: Multiple users can modify simultaneously
✅ **ACID**: Data integrity guaranteed
✅ **Backup**: Easy database backups with pg_dump
✅ **Remote Access**: Connect from multiple servers
✅ **Security**: Role-based access control

---

## Backup & Restore

### Backup
```bash
pg_dump -U postgres grafana_mirror > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U postgres -d grafana_mirror < backup_20251226.sql
```

---

## Next Steps

1. ✅ Setup complete
2. Test dashboard creation via API
3. Import your PowerShell script dashboard
4. Configure datasources
5. (Optional) Delete JSON files after confirming migration success

---

**Need Help?** Check logs in the terminal where `npm run dev` is running.
