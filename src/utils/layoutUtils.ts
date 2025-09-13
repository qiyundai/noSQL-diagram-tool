import { Entity, Relationship } from '../types';

export interface LayoutOptions {
  levelSpacing?: number;
  entitySpacing?: number;
  startX?: number;
  startY?: number;
}

export class LayoutEngine {
  private entities: Entity[];
  private relationships: Relationship[];

  constructor(entities: Entity[], relationships: Relationship[]) {
    this.entities = entities;
    this.relationships = relationships;
  }

  /**
   * Apply hierarchical layout based on entity relationships
   * Arranges entities in horizontal columns, with each reference level in a separate column
   */
  applyHierarchicalLayout(options: LayoutOptions = {}): Entity[] {
    const {
      levelSpacing = 800, // Horizontal spacing between columns (increased for less clutter)
      entitySpacing = 200, // Vertical spacing within columns
      startX = 100,
      startY = 100
    } = options;

    if (this.entities.length === 0) return this.entities;

    // If no relationships, use grid layout
    if (this.relationships.length === 0) {
      return this.applyGridLayout(options);
    }

    // Build reference graph to determine reference depth
    const referencedBy = new Map<string, string[]>(); // entity -> entities that reference it
    const references = new Map<string, string[]>(); // entity -> entities it references
    
    // Initialize maps
    this.entities.forEach(entity => {
      referencedBy.set(entity.id, []);
      references.set(entity.id, []);
    });

    // Build reference relationships
    this.relationships.forEach(rel => {
      if (rel.type === 'reference') {
        // rel.source references rel.target
        const sourceRefs = references.get(rel.source) || [];
        sourceRefs.push(rel.target);
        references.set(rel.source, sourceRefs);
        
        const targetReferencedBy = referencedBy.get(rel.target) || [];
        targetReferencedBy.push(rel.source);
        referencedBy.set(rel.target, targetReferencedBy);
      }
    });

    // Find root nodes (entities that are not referenced by anyone)
    const rootNodes = this.entities.filter(entity => 
      (referencedBy.get(entity.id) || []).length === 0
    );

    // If no clear hierarchy (all entities are referenced), use force-directed layout
    if (rootNodes.length === 0) {
      return this.applyForceDirectedLayout(options);
    }

    // Calculate reference depth for each entity
    const referenceDepth = new Map<string, number>();
    const depthGroups = new Map<number, string[]>();
    
    // BFS to calculate reference depth
    const queue: { id: string; depth: number }[] = rootNodes.map(node => ({ id: node.id, depth: 0 }));
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      if (referenceDepth.has(id)) continue;
      
      referenceDepth.set(id, depth);
      
      if (!depthGroups.has(depth)) {
        depthGroups.set(depth, []);
      }
      depthGroups.get(depth)!.push(id);
      
      // Add referenced entities to queue with depth + 1
      const referencedEntities = references.get(id) || [];
      referencedEntities.forEach(refId => {
        if (!referenceDepth.has(refId)) {
          queue.push({ id: refId, depth: depth + 1 });
        }
      });
    }
    
    // Handle entities that weren't reached (disconnected components)
    this.entities.forEach(entity => {
      if (!referenceDepth.has(entity.id)) {
        const maxDepth = Math.max(...Array.from(referenceDepth.values()), -1);
        referenceDepth.set(entity.id, maxDepth + 1);
        if (!depthGroups.has(maxDepth + 1)) {
          depthGroups.set(maxDepth + 1, []);
        }
        depthGroups.get(maxDepth + 1)!.push(entity.id);
      }
    });

