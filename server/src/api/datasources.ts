import { Router, Request, Response } from 'express';
import { postgresService } from '../services/postgresService';
import { DataSourceConfig } from '../types/datasource';
import { datasourceRepository } from '../database/repositories/datasourceRepository';

const router = Router();

const loadDataSources = async () => {
  try {
    const sources = await datasourceRepository.findAll();
    sources.forEach(source => {
      const config: DataSourceConfig = {
        id: source.uid,
        name: source.datasource_name,
        type: source.type as any,
        url: source.url,
        database: source.database,
        user: 'postgres',
        password: 'root',
        sslMode: 'disable',
        maxOpenConns: 10
      };
      postgresService.addDataSource(config).catch(console.error);
    });
    console.log(`✅ Loaded ${sources.length} datasources from database`);
  } catch (error) {
    console.error('Error loading datasources:', error);
    console.log('📝 Starting with empty datasources storage');
  }
};

loadDataSources();

// GET /api/datasources - List all data sources
router.get('/', async (req: Request, res: Response) => {
  try {
    const sources = await datasourceRepository.findAll();
    const dataSources = sources.map(source => ({
      id: source.uid,
      name: source.datasource_name,
      type: source.type,
      url: source.url,
      database: source.database,
      user: 'postgres',
      password: 'root',
      sslMode: 'disable',
      maxOpenConns: 10
    }));
    console.log('GET /api/datasources - returning:', dataSources.length, 'data sources');
    res.json(dataSources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

// POST /api/datasources - Create new data source
router.post('/', async (req: Request, res: Response) => {
  try {
    const config: DataSourceConfig = req.body;
    
    if (!config.id) {
      config.id = `ds-${Date.now()}`;
    }

    const testResult = await postgresService.testDataSource(config);
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed', 
        message: testResult.message 
      });
    }

    await datasourceRepository.create({
      uid: config.id,
      datasource_name: config.name,
      type: config.type,
      url: config.url,
      database: config.database
    });
    
    await postgresService.addDataSource(config);
    
    console.log('Data source saved:', config);

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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const source = await datasourceRepository.findByUid(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    res.json({
      id: source.uid,
      name: source.datasource_name,
      type: source.type,
      url: source.url,
      database: source.database,
      user: 'postgres',
      password: 'root',
      sslMode: 'disable',
      maxOpenConns: 10
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data source' });
  }
});

// PUT /api/datasources/:id - Update data source
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const config: DataSourceConfig = { ...req.body, id: req.params.id };
    
    const testResult = await postgresService.testDataSource(config);
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed', 
        message: testResult.message 
      });
    }

    await datasourceRepository.update(req.params.id, {
      datasource_name: config.name,
      type: config.type,
      url: config.url,
      database: config.database
    });
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
    
    const source = await datasourceRepository.findByUid(id);
    if (!source) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    await postgresService.removeDataSource(id);
    await datasourceRepository.delete(id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete data source', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/datasources/debug - Debug endpoint
router.get('/debug', async (req: Request, res: Response) => {
  try {
    const sources = await datasourceRepository.findAll();
    res.json({
      totalDataSources: sources.length,
      dataSourceIds: sources.map(s => s.uid),
      postgresConnections: postgresService.getConnectionIds()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch debug info' });
  }
});

export default router;