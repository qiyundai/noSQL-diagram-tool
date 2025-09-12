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
   */
  applyHierarchicalLayout(options: LayoutOptions = {}): Entity[] {
    const {
      levelSpacing = 400,
      entitySpacing = 400, // Increased from 300 to prevent overlapping
      startX = 100,
      startY = 100
    } = options;

    if (this.entities.length === 0) return this.entities;

    // If no relationships, use grid layout
    if (this.relationships.length === 0) {
      return this.applyGridLayout(options);
    }

    // Build adjacency list for relationship analysis
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize maps
    this.entities.forEach(entity => {
      adjacencyList.set(entity.id, []);
      inDegree.set(entity.id, 0);
    });

    // Build graph from relationships
    this.relationships.forEach(rel => {
      const sourceList = adjacencyList.get(rel.source) || [];
      sourceList.push(rel.target);
      adjacencyList.set(rel.source, sourceList);
      
      const targetInDegree = inDegree.get(rel.target) || 0;
      inDegree.set(rel.target, targetInDegree + 1);
    });

    // Find root nodes (entities with no incoming relationships)
    const rootNodes = this.entities.filter(entity => 
      (inDegree.get(entity.id) || 0) === 0
    );

    // If no clear hierarchy (all entities have relationships), use force-directed layout
    if (rootNodes.length === 0 || rootNodes.length === this.entities.length) {
      return this.applyForceDirectedLayout(options);
    }

    // Apply hierarchical layout
    const startNode = rootNodes[0];
    return this.positionEntitiesHierarchically(startNode.id, adjacencyList, {
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

  private positionEntitiesHierarchically(
    rootId: string, 
    adjacencyList: Map<string, string[]>,
    options: Required<LayoutOptions>
  ): Entity[] {
    const { levelSpacing, entitySpacing, startX, startY } = options;
    const visited = new Set<string>();
    const levels = new Map<string, number>();
    const levelGroups = new Map<number, string[]>();
    
    // BFS to assign levels
    const queue: { id: string; level: number }[] = [{ id: rootId, level: 0 }];
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, level);
      
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(id);
      
      // Add children to queue
      const children = adjacencyList.get(id) || [];
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }
    
    // Handle unvisited nodes (disconnected components)
    this.entities.forEach(entity => {
      if (!visited.has(entity.id)) {
        const maxLevel = Math.max(...Array.from(levels.values()), -1);
        levels.set(entity.id, maxLevel + 1);
        if (!levelGroups.has(maxLevel + 1)) {
          levelGroups.set(maxLevel + 1, []);
        }
        levelGroups.get(maxLevel + 1)!.push(entity.id);
      }
    });

    // Position entities by level with balanced multi-column layout
    const updatedEntities = [...this.entities];
    
    levelGroups.forEach((entityIds, level) => {
      const entitiesInLevel = entityIds.length;
      
      // Calculate optimal number of columns for this level
      const maxColumns = Math.min(3, Math.ceil(Math.sqrt(entitiesInLevel * 1.5))); // Reduced max columns for better spacing
      const columns = Math.min(maxColumns, entitiesInLevel);
      
      // Calculate spacing for this level
      const levelWidth = (columns - 1) * entitySpacing;
      
      // Center the level horizontally
      const levelStartX = startX - levelWidth / 2;
      const levelStartY = startY + level * levelSpacing;
      
      entityIds.forEach((entityId, index) => {
        const entityIndex = updatedEntities.findIndex(e => e.id === entityId);
        if (entityIndex !== -1) {
          const row = Math.floor(index / columns);
          const col = index % columns;
          
          const x = levelStartX + col * entitySpacing;
          const y = levelStartY + row * (levelSpacing * 0.6);
          
          updatedEntities[entityIndex] = {
            ...updatedEntities[entityIndex],
            position: { x, y }
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
