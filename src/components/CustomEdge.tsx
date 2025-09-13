import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  // Smart control points calculation (currently unused but may be needed for future enhancements)
  // const getSmartControlPoints = () => {
  //   const dx = targetX - sourceX;
  //   const dy = targetY - sourceY;
  //   const distance = Math.sqrt(dx * dx + dy * dy);
  //   
  //   // Adjust control point offset based on distance and direction
  //   const offset = Math.min(distance * 0.3, 150);
  //   
  //   // For horizontal layouts, prefer vertical curves
  //   if (Math.abs(dx) > Math.abs(dy)) {
  //     return {
  //       sourceControlX: sourceX + (dx > 0 ? offset : -offset),
  //       sourceControlY: sourceY,
  //       targetControlX: targetX + (dx > 0 ? -offset : offset),
  //       targetControlY: targetY,
  //     };
  //   } else {
  //     // For vertical layouts, prefer horizontal curves
  //     return {
  //       sourceControlX: sourceX,
  //       sourceControlY: sourceY + (dy > 0 ? offset : -offset),
  //       targetControlX: targetX,
  //       targetControlY: targetY + (dy > 0 ? -offset : offset),
  //     };
  //   }
  // };
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3, // Add some curvature to make edges more readable
  });

  const getEdgeLabel = (type: string) => {
    const labels = {
      reference: 'ref',
      composition: 'comp',
      aggregation: 'agg',
      inheritance: 'inherits'
    };
    return labels[type as keyof typeof labels] || '';
  };

  const getEdgeStyle = (type: string, isSelected: boolean) => {
    const baseColor = isSelected ? '#3b82f6' : '#6b7280'; // Blue when selected, gray by default
    
    const styles = {
      reference: { stroke: baseColor, strokeWidth: isSelected ? 3 : 2, strokeDasharray: '0' },
      composition: { stroke: isSelected ? '#ef4444' : '#9ca3af', strokeWidth: isSelected ? 3 : 2, strokeDasharray: '0' },
      aggregation: { stroke: isSelected ? '#f59e0b' : '#9ca3af', strokeWidth: isSelected ? 3 : 2, strokeDasharray: '5,5' },
      inheritance: { stroke: isSelected ? '#10b981' : '#9ca3af', strokeWidth: isSelected ? 3 : 2, strokeDasharray: '0' }
    };
    return styles[type as keyof typeof styles] || { stroke: baseColor, strokeWidth: isSelected ? 3 : 2, strokeDasharray: '0' };
  };

  const edgeStyle = getEdgeStyle(data?.type, selected || false);

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            className="px-2 py-1 rounded shadow-sm border text-white font-medium"
            style={{ 
              backgroundColor: selected ? edgeStyle.stroke : '#6b7280',
              borderColor: selected ? edgeStyle.stroke : '#6b7280',
              fontSize: '10px'
            }}
          >
            {data?.label || getEdgeLabel(data?.type)}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export { CustomEdge };