    return this.positionEntitiesByReferenceDepth(depthGroups, {
      levelSpacing,
      entitySpacing,
      startX,
      startY
    });
  }

  /**
   * Apply simple grid layout for entities without relationships
   */
  applyGridLayout(options: LayoutOptions = {}): Entity[] {
    const {
      entitySpacing = 400, // Increased from 300 to prevent overlapping
      startX = 100,
      startY = 100
    } = options;

    const updatedEntities = [...this.entities];
    const cols = Math.ceil(Math.sqrt(this.entities.length));
    
    this.entities.forEach((entity, index) => {
      const entityIndex = updatedEntities.findIndex(e => e.id === entity.id);
      if (entityIndex !== -1) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = startX + col * entitySpacing;
        const y = startY + row * entitySpacing;
        
        updatedEntities[entityIndex] = {
          ...updatedEntities[entityIndex],
          position: { x, y }
        };
      }
    });

    return updatedEntities;
  }

  /**
   * Apply force-directed layout for more organic positioning
   */
  applyForceDirectedLayout(options: LayoutOptions = {}): Entity[] {
    const {
      levelSpacing = 400,
      entitySpacing = 400, // Increased from 300 to prevent overlapping
      startX = 100,
      startY = 100
    } = options;

    if (this.entities.length === 0) return this.entities;

    // Initialize positions in a grid pattern
    const positions = new Map<string, { x: number; y: number }>();
    const cols = Math.ceil(Math.sqrt(this.entities.length));
    this.entities.forEach((entity, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions.set(entity.id, {
        x: startX + col * entitySpacing,
        y: startY + row * levelSpacing
      });
    });

    // Simple force-directed algorithm
    const iterations = 100;
    const k = Math.sqrt((400 * 400) / this.entities.length); // Optimal distance - increased for better spacing
    const c = 0.1; // Cooling factor

    for (let i = 0; i < iterations; i++) {
      const forces = new Map<string, { x: number; y: number }>();
      
      // Initialize forces
      this.entities.forEach(entity => {
        forces.set(entity.id, { x: 0, y: 0 });
      });

      // Calculate repulsive forces between all pairs
      for (let i = 0; i < this.entities.length; i++) {
        for (let j = i + 1; j < this.entities.length; j++) {
          const entity1 = this.entities[i];
          const entity2 = this.entities[j];
          const pos1 = positions.get(entity1.id)!;
          const pos2 = positions.get(entity2.id)!;
          
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = (k * k) / distance;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          const force1 = forces.get(entity1.id)!;
          const force2 = forces.get(entity2.id)!;
          
          force1.x += fx;
          force1.y += fy;
          force2.x -= fx;
          force2.y -= fy;
        }
      }

      // Calculate attractive forces for connected entities
      this.relationships.forEach(rel => {
        const pos1 = positions.get(rel.source)!;
        const pos2 = positions.get(rel.target)!;
        
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (distance * distance) / k;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        const force1 = forces.get(rel.source)!;
        const force2 = forces.get(rel.target)!;
        
        force1.x += fx;
        force1.y += fy;
        force2.x -= fx;
        force2.y -= fy;
      });

      // Apply forces with cooling
      const temperature = c * (1 - i / iterations);
      this.entities.forEach(entity => {
        const force = forces.get(entity.id)!;
        const pos = positions.get(entity.id)!;
        
        const displacement = Math.sqrt(force.x * force.x + force.y * force.y);
        if (displacement > 0) {
          pos.x += (force.x / displacement) * Math.min(displacement, temperature);
          pos.y += (force.y / displacement) * Math.min(displacement, temperature);
        }
      });
    }

    // Update entity positions
    return this.entities.map(entity => ({
      ...entity,
      position: positions.get(entity.id) || entity.position
    }));
  }

  private positionEntitiesByReferenceDepth(
    depthGroups: Map<number, string[]>,
    options: Required<LayoutOptions>
  ): Entity[] {
    const { levelSpacing, entitySpacing, startX, startY } = options;
    const updatedEntities = [...this.entities];
    
    depthGroups.forEach((entityIds, depth) => {
      const entitiesInDepth = entityIds.length;
      
      // Each depth is a column, positioned horizontally
      const columnX = startX + depth * levelSpacing;
      
      // Calculate vertical spacing for entities within the column
      const totalHeight = (entitiesInDepth - 1) * entitySpacing;
      const columnStartY = startY - totalHeight / 2; // Center the column vertically
      
      entityIds.forEach((entityId, index) => {
        const entityIndex = updatedEntities.findIndex(e => e.id === entityId);
        if (entityIndex !== -1) {
          const y = columnStartY + index * entitySpacing;
          
          updatedEntities[entityIndex] = {
            ...updatedEntities[entityIndex],
            position: { x: columnX, y }
          };
        }
      });
    });

    return updatedEntities;
  }
}

/**
 * Utility function to apply layout to existing diagram data
 */
export function applyLayoutToDiagram(
  entities: Entity[], 
  relationships: Relationship[], 
  layoutType: 'hierarchical' | 'force-directed' | 'grid' = 'hierarchical',
  options?: LayoutOptions
): Entity[] {
  const layoutEngine = new LayoutEngine(entities, relationships);
  
  switch (layoutType) {
    case 'hierarchical':
      return layoutEngine.applyHierarchicalLayout(options);
    case 'force-directed':
      return layoutEngine.applyForceDirectedLayout(options);
    case 'grid':
      return layoutEngine.applyGridLayout(options);
    default:
      return entities;
  }
}
