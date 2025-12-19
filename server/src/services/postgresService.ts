import { PostgreSQLConnection } from '../config/database';
import { DataSourceConfig, Query, DataFrame, Field, FieldType } from '../types/datasource';

export class PostgreSQLService {
  private connections: Map<string, PostgreSQLConnection> = new Map();

  async addDataSource(config: DataSourceConfig): Promise<void> {
    const connection = new PostgreSQLConnection(config);
    this.connections.set(config.id, connection);
  }

  async testDataSource(config: DataSourceConfig): Promise<{ success: boolean; message: string }> {
    const connection = new PostgreSQLConnection(config);
    return await connection.testConnection();
  }

  async executeQuery(datasourceId: string, query: Query): Promise<DataFrame> {
    console.log('PostgreSQL service - executeQuery called with:', { datasourceId, query });
    console.log('Available connections:', Array.from(this.connections.keys()));
    
    const connection = this.connections.get(datasourceId);
    if (!connection) {
      throw new Error(`Data source ${datasourceId} not found. Available: ${Array.from(this.connections.keys()).join(', ')}`);
    }

    if (!query.rawSql) {
      throw new Error('SQL query is required');
    }

    console.log('Executing SQL:', query.rawSql);
    const result = await connection.query(query.rawSql);
    console.log('SQL result:', result);
    
    return this.transformToDataFrame(result, query);
  }

  private transformToDataFrame(result: any, query: Query): DataFrame {
    if (!result.rows || result.rows.length === 0) {
      return { fields: [], length: 0, refId: query.refId };
    }

    const fields: Field[] = result.fields.map((field: any, index: number) => {
      const values = result.rows.map((row: any) => row[field.name]);
      return {
        name: field.name,
        type: this.mapPostgreSQLType(field.dataTypeID),
        values,
        config: { displayName: field.name }
      };
    });

    return {
      refId: query.refId,
      fields,
      length: result.rows.length
    };
  }

  private mapPostgreSQLType(typeId: number): FieldType {
    // PostgreSQL OID mappings
    switch (typeId) {
      case 20: // bigint
      case 21: // smallint
      case 23: // integer
      case 700: // real
      case 701: // double precision
      case 1700: // numeric
        return FieldType.number;
      case 1082: // date
      case 1083: // time
      case 1114: // timestamp
      case 1184: // timestamptz
        return FieldType.time;
      case 16: // boolean
        return FieldType.boolean;
      default:
        return FieldType.string;
    }
  }

  async removeDataSource(datasourceId: string): Promise<void> {
    const connection = this.connections.get(datasourceId);
    if (connection) {
      await connection.close();
      this.connections.delete(datasourceId);
    }
  }

  getConnectionIds(): string[] {
    return Array.from(this.connections.keys());
  }
}

export const postgresService = new PostgreSQLService();