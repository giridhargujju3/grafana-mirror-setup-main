import { Pool, PoolConfig } from 'pg';
import { DataSourceConfig } from '../types/datasource';

export class PostgreSQLConnection {
  private pool: Pool;
  private config: DataSourceConfig;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.pool = new Pool(this.getPoolConfig());
  }

  private getPoolConfig(): PoolConfig {
    const url = new URL(this.config.url);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: this.config.database || url.pathname.slice(1),
      user: this.config.user || url.username,
      password: this.config.password || url.password,
      ssl: this.config.sslMode !== 'disable',
      max: this.config.maxOpenConns || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}