import { Router, Request, Response } from 'express';
import { authenticateApiKey, requireRole } from '../middleware/auth';
import { dashboardRepository } from '../database/repositories/dashboardRepository';

const router = Router();

// Apply API key authentication to all dashboard routes EXCEPT listing
// Allow public access to dashboard listing for frontend
router.get('/', async (req: Request, res: Response) => {
  try {
    const dashboards = await dashboardRepository.findAll();
    const dashboardList = dashboards.map(dashboard => {
      const slug = dashboard.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || dashboard.uid;
      return {
        id: dashboard.id,
        uid: dashboard.uid,
        title: dashboard.title,
        tags: dashboard.tags || [],
        url: `/d/${dashboard.uid}/${slug}`,
        isStarred: false,
        folderId: 0,
        folderUid: '',
        folderTitle: '',
        folderUrl: '',
        type: 'dash-db',
        uri: `db/${slug}`
      };
    });
    res.json(dashboardList);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch dashboards', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/dashboards/uid/:uid - Get dashboard by UID (public access for frontend)
router.get('/uid/:uid', async (req: Request, res: Response) => {
  try {
    const dashboard = await dashboardRepository.findByUid(req.params.uid);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const slug = dashboard.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || dashboard.uid;

    res.json({
      meta: {
        type: 'db',
        canSave: false,
        canEdit: false,
        canAdmin: false,
        canStar: true,
        slug: slug,
        url: `/d/${dashboard.uid}/${slug}`,
        expires: '0001-01-01T00:00:00Z',
        created: dashboard.created_at.toISOString(),
        updated: dashboard.updated_at.toISOString(),
        updatedBy: 'admin',
        createdBy: 'admin',
        version: dashboard.version || 1,
        hasAcl: false,
        isFolder: false,
        folderId: 0,
        folderUid: '',
        folderTitle: '',
        folderUrl: '',
        provisioned: false,
        provisionedExternalId: ''
      },
      dashboard: {
        ...dashboard,
        panels: dashboard.panels,
        time: dashboard.time,
        slug: slug
      }
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

    if (!dashboard.uid) {
      dashboard.uid = `dash-${Date.now()}`;
    }

    const slug = dashboard.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || dashboard.uid;
    dashboard.id = dashboard.id || Date.now();

    const existing = await dashboardRepository.findByUid(dashboard.uid);
    
    let savedDashboard;
    if (existing) {
      savedDashboard = await dashboardRepository.update(existing.id, {
        title: dashboard.title,
        tags: dashboard.tags || [],
        timezone: dashboard.timezone,
        version: (existing.version || 0) + 1,
        refresh: dashboard.refresh,
        time: dashboard.time,
        panels: dashboard.panels || []
      });
    } else {
      savedDashboard = await dashboardRepository.create({
        id: dashboard.id,
        uid: dashboard.uid,
        title: dashboard.title,
        tags: dashboard.tags || [],
        timezone: dashboard.timezone,
        schema_version: dashboard.schemaVersion,
        version: 1,
        refresh: dashboard.refresh,
        time: dashboard.time,
        panels: dashboard.panels || []
      });
    }

    res.json({
      id: savedDashboard!.id,
      uid: savedDashboard!.uid,
      url: `/d/${savedDashboard!.uid}/${slug}`,
      status: 'success',
      version: savedDashboard!.version,
      slug: slug
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
    const dashboard = await dashboardRepository.findByUid(uid);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    await dashboardRepository.deleteByUid(uid);
    
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
router.get('/search', requireRole(['Admin', 'Editor', 'Viewer']), async (req: Request, res: Response) => {
  try {
    const { query, tag, type, dashboardIds, folderIds, starred, limit } = req.query;
    
    let results = await dashboardRepository.findAll();
    
    if (query) {
      results = await dashboardRepository.searchByTitle(query as string);
    } else if (tag) {
      results = await dashboardRepository.findByTags([tag as string]);
    }
    
    if (limit) {
      results = results.slice(0, parseInt(limit as string));
    }
    
    const searchResults = results.map(dashboard => {
      const slug = dashboard.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || dashboard.uid;
      return {
        id: dashboard.id,
        uid: dashboard.uid,
        title: dashboard.title,
        uri: `db/${slug}`,
        url: `/d/${dashboard.uid}/${slug}`,
        slug: slug,
        type: 'dash-db',
        tags: dashboard.tags || [],
        isStarred: false,
        folderId: 0,
        folderUid: '',
        folderTitle: '',
        folderUrl: ''
      };
    });

    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ 
      error: 'Search failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;