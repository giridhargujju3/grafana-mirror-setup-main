import { useState, useCallback } from 'react';
import { CSVDataSource, CSVData } from '@/lib/csvDataSource';

interface UseCSVDataReturn {
  csvData: CSVData | null;
  isLoading: boolean;
  error: string | null;
  loadFromText: (text: string) => Promise<void>;
  loadFromUrl: (url: string) => Promise<void>;
  loadFromFile: (file: File) => Promise<void>;
  clearData: () => void;
  getNumericColumns: () => string[];
  getTimeColumn: () => string | null;
  getCategoricalColumns: () => string[];
  transformToTimeSeriesData: (timeColumn: string, numericColumns: string[]) => any[];
  aggregateByCategory: (categoryColumn: string, valueColumn: string) => Array<{name: string, value: number}>;
}

export function useCSVData(): UseCSVDataReturn {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const csvDataSource = new CSVDataSource({});

  const loadFromText = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = csvDataSource.parseCSV(text);
      setCsvData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFromUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      const data = csvDataSource.parseCSV(text);
      setCsvData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV from URL');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFromFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const data = csvDataSource.parseCSV(text);
      setCsvData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setCsvData(null);
    setError(null);
  }, []);

  const getNumericColumns = useCallback(() => {
    if (!csvData) return [];
    return csvDataSource.getNumericColumns(csvData);
  }, [csvData]);

  const getTimeColumn = useCallback(() => {
    if (!csvData) return null;
    return csvDataSource.getTimeColumn(csvData);
  }, [csvData]);

  const getCategoricalColumns = useCallback(() => {
    if (!csvData) return [];
    return csvDataSource.getCategoricalColumns(csvData);
  }, [csvData]);

  const transformToTimeSeriesData = useCallback((timeColumn: string, numericColumns: string[]) => {
    if (!csvData) return [];
    return csvDataSource.transformToTimeSeriesData(csvData, timeColumn, numericColumns);
  }, [csvData]);

  const aggregateByCategory = useCallback((categoryColumn: string, valueColumn: string) => {
    if (!csvData) return [];
    return csvDataSource.aggregateByCategory(csvData, categoryColumn, valueColumn);
  }, [csvData]);

  return {
    csvData,
    isLoading,
    error,
    loadFromText,
    loadFromUrl,
    loadFromFile,
    clearData,
    getNumericColumns,
    getTimeColumn,
    getCategoricalColumns,
    transformToTimeSeriesData,
    aggregateByCategory,
  };
}