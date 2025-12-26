import { Router, Request, Response } from 'express';
import { authenticateApiKey, requireRole } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Persistent storage for dashboards
const storageFile = path.join(process.cwd(), 'data', 'dashboards.json');
const dashboards: Map<string, any> = new Map();

// Load dashboards from file
const loadDashboards = async () => {
  try {
    const dataDir = path.dirname(storageFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    const data = await fs.readFile(storageFile, 'utf-8');
    const loadedDashboards = JSON.parse(data);
    
    loadedDashboards.forEach((dashboard: any) => {
      dashboards.set(dashboard.uid, dashboard);
    });
    console.log(`✅ Loaded ${loadedDashboards.length} dashboards from storage`);
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      console.error('Error loading dashboards:', error);
    }
    console.log('📝 Starting with empty dashboards storage');
  }
};

// Save dashboards to file
const saveDashboards = async () => {
  try {
    const dataDir = path.dirname(storageFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    const dashboardList = Array.from(dashboards.values());
    await fs.writeFile(storageFile, JSON.stringify(dashboardList, null, 2));
  } catch (error) {
    console.error('Error saving dashboards:', error);
  }
};

// Initialize storage
loadDashboards();

// Apply API key authentication to all dashboard routes EXCEPT listing
// Allow public access to dashboard listing for frontend
router.get('/', (req: Request, res: Response) => {
  try {
    const dashboardList = Array.from(dashboards.values()).map(dashboard => ({
      id: dashboard.id,
      uid: dashboard.uid,
      title: dashboard.title,
      tags: dashboard.tags || [],
      url: `/d/${dashboard.uid}/${dashboard.slug}`,
      isStarred: false,
      folderId: dashboard.folderId || 0,
      folderUid: dashboard.folderUid || '',
      folderTitle: dashboard.folderTitle || '',
      folderUrl: dashboard.folderUrl || '',
      type: 'dash-db',
      uri: `db/${dashboard.slug}`
    }));
    res.json(dashboardList);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch dashboards', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/dashboards/uid/:uid - Get dashboard by UID (public access for frontend)
router.get('/uid/:uid', (req: Request, res: Response) => {
  try {
    const dashboard = Array.from(dashboards.values()).find(d => d.uid === req.params.uid);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      meta: {
        type: 'db',
        canSave: false,
        canEdit: false,
        canAdmin: false,
        canStar: true,
        slug: dashboard.slug,
        url: `/d/${dashboard.uid}/${dashboard.slug}`,
        expires: '0001-01-01T00:00:00Z',
        created: dashboard.created || new Date().toISOString(),
        updated: dashboard.updated || new Date().toISOString(),
        updatedBy: 'admin',
        createdBy: 'admin',
        version: dashboard.version || 1,
        hasAcl: false,
        isFolder: false,
        folderId: dashboard.folderId || 0,
        folderUid: dashboard.folderUid || '',
        folderTitle: dashboard.folderTitle || '',
        folderUrl: dashboard.folderUrl || '',
        provisioned: false,
        provisionedExternalId: ''
      },
      dashboard
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch dashboard', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Apply API key authentication to modification routes
router.use(authenticateApiKey);

// POST /api/dashboards/db - Create or update dashboard
router.post('/db', requireRole(['Admin', 'Editor']), async (req: Request, res: Response) => {
  try {
    const { dashboard, folderId, overwrite } = req.body;
    
    if (!dashboard) {
      return res.status(400).json({ error: 'Dashboard is required' });
    }

    // Generate UID if not provided
    if (!dashboard.uid) {
      dashboard.uid = `dash-${Date.now()}`;
    }

    // Generate slug from title
    if (!dashboard.slug && dashboard.title) {
      dashboard.slug = dashboard.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Set metadata
    const now = new Date().toISOString();
    dashboard.id = dashboard.id || Date.now();
    dashboard.version = (dashboard.version || 0) + 1;
    dashboard.updated = now;
    dashboard.folderId = folderId || 0;
    
    if (!dashboards.has(dashboard.uid)) {
      dashboard.created = now;
    }

    dashboards.set(dashboard.uid, dashboard);
    await saveDashboards();

    res.json({
      id: dashboard.id,
      uid: dashboard.uid,
      url: `/d/${dashboard.uid}/${dashboard.slug}`,
      status: 'success',
      version: dashboard.version,
      slug: dashboard.slug
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to save dashboard', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// DELETE /api/dashboards/uid/:uid - Delete dashboard
router.delete('/uid/:uid', requireRole(['Admin', 'Editor']), async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid;
    const dashboard = Array.from(dashboards.values()).find(d => d.uid === uid);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    dashboards.delete(uid);
    await saveDashboards();
    
    res.json({
      title: dashboard.title,
      message: 'Dashboard deleted',
      id: dashboard.id
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete dashboard', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/search - Search dashboards
router.get('/search', requireRole(['Admin', 'Editor', 'Viewer']), (req: Request, res: Response) => {
  try {
    const { query, tag, type, dashboardIds, folderIds, starred, limit } = req.query;
    
    let results = Array.from(dashboards.values());
    
    // Filter by query
    if (query) {
      const searchTerm = (query as string).toLowerCase();
      results = results.filter(d => 
        d.title?.toLowerCase().includes(searchTerm) ||
        d.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filter by tag
    if (tag) {
      results = results.filter(d => d.tags?.includes(tag));
    }
    
    // Apply limit
    if (limit) {
      results = results.slice(0, parseInt(limit as string));
    }
    
    const searchResults = results.map(dashboard => ({
      id: dashboard.id,
      uid: dashboard.uid,
      title: dashboard.title,
      uri: `db/${dashboard.slug}`,
      url: `/d/${dashboard.uid}/${dashboard.slug}`,
      slug: dashboard.slug,
      type: 'dash-db',
      tags: dashboard.tags || [],
      isStarred: false,
      folderId: dashboard.folderId || 0,
      folderUid: dashboard.folderUid || '',
      folderTitle: dashboard.folderTitle || '',
      folderUrl: dashboard.folderUrl || ''
    }));

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ 
      error: 'Search failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;