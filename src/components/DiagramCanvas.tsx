import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Entity, Relationship, DiagramData } from '../types';
import EntityNode from './EntityNode';
import { CustomEdge } from './CustomEdge';
import { ReferenceManager } from '../utils/referenceManager';

const nodeTypes: NodeTypes = {
  entity: EntityNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface DiagramCanvasProps {
  data: DiagramData;
  onUpdate: (data: DiagramData) => void;
  showMiniMap?: boolean;
}

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ data, onUpdate, showMiniMap = true }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert entities to nodes
  const entityNodes: Node[] = useMemo(() => 
    data.entities.map(entity => ({
      id: entity.id,
      type: 'entity',
      position: entity.position,
      data: {
        ...entity,
        onUpdate: (updatedEntity: Entity) => {
          const updatedEntities = data.entities.map(e => 
            e.id === updatedEntity.id ? updatedEntity : e
          );
          onUpdate({ ...data, entities: updatedEntities });
        },
        onDelete: (entityId: string) => {
          // Use ReferenceManager to clean up all references
          const updatedData = ReferenceManager.cleanupReferencesOnEntityDelete(entityId, data);
          onUpdate(updatedData);
        },
        onUpdateDiagram: onUpdate,
        diagramData: data
      }
    })), [data.entities, data.relationships]
  );

  // Convert relationships to edges
  const relationshipEdges: Edge[] = useMemo(() => 
    data.relationships.map(rel => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      type: 'custom',
      data: {
        type: rel.type,
        label: rel.label
      },
    })), [data.relationships]
  );

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(entityNodes);
  }, [entityNodes, setNodes]);

  React.useEffect(() => {
    setEdges(relationshipEdges);
  }, [relationshipEdges, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    const sourceEntity = data.entities.find(e => e.id === params.source);
    const targetEntity = data.entities.find(e => e.id === params.target);

    if (!sourceEntity || !targetEntity) {
      return;
    }

    // Check if relationship already exists
    const existingRelationship = data.relationships.find(rel => 
      rel.source === params.source && rel.target === params.target
    );

    if (existingRelationship) {
      return;
    }

    // Create the relationship
    const newRelationship: Relationship = {
      id: `rel-${Date.now()}`,
      source: params.source!,
      target: params.target!,
      type: 'reference',
      label: ''
    };

    // Use ReferenceManager to create reference property in target entity
    const updatedData = ReferenceManager.createReferenceOnConnection(
      sourceEntity,
      targetEntity,
      { ...data, relationships: [...data.relationships, newRelationship] }
    );

    onUpdate(updatedData);
  }, [data, onUpdate]);

  const onNodeDragStop = useCallback((_event: any, node: Node) => {
    const updatedEntities = data.entities.map(entity => 
      entity.id === node.id 
        ? { ...entity, position: node.position }
        : entity
    );
    onUpdate({ ...data, entities: updatedEntities });
  }, [data, onUpdate]);

  // Handle edge changes (including deletions)
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);
    
    // Check for edge deletions
    const deletions = changes.filter(change => change.type === 'remove');
    if (deletions.length > 0) {
      const deletedEdgeIds = deletions.map(change => change.id);
      const updatedRelationships = data.relationships.filter(rel => 
        !deletedEdgeIds.includes(rel.id)
      );
      onUpdate({ ...data, relationships: updatedRelationships });
    }
  }, [data, onUpdate, onEdgesChange]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>
        <Controls />
        {showMiniMap && (
          <MiniMap 
            nodeColor={(node) => {
              const entity = data.entities.find(e => e.id === node.id);
              return entity?.color || '#3b82f6';
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        )}
        <Background color="#f1f5f9" gap={20} />
      </ReactFlow>
    </div>
  );
};


const DiagramCanvasWithProvider: React.FC<DiagramCanvasProps> = (props) => (
  <ReactFlowProvider>
    <DiagramCanvas {...props} />
  </ReactFlowProvider>
);

export default DiagramCanvasWithProvider;
