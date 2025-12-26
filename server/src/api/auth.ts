import { Router, Request, Response } from 'express';
import { apiKeyService } from '../services/apiKeyService';
import { CreateApiKeyRequest, ApiKeyResponse } from '../types/apikey';

const router = Router();

// POST /api/auth/keys - Create new API key
router.post('/keys', async (req: Request, res: Response) => {
  try {
    const request: CreateApiKeyRequest = req.body;
    
    if (!request.name || !request.role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    if (!['Admin', 'Editor', 'Viewer'].includes(request.role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin, Editor, or Viewer' });
    }

    const apiKey = await apiKeyService.createApiKey(request);

    // Return the key only once during creation
    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Only returned during creation
      role: apiKey.role,
      created: apiKey.created.toISOString(),
      expires: apiKey.expires?.toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create API key', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/auth/keys - List all API keys
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const apiKeys = await apiKeyService.getAllApiKeys();
    const response: ApiKeyResponse[] = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      role: key.role,
      key: key.key,
      created: key.created.toISOString(),
      lastUsed: key.lastUsed?.toISOString(),
      expires: key.expires?.toISOString()
    }));
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch API keys', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// DELETE /api/auth/keys/:id - Delete API key
router.delete('/keys/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await apiKeyService.deleteApiKey(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'API key not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete API key', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;