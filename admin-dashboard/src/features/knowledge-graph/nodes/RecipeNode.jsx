import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ChefHat } from 'lucide-react';

const RecipeNode = memo(({ data, selected }) => {
  const tags = data.dietaryTags || [];
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-amber-50
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse' : ''}
        ${selected ? 'shadow-xl scale-105 border-amber-400' : 'border-amber-200 hover:border-amber-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '150px', maxWidth: '200px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md flex-shrink-0">
          <ChefHat className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-0.5">
            Recipe
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight line-clamp-2"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>

      {/* Dietary Tags */}
      {tags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-100 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-700"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[9px] text-gray-400">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-white"
      />
    </div>
  );
});

RecipeNode.displayName = 'RecipeNode';

export default RecipeNode;
