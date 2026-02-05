import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { AlertTriangle, Shield, Leaf, User } from 'lucide-react';

const RISK_TYPE_ICONS = {
  modifiable: Shield,
  non_modifiable: AlertTriangle,
  environmental: Leaf,
  behavioral: User,
};

const RISK_TYPE_LABELS = {
  modifiable: 'Modifiable',
  non_modifiable: 'Non-Modifiable',
  environmental: 'Environmental',
  behavioral: 'Behavioral',
};

/**
 * Risk factor node
 */
const RiskFactorNode = memo(({ data, selected }) => {
  const Icon = RISK_TYPE_ICONS[data.riskType] || AlertTriangle;
  const color = data.color || data.severityColor || '#f97316';
  const isModifiable = data.isModifiable || data.riskType === 'modifiable' || data.riskType === 'behavioral';

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg shadow-md border-2 transition-all duration-200
        bg-white min-w-[140px] max-w-[180px]
        ${selected ? 'shadow-lg scale-105' : 'hover:shadow-lg hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handle */}
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-2 !h-2"
        style={{ background: color }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-xs text-gray-800 leading-tight">
            {data.name}
          </div>
          {data.riskType && (
            <div
              className="mt-1 text-[10px] font-medium"
              style={{ color }}
            >
              {RISK_TYPE_LABELS[data.riskType] || data.riskType}
            </div>
          )}
        </div>
      </div>

      {/* Severity indicator */}
      {data.severity && (
        <div className="absolute -top-1.5 -right-1.5">
          <span
            className="block w-3 h-3 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: color }}
            title={`Severity: ${data.severity}`}
          />
        </div>
      )}

      {/* Modifiable badge */}
      {isModifiable && (
        <div className="mt-2 pt-1.5 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-50 text-green-700">
            <Shield className="w-2.5 h-2.5" />
            Modifiable
          </span>
        </div>
      )}
    </div>
  );
});

RiskFactorNode.displayName = 'RiskFactorNode';

export default RiskFactorNode;
