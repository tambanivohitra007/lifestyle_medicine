import { memo } from 'react';
import { BaseEdge, getBezierPath } from 'reactflow';

/**
 * Generic styled edge for non-intervention relationships.
 * Supports different line styles based on relationship type.
 */
const RelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  style,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Merge default style with passed style
  const edgeStyle = {
    strokeWidth: selected ? 2 : 1.5,
    filter: selected ? 'drop-shadow(0 0 3px rgba(0,0,0,0.2))' : undefined,
    ...style,
  };

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={edgeStyle}
    />
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';

export default RelationshipEdge;
