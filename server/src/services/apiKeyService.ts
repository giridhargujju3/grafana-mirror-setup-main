import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { ApiKey, CreateApiKeyRequest } from '../types/apikey';

class ApiKeyService {
  private apiKeys: Map<string, ApiKey> = new Map();
  private readonly storageFile = path.join(process.cwd(), 'data', 'api-keys.json');

  constructor() {
    this.loadApiKeys();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(this.storageFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async loadApiKeys(): Promise<void> {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(this.storageFile, 'utf-8');
      const apiKeysArray: ApiKey[] = JSON.parse(data);
      
      // Convert dates back from strings
      apiKeysArray.forEach(apiKey => {
        apiKey.created = new Date(apiKey.created);
        if (apiKey.lastUsed) apiKey.lastUsed = new Date(apiKey.lastUsed);
        if (apiKey.expires) apiKey.expires = new Date(apiKey.expires);
        this.apiKeys.set(apiKey.key, apiKey);
      });
      console.log(`✅ Loaded ${apiKeysArray.length} API keys from storage`);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('Error loading API keys:', error);
      }
      console.log('📝 Starting with empty API keys storage');
    }
  }

  private async saveApiKeys(): Promise<void> {
    try {
      await this.ensureDataDirectory();
      const apiKeysArray = Array.from(this.apiKeys.values());
      await fs.writeFile(this.storageFile, JSON.stringify(apiKeysArray, null, 2));
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  }

  generateApiKey(): string {
    return 'gm_' + crypto.randomBytes(32).toString('hex');
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKey> {
    const id = crypto.randomUUID();
    const key = this.generateApiKey();
    const now = new Date();

    const apiKey: ApiKey = {
      id,
      name: request.name,
      key,
      role: request.role,
      created: now,
      expires: request.secondsToLive ? new Date(now.getTime() + request.secondsToLive * 1000) : undefined
    };

    this.apiKeys.set(key, apiKey);
    await this.saveApiKeys();
    console.log(`🔑 Created new API key: ${request.name} (${request.role})`);
    
    return apiKey;
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    const apiKey = this.apiKeys.get(key);
    if (!apiKey) return null;

    // Check if key has expired
    if (apiKey.expires && apiKey.expires < new Date()) {
      await this.deleteApiKey(apiKey.id);
      return null;
    }

    // Update last used
    apiKey.lastUsed = new Date();
    await this.saveApiKeys();

    return apiKey;
  }

  getAllApiKeys(): ApiKey[] {
    return Array.from(this.apiKeys.values());
  }

  async deleteApiKey(id: string): Promise<boolean> {
    for (const [key, apiKey] of this.apiKeys.entries()) {
      if (apiKey.id === id) {
        this.apiKeys.delete(key);
        await this.saveApiKeys();
        console.log(`🗑️ Deleted API key: ${apiKey.name}`);
        return true;
      }
    }
    return false;
  }

  getApiKeyById(id: string): ApiKey | null {
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.id === id) {
        return apiKey;
      }
    }
    return null;
  }
}

export const apiKeyService = new ApiKeyService();