export interface CSVData {
  headers: string[];
  rows: string[][];
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'time';
  values: any[];
  config?: FieldConfig;
  labels?: Record<string, string>;
}

export interface FieldConfig {
  displayName?: string;
  unit?: string;
  decimals?: number;
  min?: number;
  max?: number;
  color?: FieldColor;
  custom?: Record<string, any>;
}

export interface FieldColor {
  mode: 'palette-classic' | 'continuous-GrYlRd' | 'fixed';
  fixedColor?: string;
}

export interface DataFrame {
  name?: string;
  fields: DataField[];
  length: number;
  refId?: string;
}

export interface CSVDataSourceConfig {
  url?: string;
  filePath?: string;
  delimiter?: string;
  hasHeader?: boolean;
}

export class CSVDataSource {
  private config: CSVDataSourceConfig;
  private cachedData: CSVData | null = null;
  private cachedDataFrame: DataFrame | null = null;

  constructor(config: CSVDataSourceConfig) {
    this.config = {
      delimiter: ',',
      hasHeader: true,
      ...config
    };
  }

  async fetchData(): Promise<CSVData> {
    if (this.cachedData) {
      return this.cachedData;
    }

    let csvText = '';
    
    if (this.config.url) {
      const response = await fetch(this.config.url);
      csvText = await response.text();
    } else if (this.config.filePath) {
      // For local files, we'd need a file input or drag-drop
      throw new Error('Local file reading not implemented in browser environment');
    } else {
      throw new Error('No data source configured');
    }

    const data = this.parseCSV(csvText);
    this.cachedData = data;
    return data;
  }

  parseCSV(text: string): CSVData {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const delimiter = this.config.delimiter || ',';
    
    let headers: string[];
    let dataRows: string[][];

    if (this.config.hasHeader) {
      headers = this.parseLine(lines[0], delimiter).map(h => h.trim());
      dataRows = lines.slice(1).map(line => this.parseLine(line, delimiter));
    } else {
      // Generate column names if no header
      const firstRow = this.parseLine(lines[0], delimiter);
      headers = firstRow.map((_, index) => `Column ${index + 1}`);
      dataRows = lines.map(line => this.parseLine(line, delimiter));
    }

    return { headers, rows: dataRows };
  }

  parseCSVToDataFrame(text: string, name?: string): DataFrame {
    const csvData = this.parseCSV(text);
    return this.csvDataToDataFrame(csvData, name);
  }

  csvDataToDataFrame(csvData: CSVData, name?: string): DataFrame {
    const fields: DataField[] = [];
    const rowCount = csvData.rows.length;

    csvData.headers.forEach((header, columnIndex) => {
      const columnValues = csvData.rows.map(row => row[columnIndex] || '');
      const field = this.createFieldFromValues(header, columnValues);
      fields.push(field);
    });

    return {
      name: name || 'CSV Data',
      fields,
      length: rowCount
    };
  }

  private createFieldFromValues(name: string, values: string[]): DataField {
    // Clean field name and extract labels
    let fieldName = name;
    let labels: Record<string, string> | undefined;
    
    const labelMatch = name.match(/^(.+?)\{(.+)\}$/);
    if (labelMatch) {
      fieldName = labelMatch[1].trim();
      labels = this.parseLabelsString(labelMatch[2]);
    }

    // Determine field type and convert values
    const fieldType = this.detectFieldType(values);
    const convertedValues = this.convertValues(values, fieldType);

    const field: DataField = {
      name: fieldName,
      type: fieldType,
      values: convertedValues
    };

    if (labels) {
      field.labels = labels;
    }

    // Add field configuration based on type
    if (fieldType === 'time') {
      field.config = {
        displayName: fieldName
      };
    } else if (fieldType === 'number') {
      field.config = {
        displayName: fieldName,
        decimals: this.getOptimalDecimals(convertedValues as number[])
      };
    }

    return field;
  }

  private detectFieldType(values: string[]): 'string' | 'number' | 'boolean' | 'time' {
    const nonEmptyValues = values.filter(v => v && v.trim());
    if (nonEmptyValues.length === 0) return 'string';

    // Check for boolean
    const booleanPattern = /^(true|false|t|f|yes|no|1|0)$/i;
    if (nonEmptyValues.every(v => booleanPattern.test(v.trim()))) {
      return 'boolean';
    }

    // Check for numbers
    const numberPattern = /^-?\d*\.?\d+([eE][+-]?\d+)?$/;
    if (nonEmptyValues.every(v => numberPattern.test(v.trim()))) {
      return 'number';
    }

    // Check for time (various formats)
    const timePatterns = [
      /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/, // ISO format
      /^\d{4}-\d{2}-\d{2}$/, // Date only
      /^\d{2}:\d{2}:\d{2}$/, // Time only
      /^\d{13}$/, // Unix timestamp (ms)
      /^\d{10}$/, // Unix timestamp (s)
    ];
    
    if (timePatterns.some(pattern => 
      nonEmptyValues.every(v => pattern.test(v.trim()))
    )) {
      return 'time';
    }

    return 'string';
  }

