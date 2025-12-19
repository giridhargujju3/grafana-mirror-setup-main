// Grafana-inspired data source types
export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'prometheus' | 'loki';
  url: string;
  database?: string;
  user?: string;
  password?: string;
  sslMode?: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  maxOpenConns?: number;
  maxIdleConns?: number;
  connMaxLifetime?: number;
  isDefault?: boolean;
  readOnly?: boolean;
}

export interface QueryRequest {
  queries: Query[];
  from: string;
  to: string;
  maxDataPoints?: number;
}

export interface Query {
  refId: string;
  datasource: string;
  rawSql?: string;
  format?: 'time_series' | 'table';
  intervalMs?: number;
  maxDataPoints?: number;
}

export interface QueryResponse {
  data: DataFrame[];
  error?: string;
}

export interface DataFrame {
  name?: string;
  refId?: string;
  fields: Field[];
  length: number;
}

export interface Field {
  name: string;
  type: FieldType;
  values: any[];
  config?: FieldConfig;
}

export enum FieldType {
  time = 'time',
  number = 'number',
  string = 'string',
  boolean = 'boolean'
}

export interface FieldConfig {
  displayName?: string;
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
}

export interface DataSourceTestResult {
  status: 'success' | 'error';
  message: string;
  details?: any;
}