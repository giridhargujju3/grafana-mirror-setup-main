import { Router, Request, Response } from 'express';
import { postgresService } from '../services/postgresService';
import { QueryRequest, QueryResponse } from '../types/datasource';

const router = Router();

// GET /api/query/debug - Debug endpoint to check connections
router.get('/debug', (req: Request, res: Response) => {
  const connections = postgresService.getConnectionIds();
  res.json({
    availableConnections: connections,
    connectionCount: connections.length,
    timestamp: new Date().toISOString()
  });
});

// POST /api/query - Execute queries (Grafana-style endpoint)
router.post('/', async (req: Request, res: Response) => {
  try {
    const queryRequest: QueryRequest = req.body;
    
    if (!queryRequest.queries || queryRequest.queries.length === 0) {
      return res.status(400).json({ error: 'No queries provided' });
    }

    // Check if any datasources are configured
    const availableConnections = postgresService.getConnectionIds();
    if (availableConnections.length === 0) {
      return res.status(400).json({
        error: 'No data sources configured. Please add a PostgreSQL data source first.'
      });
    }

    const results = [];

    for (const query of queryRequest.queries) {
      try {
        const dataFrame = await postgresService.executeQuery(query.datasource, query);
        results.push(dataFrame);
      } catch (error) {
        // Return error for this specific query
        results.push({
          refId: query.refId,
          error: error instanceof Error ? error.message : 'Query execution failed',
          fields: [],
          length: 0
        });
      }
    }

    const response: QueryResponse = {
      data: results
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Query execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/query/test - Test a single query
router.post('/test', async (req: Request, res: Response) => {
  try {
    console.log('Query test request:', req.body);
    const { datasource, query } = req.body;
    
    if (!datasource || !query) {
      console.log('Missing datasource or query:', { datasource, query });
      return res.status(400).json({ 
        success: false,
        error: 'Datasource and query are required' 
      });
    }

    // Check if datasource exists
    const availableConnections = postgresService.getConnectionIds();
    console.log('Available connections:', availableConnections);
    
    if (availableConnections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data sources configured. Please add a PostgreSQL data source first.'
      });
    }
    
    if (!availableConnections.includes(datasource)) {
      return res.status(400).json({
        success: false,
        error: `Data source '${datasource}' not found. Available: ${availableConnections.join(', ')}`
      });
    }

    const testQuery = {
      refId: 'test',
      datasource,
      rawSql: query,
      format: 'table' as const
    };

    console.log('Executing query:', testQuery);
    const result = await postgresService.executeQuery(datasource, testQuery);
    console.log('Query result:', result);
    
    // Transform result to match frontend expectations
    const transformedResult = {
      columns: result.fields.map(f => f.name),
      rows: [],
      rowCount: result.length
    };
    
    // Transform field data to rows
    for (let i = 0; i < result.length; i++) {
      const row = result.fields.map(field => field.values[i]);
      transformedResult.rows.push(row);
    }
    
    res.json({ success: true, data: transformedResult });
  } catch (error) {
    console.error('Query test error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Query test failed'
    });
  }
});

export default router;