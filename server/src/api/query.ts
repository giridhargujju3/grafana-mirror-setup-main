import { Router, Request, Response } from 'express';
import { PostgreSQLService } from '../services/postgresService';
import { QueryRequest, QueryResponse } from '../types/datasource';

const router = Router();
const postgresService = new PostgreSQLService();

// POST /api/query - Execute queries (Grafana-style endpoint)
router.post('/', async (req: Request, res: Response) => {
  try {
    const queryRequest: QueryRequest = req.body;
    
    if (!queryRequest.queries || queryRequest.queries.length === 0) {
      return res.status(400).json({ error: 'No queries provided' });
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
    const { datasource, query } = req.body;
    
    if (!datasource || !query) {
      return res.status(400).json({ error: 'Datasource and query are required' });
    }

    const testQuery = {
      refId: 'test',
      datasource,
      rawSql: query,
      format: 'table' as const
    };

    const result = await postgresService.executeQuery(datasource, testQuery);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Query test failed'
    });
  }
});

export default router;