# CSV Data Visualization Feature Guide

## Overview

This Grafana-compatible dashboard application now supports comprehensive CSV data visualization capabilities that mirror the official Grafana testdata datasource implementation. Users can import, process, and visualize CSV data through various panel types with full data frame support.

## Features

### 1. CSV Data Import Methods

#### File Upload
- Drag and drop CSV files
- File picker interface
- Automatic file validation
- Support for standard CSV format

#### URL Import
- Load CSV data from public URLs
- CORS-enabled endpoints
- Real-time data fetching
- Error handling for network issues

#### Text Input
- Paste CSV data directly
- Real-time parsing and validation
- Sample data generation
- Format detection

### 2. Data Processing

#### Automatic Column Detection
- **Numeric Columns**: Automatically identifies columns containing numerical data
- **Time Columns**: Detects timestamp, date, and time-based columns
- **Categorical Columns**: Identifies text-based categorical data

#### Data Validation
- CSV format validation
- Column consistency checking
- Data type inference
- Error reporting with specific messages

#### Data Transformation
- Time series data conversion
- Category-based aggregation
- Statistical calculations (latest, average, trends)
- Data filtering and processing

### 3. Visualization Types

#### Stat Panels
- Key metrics display
- Trend indicators (up/down/neutral)
- Sparkline charts
- Color-coded values
- Percentage calculations

#### Time Series Charts
- Multi-series line charts
- Area charts with gradients
- Interactive legends
- Zoom and pan capabilities
- Time-based X-axis

#### Gauge Panels
- Circular progress indicators
- Configurable thresholds
- Color-coded ranges
- Real-time value display

#### Bar Charts
- Horizontal and vertical layouts
- Category-based comparisons
- Multi-series support
- Interactive tooltips

#### Pie Charts
- Category distribution
- Percentage breakdowns
- Color-coded segments
- Interactive legends

#### Table Panels
- Raw data display
- Sortable columns
- Pagination support
- Custom cell rendering

### 4. Dashboard Integration

#### Panel Management
- Automatic panel creation from CSV data
- Intelligent layout positioning
- Panel editing and customization
- Drag-and-drop reordering

#### Data Source Integration
- CSV data source type
- Configuration management
- Data refresh capabilities
- Caching mechanisms

## Usage Instructions

### Getting Started

1. **Access CSV Import**
   - Click the "CSV" button in the header (edit mode)
   - Use "Import CSV data" from empty dashboard state
   - Select from data source selector

2. **Import Your Data**
   - Choose import method (File/URL/Text)
   - Upload or paste your CSV data
   - Preview data in the interface
   - Validate format and structure

3. **Generate Dashboard**
   - Click "Create Dashboard from Data"
   - Automatic panel generation based on data types
   - Intelligent visualization selection
   - Immediate edit mode activation

### Best Practices

#### CSV Format Requirements
```csv
timestamp,server,cpu_usage,memory_usage,status
2024-01-01 00:00:00,server-1,45.2,62.1,healthy
2024-01-01 00:05:00,server-1,48.7,64.3,healthy
```

- Include headers in the first row
- Use consistent delimiters (comma recommended)
- Ensure consistent column counts
- Use standard date/time formats
- Avoid special characters in headers

#### Data Organization
- **Time Series Data**: Include timestamp column for time-based charts
- **Categorical Data**: Use consistent category names
- **Numeric Data**: Ensure proper number formatting
- **Mixed Data**: Combine different data types for comprehensive dashboards

### Advanced Features

#### Custom Data Sources
```typescript
const csvDataSource = new CSVDataSource({
  url: 'https://example.com/data.csv',
  delimiter: ',',
  hasHeader: true
});
```

#### Data Processing
```typescript
const numericColumns = csvDataSource.getNumericColumns(data);
const timeColumn = csvDataSource.getTimeColumn(data);
const timeSeriesData = csvDataSource.transformToTimeSeriesData(
  data, 
  timeColumn, 
  numericColumns
);
```

## API Reference

### CSVDataSource Class

#### Constructor Options
- `url?: string` - URL to CSV file
- `filePath?: string` - Local file path (not supported in browser)
- `delimiter?: string` - Column delimiter (default: ',')
- `hasHeader?: boolean` - Whether first row contains headers (default: true)

#### Methods
- `parseCSV(text: string): CSVData` - Parse CSV text into structured data
- `getNumericColumns(data: CSVData): string[]` - Get numeric column names
- `getTimeColumn(data: CSVData): string | null` - Find time-based column
- `getCategoricalColumns(data: CSVData): string[]` - Get categorical columns
- `transformToTimeSeriesData()` - Convert to time series format
- `aggregateByCategory()` - Group and aggregate by category

### CSV Utilities

#### Validation
```typescript
csvUtils.validateCSV(text: string): { isValid: boolean; error?: string }
```

#### Delimiter Detection
```typescript
csvUtils.detectDelimiter(text: string): string
```

#### Sample Data Generation
```typescript
csvUtils.generateSampleCSV(): string
```

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Ensure file has .csv extension
   - Check file size limits
   - Verify CSV format

2. **Parsing Errors**
   - Check for consistent column counts
   - Verify delimiter usage
   - Ensure proper quoting for text with commas

3. **No Visualizations Generated**
   - Verify data contains numeric columns
   - Check for proper header row
   - Ensure data has multiple rows

4. **Time Series Not Working**
   - Include timestamp column with recognizable format
   - Use standard date/time formats
   - Ensure chronological ordering

### Error Messages

- **"Invalid CSV format"**: Check file structure and delimiters
- **"Inconsistent column count"**: Verify all rows have same number of columns
- **"No numeric data found"**: Ensure CSV contains numerical values
- **"Failed to load CSV from URL"**: Check URL accessibility and CORS settings

## Sample Data

The application includes sample CSV data for testing:
- Server monitoring metrics
- Time series data with multiple servers
- Mixed data types (numeric, categorical, timestamps)
- Multiple regions and status values

Access sample data via the "Load Sample" button in the CSV import modal.

## Integration Examples

### Custom Panel Creation
```typescript
addPanel({
  id: `csv-timeseries-${Date.now()}`,
  type: "timeseries",
  title: "Server Metrics",
  gridPos: { x: 0, y: 0, w: 8, h: 4 },
  options: { 
    csvTimeSeriesData: timeSeriesData, 
    timeColumn: 'timestamp', 
    numericColumns: ['cpu_usage', 'memory_usage'] 
  },
});
```

### Data Source Configuration
```typescript
const dataSource: DataSource = {
  id: "csv-custom",
  name: "Custom CSV Data",
  type: "csv",
  csvConfig: {
    url: "https://api.example.com/metrics.csv",
    delimiter: ",",
    hasHeader: true
  }
};
```

This comprehensive CSV visualization feature transforms your Grafana dashboard into a powerful tool for analyzing and visualizing any CSV data source.