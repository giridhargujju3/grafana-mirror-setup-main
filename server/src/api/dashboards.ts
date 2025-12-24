import { Router, Request, Response } from 'express';
import { authenticateApiKey, requireRole } from '../middleware/auth';

const router = Router();

// In-memory dashboard storage (in production, use database)
const dashboards: Map<string, any> = new Map();

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
router.post('/db', requireRole(['Admin', 'Editor']), (req: Request, res: Response) => {
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

export default router;