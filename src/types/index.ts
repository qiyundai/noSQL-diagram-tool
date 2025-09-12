export interface Property {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  ref?: string; // For $ref relationships
  items?: Property; // For arrays
  properties?: Record<string, Property>; // For nested objects
  referenceEntityId?: string; // Track which entity this reference property points to
}

export interface Entity {
  id: string;
  name: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  description?: string;
  properties: Record<string, Property>;
  required?: string[];
  position: { x: number; y: number };
  color?: string;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'reference' | 'composition' | 'aggregation' | 'inheritance';
  label?: string;
}

export interface DiagramData {
  entities: Entity[];
  relationships: Relationship[];
  metadata?: {
    title?: string;
    description?: string;
    version?: string;
  };
}

export interface OpenAPISchema {
  openapi?: string;
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  components?: {
    schemas?: Record<string, any>;
  };
  [key: string]: any;
}

export interface ParsedSchema {
  entities: Entity[];
  relationships: Relationship[];
  metadata: {
    title: string;
    description: string;
    version: string;
  };
}

// Utility functions for name casing
export const toCamelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

export const toTitleCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    })
    .replace(/\s+/g, '');
};
