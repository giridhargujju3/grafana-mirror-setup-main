import { query } from '../connection';

export interface ApiKey {
  id: string;
  user: string;
  api_key: string;
  role: string;
  created: Date;
  last_used?: Date;
}

export const apiKeyRepository = {
  async findAll(): Promise<ApiKey[]> {
    const result = await query('SELECT * FROM api_keys ORDER BY created DESC');
    return result.rows;
  },

  async findById(id: string): Promise<ApiKey | null> {
    const result = await query('SELECT * FROM api_keys WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByKey(apiKey: string): Promise<ApiKey | null> {
    const result = await query('SELECT * FROM api_keys WHERE api_key = $1', [apiKey]);
    return result.rows[0] || null;
  },

  async create(apiKey: Omit<ApiKey, 'created' | 'last_used'>): Promise<ApiKey> {
    const result = await query(
      `INSERT INTO api_keys (id, "user", api_key, role, created) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [apiKey.id, apiKey.user, apiKey.api_key, apiKey.role]
    );
    return result.rows[0];
  },

  async updateLastUsed(id: string): Promise<void> {
    await query('UPDATE api_keys SET last_used = NOW() WHERE id = $1', [id]);
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM api_keys WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  },

  async deleteByKey(apiKey: string): Promise<boolean> {
    const result = await query('DELETE FROM api_keys WHERE api_key = $1', [apiKey]);
    return (result.rowCount || 0) > 0;
  }
};
