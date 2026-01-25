import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
} from 'reactflow';

const STRENGTH_CONFIG = {
  high: {
    color: '#22c55e',
    label: 'High',
    strokeWidth: 3,
    animated: true,
  },
  moderate: {
    color: '#eab308',
    label: 'Moderate',
    strokeWidth: 2,
    animated: false,
  },
  emerging: {
    color: '#3b82f6',
    label: 'Emerging',
    strokeWidth: 2,
    animated: false,
  },
  insufficient: {
    color: '#9ca3af',
    label: 'Insufficient',
    strokeWidth: 1,
    animated: false,
  },
};

const RECOMMENDATION_CONFIG = {
  core: { label: 'Core', color: '#22c55e', bg: 'bg-green-100' },
  adjunct: { label: 'Adjunct', color: '#3b82f6', bg: 'bg-blue-100' },
  optional: { label: 'Optional', color: '#9ca3af', bg: 'bg-gray-100' },
};

const ConditionInterventionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
  markerEnd,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const strength = data?.strengthOfEvidence || 'emerging';
  const recommendation = data?.recommendationLevel || 'optional';
  const clinicalNotes = data?.clinicalNotes;

  const config = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG.emerging;
  const recConfig = RECOMMENDATION_CONFIG[recommendation] || RECOMMENDATION_CONFIG.optional;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: config.color,
          strokeWidth: selected ? config.strokeWidth + 1 : config.strokeWidth,
          filter: selected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : undefined,
        }}
        className={config.animated ? 'animated-edge' : ''}
      />

      {/* Animated dash overlay for high strength */}
      {config.animated && (
        <path
          d={edgePath}
          fill="none"
          stroke={config.color}
          strokeWidth={config.strokeWidth}
          strokeDasharray="5,5"
          className="animate-dash"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Main badge */}
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold
              bg-white shadow-md border-2 cursor-pointer transition-all
              hover:scale-110 hover:shadow-lg
              ${selected ? 'ring-2 ring-offset-1' : ''}
            `}
            style={{
              borderColor: config.color,
              color: config.color,
              ringColor: config.color,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </div>

          {/* Tooltip */}
          {showTooltip && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                         bg-white rounded-lg shadow-xl border border-gray-200 p-3
                         min-w-[180px] max-w-[250px]"
            >
              <div className="text-xs font-semibold text-gray-900 mb-2">
                Relationship Details
              </div>

              <div className="space-y-2">
                {/* Strength */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Evidence:</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Recommendation */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Level:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${recConfig.bg}`}
                    style={{ color: recConfig.color }}
                  >
                    {recConfig.label}
                  </span>
                </div>

                {/* Clinical Notes */}
                {clinicalNotes && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-[10px] text-gray-500 mb-1">Notes:</div>
                    <div className="text-[10px] text-gray-700 italic leading-relaxed">
                      {clinicalNotes}
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3
                           bg-white border-l border-t border-gray-200 rotate-45"
              />
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

ConditionInterventionEdge.displayName = 'ConditionInterventionEdge';

export default ConditionInterventionEdge;
