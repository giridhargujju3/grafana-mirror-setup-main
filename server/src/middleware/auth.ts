import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKeyService';
import { ApiKey } from '../types/apikey';

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
    }
  }
}

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API key required' });
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  const validatedKey = await apiKeyService.validateApiKey(apiKey);

  if (!validatedKey) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  req.apiKey = validatedKey;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.apiKey.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};