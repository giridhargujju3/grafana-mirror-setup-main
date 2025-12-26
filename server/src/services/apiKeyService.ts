import crypto from 'crypto';
import { ApiKey, CreateApiKeyRequest } from '../types/apikey';
import { apiKeyRepository } from '../database/repositories/apiKeyRepository';

class ApiKeyService {
  constructor() {
    this.initializeDefaultApiKey();
  }

  private async initializeDefaultApiKey(): Promise<void> {
    const allKeys = await apiKeyRepository.findAll();
    if (allKeys.length === 0) {
      const defaultKey = 'gm_61f62cdbcbbe14d4bb4eb3631cf6a49a4a73ee138b899796a32ac387fab76242';
      await apiKeyRepository.create({
        id: crypto.randomUUID(),
        user: 'admin',
        api_key: defaultKey,
        role: 'Admin'
      });
      console.log('🔑 Created default API key for dashboard operations');
    }
  }

  generateApiKey(): string {
    return 'gm_' + crypto.randomBytes(32).toString('hex');
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKey> {
    const id = crypto.randomUUID();
    const key = this.generateApiKey();

    const dbApiKey = await apiKeyRepository.create({
      id,
      user: request.name,
      api_key: key,
      role: request.role
    });

    console.log(`🔑 Created new API key: ${request.name} (${request.role})`);
    
    return {
      id: dbApiKey.id,
      name: dbApiKey.user,
      key: dbApiKey.api_key,
      role: dbApiKey.role,
      created: dbApiKey.created,
      lastUsed: dbApiKey.last_used,
      expires: undefined
    };
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    const dbApiKey = await apiKeyRepository.findByKey(key);
    if (!dbApiKey) return null;

    await apiKeyRepository.updateLastUsed(dbApiKey.id);

    return {
      id: dbApiKey.id,
      name: dbApiKey.user,
      key: dbApiKey.api_key,
      role: dbApiKey.role,
      created: dbApiKey.created,
      lastUsed: dbApiKey.last_used,
      expires: undefined
    };
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    const dbApiKeys = await apiKeyRepository.findAll();
    return dbApiKeys.map(dbKey => ({
      id: dbKey.id,
      name: dbKey.user,
      key: dbKey.api_key,
      role: dbKey.role,
      created: dbKey.created,
      lastUsed: dbKey.last_used,
      expires: undefined
    }));
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const deleted = await apiKeyRepository.delete(id);
    if (deleted) {
      console.log(`🗑️ Deleted API key: ${id}`);
    }
    return deleted;
  }

  async getApiKeyById(id: string): Promise<ApiKey | null> {
    const dbApiKey = await apiKeyRepository.findById(id);
    if (!dbApiKey) return null;

    return {
      id: dbApiKey.id,
      name: dbApiKey.user,
      key: dbApiKey.api_key,
      role: dbApiKey.role,
      created: dbApiKey.created,
      lastUsed: dbApiKey.last_used,
      expires: undefined
    };
  }
}

export const apiKeyService = new ApiKeyService();