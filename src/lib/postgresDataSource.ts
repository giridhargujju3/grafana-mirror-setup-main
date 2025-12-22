// PostgreSQL data source integration with backend
export interface PostgreSQLConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  sslMode: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  maxConnections?: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
}

const API_BASE = 'http://localhost:3001/api';

export class PostgreSQLDataSource {
  private config: PostgreSQLConfig;

  constructor(config: PostgreSQLConfig) {
    this.config = config;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/datasources/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'postgres',
          url: `postgresql://${this.config.user}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
          sslMode: this.config.sslMode
        })
      });

      const result = await response.json();
      return {
        success: result.status === 'success',
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    try {
      const response = await fetch(`${API_BASE}/query/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasource: this.config.id,
          query: sql
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Query execution failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Query failed');
      }

      // Transform backend response to frontend format
      const dataFrame = result.data;
      const columns = dataFrame.fields.map((field: any) => field.name);
      const rows = [];

      if (dataFrame.length > 0) {
        for (let i = 0; i < dataFrame.length; i++) {
          const row = dataFrame.fields.map((field: any) => field.values[i]);
          rows.push(row);
        }
      }

      return {
        columns,
        rows,
        rowCount: dataFrame.length
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Query execution failed');
    }
  }

  async saveDataSource(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/datasources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.config.name,
          type: 'postgres',
          url: `postgresql://${this.config.user}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
          sslMode: this.config.sslMode,
          maxOpenConns: this.config.maxConnections || 10
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save data source');
      }

      const result = await response.json();
      this.config.id = result.id;
      console.log('Data source saved successfully:', result);
      return result.id;
    } catch (error) {
      console.error('Save data source error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to save data source');
    }
  }

  static async listDataSources(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/datasources`);
      if (!response.ok) {
        throw new Error('Failed to fetch data sources');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching data sources:', error);
      return [];
    }
  }

  static async deleteDataSource(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/datasources/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete data source');
      }
      
      console.log('Data source deleted successfully:', id);
    } catch (error) {
      console.error('Delete data source error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete data source');
    }
  }
}