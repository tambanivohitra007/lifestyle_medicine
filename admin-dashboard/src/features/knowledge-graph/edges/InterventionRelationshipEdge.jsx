import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';
import { useTranslation } from 'react-i18next';

// Relationship type icons and colors
const RELATIONSHIP_CONFIG = {
  synergy: {
    icon: '⚡',
    color: '#10b981',
    label: 'synergy',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
  },
  complementary: {
    icon: '✓',
    color: '#22c55e',
    label: 'complementary',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  neutral: {
    icon: '○',
    color: '#94a3b8',
    label: 'neutral',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
  caution: {
    icon: '⚠',
    color: '#f59e0b',
    label: 'caution',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
  },
  conflict: {
    icon: '✕',
    color: '#ef4444',
    label: 'conflict',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
};

/**
 * Custom edge for intervention relationships (synergies, conflicts, etc.)
 * Shows relationship type with distinctive styling.
 */
const InterventionRelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  style,
  data,
}) => {
  const { t } = useTranslation(['knowledgeGraph']);
  const [isHovered, setIsHovered] = useState(false);

  const relationshipType = data?.relationshipType || 'neutral';
  const config = RELATIONSHIP_CONFIG[relationshipType] || RELATIONSHIP_CONFIG.neutral;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  // Edge styling based on relationship type
  const edgeStyle = {
    stroke: config.color,
    strokeWidth: selected ? 4 : isHovered ? 3 : (style?.strokeWidth || 2),
    strokeDasharray: data?.isNegative ? '8,4' : undefined,
    filter: selected ? `drop-shadow(0 0 4px ${config.color}50)` : undefined,
    opacity: isHovered || selected ? 1 : 0.8,
    transition: 'all 0.2s ease',
    ...style,
  };

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />

      {/* Edge label - always visible for relationship edges */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                        shadow-md border backdrop-blur-sm cursor-pointer
                        ${config.bgColor} ${config.textColor} border-white/50`}
            style={{
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span className="text-sm">{config.icon}</span>
            <span className="uppercase tracking-wide">
              {t(`knowledgeGraph:relationships.types.${relationshipType}`, relationshipType)}
            </span>
          </div>

          {/* Expanded details on hover */}
          {isHovered && data?.description && (
            <div
              className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50
                         bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48"
            >
              <p className="text-xs text-gray-600">{data.description}</p>
              {data.clinicalNotes && (
                <p className="text-xs text-gray-400 mt-1 italic">{data.clinicalNotes}</p>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

InterventionRelationshipEdge.displayName = 'InterventionRelationshipEdge';

export default InterventionRelationshipEdge;
