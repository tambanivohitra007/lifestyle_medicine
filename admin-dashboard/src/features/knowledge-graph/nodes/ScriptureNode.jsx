import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { BookOpen } from 'lucide-react';

const ScriptureNode = memo(({ data, selected }) => {
  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-indigo-50
        ${selected ? 'shadow-xl scale-105 border-indigo-400' : 'border-indigo-200 hover:border-indigo-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '150px', maxWidth: '200px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md flex-shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-0.5">
            Scripture
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight line-clamp-2"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>

      {/* Theme Badge */}
      {data.theme && (
        <div className="mt-2 pt-2 border-t border-indigo-100">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {data.theme}
          </span>
        </div>
      )}

      {/* Preview text */}
      {data.text && (
        <div className="mt-1.5 text-[10px] text-gray-500 italic line-clamp-2" title={data.text}>
          "{data.text.substring(0, 60)}..."
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white"
      />
    </div>
  );
});

ScriptureNode.displayName = 'ScriptureNode';

export default ScriptureNode;
