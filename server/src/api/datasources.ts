import { Router, Request, Response } from 'express';
import { postgresService } from '../services/postgresService';
import { DataSourceConfig } from '../types/datasource';
import fs from 'fs';
import path from 'path';

const router = Router();
const DATA_FILE = path.join(__dirname, '../../datasources.json');

// Store data sources in memory (in production, use database)
const dataSources: Map<string, DataSourceConfig> = new Map();

// Load data sources from file on startup
const loadDataSources = async () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const sources: DataSourceConfig[] = JSON.parse(data);
      
      for (const source of sources) {
        dataSources.set(source.id, source);
        // Re-establish connection
        try {
          await postgresService.addDataSource(source);
          console.log(`Restored connection for data source: ${source.name}`);
        } catch (err) {
          console.error(`Failed to restore connection for ${source.name}:`, err);
        }
      }
      console.log(`Loaded ${sources.length} data sources from disk`);
    }
  } catch (error) {
    console.error('Failed to load data sources:', error);
  }
};

// Save data sources to file
const saveDataSources = () => {
  try {
    const sources = Array.from(dataSources.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(sources, null, 2));
    console.log('Data sources saved to disk');
  } catch (error) {
    console.error('Failed to save data sources:', error);
  }
};

// Initialize
loadDataSources();

// GET /api/datasources - List all data sources
router.get('/', (req: Request, res: Response) => {
  const sources = Array.from(dataSources.values());
  console.log('GET /api/datasources - returning:', sources.length, 'data sources');
  console.log('Data sources:', sources);
  res.json(sources);
});

// POST /api/datasources - Create new data source
router.post('/', async (req: Request, res: Response) => {
  try {
    const config: DataSourceConfig = req.body;
    
    // Generate ID if not provided
    if (!config.id) {
      config.id = `ds-${Date.now()}`;
    }

    // Test connection before saving
    const testResult = await postgresService.testDataSource(config);
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed', 
        message: testResult.message 
      });
    }

    // Save data source
    dataSources.set(config.id, config);
    saveDataSources();
    
    // Add to PostgreSQL service for query execution
    await postgresService.addDataSource(config);
    
    console.log('Data source saved:', config);
    console.log('Total data sources now:', dataSources.size);
    console.log('PostgreSQL service connections:', Array.from(postgresService.getConnectionIds()));

    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create data source', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/datasources/test - Test data source connection
router.post('/test', async (req: Request, res: Response) => {
  try {
    const config: DataSourceConfig = req.body;
    const result = await postgresService.testDataSource(config);
    
    res.json({
      status: result.success ? 'success' : 'error',
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Test failed'
    });
  }
});

// GET /api/datasources/:id - Get specific data source
router.get('/:id', (req: Request, res: Response) => {
  const dataSource = dataSources.get(req.params.id);
  if (!dataSource) {
    return res.status(404).json({ error: 'Data source not found' });
  }
  res.json(dataSource);
});

// PUT /api/datasources/:id - Update data source
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const config: DataSourceConfig = { ...req.body, id: req.params.id };
    
    // Test connection
    const testResult = await postgresService.testDataSource(config);
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed', 
        message: testResult.message 
      });
    }

    // Update data source
    dataSources.set(config.id, config);
    saveDataSources();
    await postgresService.addDataSource(config);

    res.json(config);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update data source', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// DELETE /api/datasources/:id - Delete data source
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!dataSources.has(id)) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    await postgresService.removeDataSource(id);
    dataSources.delete(id);
    saveDataSources();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete data source', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/datasources/debug - Debug endpoint
router.get('/debug', (req: Request, res: Response) => {
  res.json({
    totalDataSources: dataSources.size,
    dataSourceIds: Array.from(dataSources.keys()),
    postgresConnections: postgresService.getConnectionIds()
  });
});

export default router;