  private convertValues(values: string[], type: 'string' | 'number' | 'boolean' | 'time'): any[] {
    return values.map(value => {
      const trimmed = value?.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'NULL') {
        return null;
      }

      switch (type) {
        case 'number':
          const num = Number(trimmed);
          return isNaN(num) ? null : num;
        case 'boolean':
          return /^(true|t|yes|1)$/i.test(trimmed);
        case 'time':
          return this.parseTimeValue(trimmed);
        default:
          return trimmed;
      }
    });
  }

  private parseTimeValue(value: string): Date | null {
    // Unix timestamp (milliseconds)
    if (/^\d{13}$/.test(value)) {
      return new Date(parseInt(value));
    }
    
    // Unix timestamp (seconds)
    if (/^\d{10}$/.test(value)) {
      return new Date(parseInt(value) * 1000);
    }

    // Try parsing as ISO string or other formats
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseLabelsString(labelsStr: string): Record<string, string> {
    const labels: Record<string, string> = {};
    const pairs = labelsStr.split(',');
    
    pairs.forEach(pair => {
      const [key, value] = pair.split('=').map(s => s.trim().replace(/["']/g, ''));
      if (key && value) {
        labels[key] = value;
      }
    });
    
    return labels;
  }

  private getOptimalDecimals(values: number[]): number {
    const nonNullValues = values.filter(v => v !== null && !isNaN(v));
    if (nonNullValues.length === 0) return 2;

    const maxDecimals = Math.max(...nonNullValues.map(v => {
      const str = v.toString();
      const decimalIndex = str.indexOf('.');
      return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
    }));

    return Math.min(maxDecimals, 4); // Cap at 4 decimal places
  }

  private parseLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  getNumericColumns(data: CSVData): string[] {
    return data.headers.filter((header, index) => {
      const values = data.rows.map(row => row[index]).filter(v => v && v.trim());
      return values.length > 0 && values.every(v => !isNaN(Number(v.trim())));
    });
  }

  getNumericFields(dataFrame: DataFrame): DataField[] {
    return dataFrame.fields.filter(field => field.type === 'number');
  }

  getTimeColumn(data: CSVData): string | null {
    // First check by name patterns
    const timeByName = data.headers.find(header => {
      const lower = header.toLowerCase();
      return lower.includes('time') || 
             lower.includes('date') ||
             lower.includes('timestamp') ||
             lower.includes('created') ||
             lower.includes('updated');
    });
    
    if (timeByName) return timeByName;

    // Then check by data pattern
    return data.headers.find((header, index) => {
      const values = data.rows.map(row => row[index]).filter(v => v && v.trim());
      if (values.length === 0) return false;
      
      return this.detectFieldType(values) === 'time';
    }) || null;
  }

  getTimeFields(dataFrame: DataFrame): DataField[] {
    return dataFrame.fields.filter(field => field.type === 'time');
  }

  getCategoricalColumns(data: CSVData): string[] {
    const numericColumns = this.getNumericColumns(data);
    const timeColumn = this.getTimeColumn(data);
    
    return data.headers.filter(header => 
      !numericColumns.includes(header) && header !== timeColumn
    );
  }

  getCategoricalFields(dataFrame: DataFrame): DataField[] {
    return dataFrame.fields.filter(field => 
      field.type === 'string' && !this.isTimeField(field)
    );
  }

  private isTimeField(field: DataField): boolean {
    return field.type === 'time' || 
           field.name.toLowerCase().includes('time') ||
           field.name.toLowerCase().includes('date');
  }

  transformToTimeSeriesData(data: CSVData, timeColumn: string, numericColumns: string[]): any[] {
    const timeIndex = data.headers.indexOf(timeColumn);
    
    return data.rows.map(row => {
      const obj: any = { time: row[timeIndex] };
      numericColumns.forEach(col => {
        const colIndex = data.headers.indexOf(col);
        obj[col] = Number(row[colIndex]) || 0;
      });
      return obj;
    });
  }

  aggregateByCategory(data: CSVData, categoryColumn: string, valueColumn: string): Array<{name: string, value: number}> {
    const categoryIndex = data.headers.indexOf(categoryColumn);
    const valueIndex = data.headers.indexOf(valueColumn);
    
    const aggregated = data.rows.reduce((acc: Record<string, number>, row) => {
      const category = row[categoryIndex];
      const value = Number(row[valueIndex]) || 0;
      acc[category] = (acc[category] || 0) + value;
      return acc;
    }, {});

    return Object.entries(aggregated).map(([name, value]) => ({ name, value }));
  }

  clearCache(): void {
    this.cachedData = null;
  }
}

// Utility functions for CSV data processing
export const csvUtils = {
  detectDelimiter(text: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const sample = text.split('\n')[0];
    
    let maxCount = 0;
    let bestDelimiter = ',';
    
    delimiters.forEach(delimiter => {
      const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });
    
    return bestDelimiter;
  },

  validateCSV(text: string): { isValid: boolean; error?: string } {
    if (!text.trim()) {
      return { isValid: false, error: 'CSV content is empty' };
    }

    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { isValid: false, error: 'CSV must have at least 2 lines (header + data)' };
    }

    const delimiter = csvUtils.detectDelimiter(text);
    const headerCount = lines[0].split(delimiter).length;
    
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const rowCount = lines[i].split(delimiter).length;
      if (rowCount !== headerCount) {
        return { isValid: false, error: `Inconsistent column count at line ${i + 1}` };
      }
    }

    return { isValid: true };
  },

  generateSampleCSV(): string {
    return `timestamp,server,cpu_usage,memory_usage,disk_usage,network_in,network_out,status
2024-01-01 00:00:00,server-1,45.2,62.1,78.5,1024,512,healthy
2024-01-01 00:05:00,server-1,48.7,64.3,78.6,1156,623,healthy
2024-01-01 00:10:00,server-1,52.1,66.8,78.7,1289,734,warning
2024-01-01 00:15:00,server-1,49.3,65.2,78.8,1178,645,healthy
2024-01-01 00:00:00,server-2,38.9,55.7,82.1,892,445,healthy
2024-01-01 00:05:00,server-2,41.2,57.9,82.3,967,512,healthy
2024-01-01 00:10:00,server-2,44.6,60.1,82.5,1045,578,healthy
2024-01-01 00:15:00,server-2,42.8,58.8,82.7,998,534,healthy`;
  }
};