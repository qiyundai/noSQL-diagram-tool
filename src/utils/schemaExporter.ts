import { DiagramData, Entity, Property, Relationship } from '../types';

export interface ExportOptions {
  format: 'openapi' | 'nosql' | 'json-schema';
  includeMetadata?: boolean;
  includeRequired?: boolean;
}

export class SchemaExporter {
  /**
   * Exports diagram data to OpenAPI schema format
   */
  static exportToOpenAPI(data: DiagramData, options: ExportOptions = { format: 'openapi' }): any {
    const schemas: Record<string, any> = {};
    
    // Convert entities to OpenAPI schema components
    data.entities.forEach(entity => {
      schemas[entity.name] = this.convertEntityToOpenAPISchema(entity, data);
    });

    const openAPISchema = {
      openapi: '3.0.0',
      info: {
        title: data.metadata?.title || 'Generated Schema',
        description: data.metadata?.description || 'Schema generated from NoSQL diagram',
        version: data.metadata?.version || '1.0.0'
      },
      components: {
        schemas
      }
    };

    return openAPISchema;
  }

  /**
   * Exports diagram data to NoSQL document schema format
   */
  static exportToNoSQL(data: DiagramData, options: ExportOptions = { format: 'nosql' }): any {
    const collections: Record<string, any> = {};
    
    // Convert entities to NoSQL collection schemas
    data.entities.forEach(entity => {
      collections[entity.name] = this.convertEntityToNoSQLSchema(entity, data);
    });

    return {
      database: {
        name: data.metadata?.title || 'Generated Database',
        description: data.metadata?.description || 'Database schema generated from NoSQL diagram',
        version: data.metadata?.version || '1.0.0',
        collections
      }
    };
  }

