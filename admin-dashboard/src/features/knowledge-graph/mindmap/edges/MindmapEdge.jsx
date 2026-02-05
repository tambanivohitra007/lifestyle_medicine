import { memo } from 'react';
import { BaseEdge, getSmoothStepPath } from 'reactflow';

/**
 * Mindmap edge - step/orthogonal connector with rounded corners
 * Creates clean right-angle paths between nodes
 */
const MindmapEdge = memo(({
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
}) => {
  const color = data?.color || '#94a3b8';
  const isDashed = data?.dashed;

  // Use smooth step path for orthogonal edges with rounded corners
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12, // Rounded corners at turns
    offset: 20, // Distance before first turn
  });

  return (
    <>
      {/* Subtle glow/shadow effect */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.08}
        style={{ pointerEvents: 'none' }}
      />

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isDashed ? '6,4' : undefined,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined,
          transition: 'stroke-width 0.2s, filter 0.2s',
        }}
      />
    </>
  );
});

MindmapEdge.displayName = 'MindmapEdge';

export default MindmapEdge;
