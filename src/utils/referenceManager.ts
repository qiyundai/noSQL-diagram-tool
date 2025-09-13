import { Entity, Relationship, Property, DiagramData, toCamelCase, toTitleCase } from '../types';

export class ReferenceManager {
  /**
   * Creates a reference property in the source entity when connecting two nodes
   */
  static createReferenceOnConnection(
    sourceEntity: Entity,
    targetEntity: Entity,
    data: DiagramData
  ): DiagramData {
    const propertyName = toCamelCase(targetEntity.name);
    
    // Check if property already exists
    const existingProperty = sourceEntity.properties[propertyName];
    if (existingProperty && existingProperty.type === 'reference' && existingProperty.referenceEntityId === targetEntity.id) {
      // Property already exists and points to the same entity
      return data;
    }

    // Create or update the reference property in the SOURCE entity
    const updatedSourceEntity = {
      ...sourceEntity,
      properties: {
        ...sourceEntity.properties,
        [propertyName]: {
          name: propertyName,
          type: 'reference',
          description: `Reference to ${targetEntity.name}`,
          required: false,
          referenceEntityId: targetEntity.id
        }
      }
    };


    // Update the entities array
    const updatedEntities = data.entities.map(entity => 
      entity.id === sourceEntity.id ? updatedSourceEntity : entity
    );

    return {
      ...data,
      entities: updatedEntities
    };
  }

  /**
   * Creates a new entity and connects it when a property is set to reference type
   */
  static createEntityForReference(
    propertyName: string,
    sourceEntity: Entity,
    data: DiagramData
  ): DiagramData {
    const entityName = toTitleCase(propertyName);
    const entityId = `entity-${Date.now()}`;
    
    // Check if entity with similar name already exists
    const existingEntity = data.entities.find(e => 
      e.name.toLowerCase() === entityName.toLowerCase()
    );
    
    if (existingEntity) {
      // Update the property to reference the existing entity
      const updatedSourceEntity = {
        ...sourceEntity,
        properties: {
          ...sourceEntity.properties,
          [propertyName]: {
            ...sourceEntity.properties[propertyName],
            type: 'reference',
            referenceEntityId: existingEntity.id
          }
        }
      };

      const updatedEntities = data.entities.map(entity => 
        entity.id === sourceEntity.id ? updatedSourceEntity : entity
      );

      // Create relationship if it doesn't exist
      const existingRelationship = data.relationships.find(rel => 
        rel.source === sourceEntity.id && rel.target === existingEntity.id
      );

      const updatedRelationships = existingRelationship 
        ? data.relationships
        : [...data.relationships, {
            id: `rel-${Date.now()}`,
            source: sourceEntity.id,
            target: existingEntity.id,
            type: 'reference' as const,
            label: ''
          }];

      return {
        ...data,
        entities: updatedEntities,
        relationships: updatedRelationships
      };
    }

    // Create new entity
    const newEntity: Entity = {
      id: entityId,
      name: entityName,
      type: 'object',
      description: `Entity referenced by ${sourceEntity.name}.${propertyName}`,
      properties: {},
      required: [],
      position: {
        x: sourceEntity.position.x + 400,
        y: sourceEntity.position.y
      },
      color: '#3b82f6'
    };

    // Update the source entity's property
    const updatedSourceEntity = {
      ...sourceEntity,
      properties: {
        ...sourceEntity.properties,
        [propertyName]: {
          ...sourceEntity.properties[propertyName],
          type: 'reference',
          referenceEntityId: entityId
        }
      }
    };

    // Create relationship
    const newRelationship: Relationship = {
      id: `rel-${Date.now()}`,
      source: sourceEntity.id,
      target: entityId,
      type: 'reference',
      label: ''
    };

    const updatedEntities = data.entities.map(entity => 
      entity.id === sourceEntity.id ? updatedSourceEntity : entity
    );

    return {
      ...data,
      entities: [...updatedEntities, newEntity],
      relationships: [...data.relationships, newRelationship]
    };
  }

  /**
   * Removes reference property and relationship when property type is changed away from reference
   */
  static removeReference(
    propertyName: string,
    sourceEntity: Entity,
    data: DiagramData
  ): DiagramData {
    const property = sourceEntity.properties[propertyName];
    if (!property || property.type !== 'reference' || !property.referenceEntityId) {
      return data;
    }

    const referencedEntityId = property.referenceEntityId;

    // Update the property to remove reference
    const updatedSourceEntity = {
      ...sourceEntity,
      properties: {
        ...sourceEntity.properties,
        [propertyName]: {
          ...property,
          type: 'string', // Default to string type
          referenceEntityId: undefined
        }
      }
    };

    // Remove the relationship between source and referenced entity
    const updatedRelationships = data.relationships.filter(rel => 
      !(rel.source === sourceEntity.id && rel.target === referencedEntityId)
    );

    // Update entities
    const updatedEntities = data.entities.map(entity => 
      entity.id === sourceEntity.id ? updatedSourceEntity : entity
    );

    return {
      ...data,
      entities: updatedEntities,
      relationships: updatedRelationships
    };
  }

  /**
   * Removes reference properties and relationships when an entity is deleted
   */
  static cleanupReferencesOnEntityDelete(
    deletedEntityId: string,
    data: DiagramData
  ): DiagramData {
    // Remove the entity itself
    const updatedEntities = data.entities.filter(entity => entity.id !== deletedEntityId);
    
    // Find all properties that reference this entity and convert them back to string
    const finalEntities = updatedEntities.map(entity => {
      const updatedProperties: Record<string, Property> = {};
      
      Object.entries(entity.properties).forEach(([propName, property]) => {
        if (property.referenceEntityId === deletedEntityId) {
          // Convert reference property back to string
          updatedProperties[propName] = {
            ...property,
            type: 'string',
            referenceEntityId: undefined
          };
        } else {
          updatedProperties[propName] = property;
        }
      });

      return {
        ...entity,
        properties: updatedProperties
      };
    });

    // Remove relationships involving the deleted entity
    const updatedRelationships = data.relationships.filter(rel => 
      rel.source !== deletedEntityId && rel.target !== deletedEntityId
    );

    return {
      ...data,
      entities: finalEntities,
      relationships: updatedRelationships
    };
  }

  /**
   * Updates reference properties when an entity name changes
   */
  static updateReferencesOnEntityRename(
    entityId: string,
    oldName: string,
    newName: string,
    data: DiagramData
  ): DiagramData {
    const oldPropertyName = toCamelCase(oldName);
    const newPropertyName = toCamelCase(newName);

    // Update all properties that reference this entity
    const updatedEntities = data.entities.map(entity => {
      const updatedProperties: Record<string, Property> = {};
      
      Object.entries(entity.properties).forEach(([propName, property]) => {
        if (property.referenceEntityId === entityId) {
          // Update the property name if it matches the old entity name
          if (propName === oldPropertyName) {
            updatedProperties[newPropertyName] = {
              ...property,
              name: newPropertyName,
              description: `Reference to ${newName}`
            };
          } else {
            updatedProperties[propName] = {
              ...property,
              description: `Reference to ${newName}`
            };
          }
        } else {
          updatedProperties[propName] = property;
        }
      });

      return {
        ...entity,
        properties: updatedProperties
      };
    });

    return {
      ...data,
      entities: updatedEntities,
      relationships: data.relationships
    };
  }
}