  /**
   * Exports diagram data to JSON Schema format
   */
  static exportToJSONSchema(data: DiagramData, options: ExportOptions = { format: 'json-schema' }): any {
    const schemas: Record<string, any> = {};
    
    // Convert entities to JSON Schema
    data.entities.forEach(entity => {
      schemas[entity.name] = this.convertEntityToJSONSchema(entity, data);
    });

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: data.metadata?.title || 'Generated Schema',
      description: data.metadata?.description || 'Schema generated from NoSQL diagram',
      version: data.metadata?.version || '1.0.0',
      definitions: schemas
    };
  }

  /**
   * Converts an entity to OpenAPI schema format
   */
  private static convertEntityToOpenAPISchema(entity: Entity, data: DiagramData): any {
    const schema: any = {
      type: 'object',
      description: entity.description
    };

    if (Object.keys(entity.properties).length > 0) {
      schema.properties = {};
      schema.required = [];

      Object.entries(entity.properties).forEach(([propName, property]) => {
        schema.properties[propName] = this.convertPropertyToOpenAPI(property, data);
        
        if (property.required) {
          schema.required.push(propName);
        }
      });
    }

    return schema;
  }

  /**
   * Converts an entity to NoSQL collection schema format
   */
  private static convertEntityToNoSQLSchema(entity: Entity, data: DiagramData): any {
    const schema: any = {
      collection: entity.name,
      description: entity.description,
      fields: {}
    };

    if (Object.keys(entity.properties).length > 0) {
      Object.entries(entity.properties).forEach(([propName, property]) => {
        schema.fields[propName] = this.convertPropertyToNoSQL(property, data);
      });
    }

    return schema;
  }

  /**
   * Converts an entity to JSON Schema format
   */
  private static convertEntityToJSONSchema(entity: Entity, data: DiagramData): any {
    const schema: any = {
      type: 'object',
      description: entity.description
    };

    if (Object.keys(entity.properties).length > 0) {
      schema.properties = {};
      schema.required = [];

      Object.entries(entity.properties).forEach(([propName, property]) => {
        schema.properties[propName] = this.convertPropertyToJSONSchema(property, data);
        
        if (property.required) {
          schema.required.push(propName);
        }
      });
    }

    return schema;
  }

  /**
   * Converts a property to OpenAPI format
   */
  private static convertPropertyToOpenAPI(property: Property, data: DiagramData): any {
    const prop: any = {
      description: property.description
    };

    if (property.type === 'reference') {
      // For references, use $ref to point to the referenced entity
      const referencedEntity = data.entities.find(e => e.id === property.referenceEntityId);
      if (referencedEntity) {
        prop.$ref = `#/components/schemas/${referencedEntity.name}`;
      } else {
        prop.type = 'string'; // Fallback if reference not found
        prop.description = (property.description || '') + ' (Reference entity not found)';
      }
    } else if (property.type === 'array') {
      prop.type = 'array';
      if (property.items) {
        if (property.items.type === 'reference') {
          const referencedEntity = data.entities.find(e => e.id === property.items?.referenceEntityId);
          if (referencedEntity) {
            prop.items = { $ref: `#/components/schemas/${referencedEntity.name}` };
          } else {
            prop.items = { type: 'string' };
          }
        } else {
          prop.items = { type: property.items.type };
        }
      } else {
        prop.items = { type: 'string' };
      }
    } else if (property.type === 'object') {
      prop.type = 'object';
      if (property.properties) {
        prop.properties = {};
        Object.entries(property.properties).forEach(([nestedName, nestedProp]) => {
          prop.properties[nestedName] = this.convertPropertyToOpenAPI(nestedProp, data);
        });
      }
    } else {
      prop.type = property.type;
    }

    return prop;
  }

  /**
   * Converts a property to NoSQL format
   */
  private static convertPropertyToNoSQL(property: Property, data: DiagramData): any {
    const prop: any = {
      type: property.type,
      description: property.description,
      required: property.required || false
    };

    if (property.type === 'reference') {
      const referencedEntity = data.entities.find(e => e.id === property.referenceEntityId);
      if (referencedEntity) {
        prop.reference = referencedEntity.name;
        prop.type = 'reference';
      }
    } else if (property.type === 'array') {
      prop.type = 'array';
      if (property.items) {
        if (property.items.type === 'reference') {
          const referencedEntity = data.entities.find(e => e.id === property.items?.referenceEntityId);
          if (referencedEntity) {
            prop.items = {
              type: 'reference',
              reference: referencedEntity.name
            };
          } else {
            prop.items = { type: property.items.type };
          }
        } else {
          prop.items = { type: property.items.type };
        }
      }
    } else if (property.type === 'object') {
      prop.type = 'object';
      if (property.properties) {
        prop.properties = {};
        Object.entries(property.properties).forEach(([nestedName, nestedProp]) => {
          prop.properties[nestedName] = this.convertPropertyToNoSQL(nestedProp, data);
        });
      }
    }

    return prop;
  }

  /**
   * Converts a property to JSON Schema format
   */
  private static convertPropertyToJSONSchema(property: Property, data: DiagramData): any {
    const prop: any = {
      description: property.description
    };

    if (property.type === 'reference') {
      const referencedEntity = data.entities.find(e => e.id === property.referenceEntityId);
      if (referencedEntity) {
        prop.$ref = `#/definitions/${referencedEntity.name}`;
      } else {
        prop.type = 'string';
        prop.description = (property.description || '') + ' (Reference entity not found)';
      }
    } else if (property.type === 'array') {
      prop.type = 'array';
      if (property.items) {
        if (property.items.type === 'reference') {
          const referencedEntity = data.entities.find(e => e.id === property.items?.referenceEntityId);
          if (referencedEntity) {
            prop.items = { $ref: `#/definitions/${referencedEntity.name}` };
          } else {
            prop.items = { type: 'string' };
          }
        } else {
          prop.items = { type: property.items.type };
        }
      } else {
        prop.items = { type: 'string' };
      }
    } else if (property.type === 'object') {
      prop.type = 'object';
      if (property.properties) {
        prop.properties = {};
        Object.entries(property.properties).forEach(([nestedName, nestedProp]) => {
          prop.properties[nestedName] = this.convertPropertyToJSONSchema(nestedProp, data);
        });
      }
    } else {
      prop.type = property.type;
    }

    return prop;
  }
}

export const schemaExporter = new SchemaExporter();
