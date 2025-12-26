# Database Setup Instructions

## 1. Create Database

```sql
CREATE DATABASE grafana_mirror;
```

## 2. Run Schema Creation

Connect to your database and run:

```bash
psql -U postgres -d grafana_mirror -f create-tables.sql
```

Or manually execute the SQL:

```sql
-- Run the contents of create-tables.sql
```

## 3. Create Indexes (Optional but Recommended)

```bash
psql -U postgres -d grafana_mirror -f create-indexes.sql
```

## 4. Verify Tables

```sql
\dt
```

You should see:
- api_keys
- dashboards
- datasources

## 5. Configure Application

Update `server/.env` or `config.json` with database connection details:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grafana_mirror
DB_USER=postgres
DB_PASSWORD=your_password
```

## 6. Run Migration (After backend code is ready)

```bash
npm run migrate-json-to-postgres
```
