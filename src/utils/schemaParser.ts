import { Entity, Property, Relationship, ParsedSchema, OpenAPISchema } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { applyLayoutToDiagram } from './layoutUtils';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

export class SchemaParser {
  private entities: Entity[] = [];
  private relationships: Relationship[] = [];
  private entityMap = new Map<string, Entity>();
  private colorIndex = 0;

  parseOpenAPI(schema: OpenAPISchema): ParsedSchema {
    this.entities = [];
    this.relationships = [];
    this.entityMap.clear();
    this.colorIndex = 0;

    const schemas = schema.components?.schemas || {};
    
    // First pass: create all entities
    Object.entries(schemas).forEach(([name, schemaDef]) => {
      this.createEntity(name, schemaDef);
    });

    // Second pass: create relationships
    Object.entries(schemas).forEach(([name, schemaDef]) => {
      this.createRelationships(name, schemaDef);
    });

    // Third pass: apply layout algorithm
    this.entities = applyLayoutToDiagram(this.entities, this.relationships, 'hierarchical');

    return {
      entities: this.entities,
      relationships: this.relationships,
      metadata: {
        title: schema.info?.title || 'Untitled Schema',
        description: schema.info?.description || '',
        version: schema.info?.version || '1.0.0'
      }
    };
  }

  private createEntity(name: string, schemaDef: any): Entity {
    const entityId = uuidv4();
    const entity: Entity = {
      id: entityId,
      name,
      type: schemaDef.type || 'object',
      description: schemaDef.description,
      properties: this.parseProperties(schemaDef.properties || {}),
      required: schemaDef.required || [],
      position: this.getNextPosition(),
      color: COLORS[this.colorIndex % COLORS.length]
    };

    this.entities.push(entity);
    this.entityMap.set(name, entity);
    this.colorIndex++;

    return entity;
  }

  private parseProperties(properties: Record<string, any>): Record<string, Property> {
    const parsed: Record<string, Property> = {};

    Object.entries(properties).forEach(([propName, propDef]) => {
      parsed[propName] = this.parseProperty(propName, propDef);
    });

    return parsed;
  }

  private parseProperty(name: string, propDef: any): Property {
    const property: Property = {
      name,
      type: propDef.type || 'any',
      description: propDef.description,
      required: false
    };

    // Handle $ref
    if (propDef.$ref) {
      property.ref = this.extractRefName(propDef.$ref);
      property.type = 'reference';
    }

    // Handle arrays
    if (propDef.type === 'array' && propDef.items) {
      property.type = 'array';
      if (propDef.items.$ref) {
        property.items = {
          name: 'item',
          type: 'reference',
          ref: this.extractRefName(propDef.items.$ref)
        };
      } else {
        property.items = {
          name: 'item',
          type: propDef.items.type || 'any'
        };
      }
    }

    // Handle nested objects
    if (propDef.type === 'object' && propDef.properties) {
      property.type = 'object';
      property.properties = this.parseProperties(propDef.properties);
    }

    return property;
  }

  private createRelationships(entityName: string, _schemaDef: any): void {
    const entity = this.entityMap.get(entityName);
    if (!entity) return;

    // Check properties for references
    Object.entries(entity.properties).forEach(([propName, property]) => {
      if (property.ref) {
        const targetEntity = this.entityMap.get(property.ref);
        if (targetEntity) {
          // Set the referenceEntityId for the property
          property.referenceEntityId = targetEntity.id;
          this.createRelationship(entity.id, property.ref, 'reference', property.name);
        }
      }
      if (property.items?.ref) {
        const targetEntity = this.entityMap.get(property.items.ref);
        if (targetEntity) {
          // Set the referenceEntityId for the array items
          property.items.referenceEntityId = targetEntity.id;
          this.createRelationship(entity.id, property.items.ref, 'reference', `${property.name}[]`);
        }
      }
    });
  }

  private createRelationship(sourceId: string, targetName: string, type: Relationship['type'], label?: string): void {
    const targetEntity = this.entityMap.get(targetName);
    if (!targetEntity) return;

    const relationship: Relationship = {
      id: uuidv4(),
      source: sourceId,
      target: targetEntity.id,
      type,
      label
    };

    this.relationships.push(relationship);
  }

  private extractRefName(ref: string): string {
    // Extract name from #/components/schemas/EntityName
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }

  private getNextPosition(): { x: number; y: number } {
    // Temporary position - will be overridden by layout algorithm
    return { x: 0, y: 0 };
  }
}

export const schemaParser = new SchemaParser();
