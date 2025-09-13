import { DiagramData } from '../types';
import { SchemaExporter, ExportOptions } from './schemaExporter';

const STORAGE_KEY = 'nosql-diagram-data';

export const storage = {
  save: (data: DiagramData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  load: (): DiagramData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  export: (data: DiagramData, format: 'internal' | 'openapi' | 'nosql' | 'json-schema' = 'internal'): void => {
    let exportData: any;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'openapi':
        exportData = SchemaExporter.exportToOpenAPI(data);
        filename = 'schema-openapi.json';
        mimeType = 'application/json';
        break;
      case 'nosql':
        exportData = SchemaExporter.exportToNoSQL(data);
        filename = 'schema-nosql.json';
        mimeType = 'application/json';
        break;
      case 'json-schema':
        exportData = SchemaExporter.exportToJSONSchema(data);
        filename = 'schema-json-schema.json';
        mimeType = 'application/json';
        break;
      default:
        exportData = data;
        filename = 'diagram-schema.json';
        mimeType = 'application/json';
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  import: (): Promise<DiagramData> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid JSON file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      };
      input.click();
    });
  }
};
