export interface ApiKey {
  id: string;
  name: string;
  key: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  created: Date;
  lastUsed?: Date;
  expires?: Date;
}

export interface CreateApiKeyRequest {
  name: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  secondsToLive?: number;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  role: string;
  created: string;
  lastUsed?: string;
  expires?: string;
}