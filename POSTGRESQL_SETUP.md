# PostgreSQL Integration Setup

This guide explains how to set up PostgreSQL integration with your Grafana Mirror application, following the official Grafana workflow.

## Prerequisites

1. **PostgreSQL Database**: Install and configure PostgreSQL
2. **Node.js**: Version 18 or higher
3. **npm**: Comes with Node.js

## Quick Setup

### 1. Install Backend Dependencies
```bash
# Run the setup script (Windows)
setup-backend.bat

# Or manually:
cd server
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit .env with your PostgreSQL details
```

### 3. Start Both Frontend and Backend
```bash
# Install concurrently if not already installed
npm install

# Start both frontend and backend
npm run dev:full
```

## Manual Setup Steps

### Backend Setup
```bash
cd server
npm install
npm run dev
```

### Frontend Setup
```bash
npm run dev
```

## PostgreSQL Connection Configuration

### Step 1: Access Data Sources
1. Open your application at `http://localhost:3000`
2. Navigate to **Connections** → **Data sources**
3. Click **Add data source**
4. Select **PostgreSQL**

### Step 2: Configure Connection
Fill in the following fields:

- **Name**: Give your data source a name (e.g., "My PostgreSQL DB")
- **Host**: Your PostgreSQL server host (e.g., `localhost`)
- **Port**: PostgreSQL port (default: `5432`)
- **Database**: Database name
- **User**: PostgreSQL username
- **Password**: PostgreSQL password
- **SSL Mode**: Choose appropriate SSL mode:
  - `disable`: No SSL (development only)
  - `require`: Require SSL
  - `verify-ca`: Verify certificate authority
  - `verify-full`: Full certificate verification

### Step 3: Test Connection
1. Click **Test Connection** button
2. Verify you see "Connection successful!" message
3. Click **Save & Test** to save the data source

## Using PostgreSQL Data

### Explore Mode
1. Go to **Explore** page
2. Select your PostgreSQL data source
3. Write SQL queries in the query editor
4. Click **Run Query** to execute

### Dashboard Creation
1. Create a new dashboard
2. Add a panel
3. Select PostgreSQL as data source
4. Write your SQL query
5. Choose visualization type (Time series, Table, etc.)

## Example Queries

### Time Series Data
```sql
SELECT 
  created_at as time,
  cpu_usage,
  memory_usage
FROM system_metrics 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at;
```

### Table Data
```sql
SELECT 
  server_name,
  status,
  last_seen
FROM servers
ORDER BY last_seen DESC;
```

### Aggregated Data
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as time,
  AVG(cpu_usage) as avg_cpu,
  MAX(memory_usage) as max_memory
FROM system_metrics 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY time;
```

## Troubleshooting

### Connection Issues
- **"Connection refused"**: Check if PostgreSQL is running
- **"Authentication failed"**: Verify username/password
- **"Database does not exist"**: Create the database first
- **SSL errors**: Adjust SSL mode settings

### Query Issues
- **"No data"**: Check your WHERE clauses and time ranges
- **"Syntax error"**: Verify SQL syntax
- **"Permission denied"**: Check user permissions on tables

### Performance Issues
- Add indexes on frequently queried columns
- Use LIMIT clauses for large datasets
- Consider connection pooling settings

## API Endpoints

The backend provides these Grafana-compatible endpoints:

- `GET /api/health` - Health check
- `GET /api/datasources` - List data sources
- `POST /api/datasources` - Create data source
- `POST /api/datasources/test` - Test connection
- `POST /api/query` - Execute queries

## Security Best Practices

1. **Use SSL**: Always use SSL in production
2. **Least Privilege**: Create dedicated database users with minimal permissions
3. **Environment Variables**: Store credentials in environment variables
4. **Connection Limits**: Configure appropriate connection pool limits
5. **Query Timeouts**: Set reasonable query timeout limits

## Next Steps

1. Create sample dashboards with your PostgreSQL data
2. Set up alerting rules based on your metrics
3. Configure dashboard variables for dynamic queries
4. Explore advanced visualization options