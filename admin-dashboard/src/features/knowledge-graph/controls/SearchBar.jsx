import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const NODE_TYPE_COLORS = {
  condition: '#ef4444',
  intervention: '#f43f5e',
  careDomain: '#3b82f6',
  scripture: '#6366f1',
  egwReference: '#8b5cf6',
  recipe: '#f59e0b',
  evidenceEntry: '#10b981',
  reference: '#64748b',
};

const SearchBar = ({ nodes = [], onSelectNode, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter nodes based on query (exclude group container nodes)
  const filteredNodes = query.length >= 2
    ? nodes.filter((node) => {
        // Skip group container nodes
        if (node.type === 'group') return false;
        const label = node.data?.label || '';
        return label.toLowerCase().includes(query.toLowerCase());
      }).slice(0, 10) // Limit to 10 results
    : [];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || filteredNodes.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredNodes.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredNodes[selectedIndex]) {
            handleSelect(filteredNodes[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredNodes, selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredNodes.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredNodes.length > 0) {
      const selectedItem = listRef.current.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (node) => {
    setQuery('');
    setIsOpen(false);
    onSelectNode(node);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    if (onClearSearch) {
      onClearSearch();
    }
  };

  const getNodeTypeLabel = (type) => {
    const labels = {
      condition: 'Condition',
      intervention: 'Intervention',
      careDomain: 'Care Domain',
      scripture: 'Scripture',
      egwReference: 'EGW Ref',
      recipe: 'Recipe',
      evidenceEntry: 'Evidence',
      reference: 'Reference',
    };
    return labels[type] || type;
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search nodes..."
            className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {isOpen && filteredNodes.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <ul ref={listRef} className="max-h-64 overflow-y-auto">
            {filteredNodes.map((node, index) => (
              <li key={node.id}>
                <button
                  onClick={() => handleSelect(node)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: NODE_TYPE_COLORS[node.type] || '#666' }}
                  />
                  <span className="flex-1 truncate font-medium">
                    {node.data?.label || 'Untitled'}
                  </span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {getNodeTypeLabel(node.type)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400">
            Use ↑↓ to navigate, Enter to select
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && filteredNodes.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
          <p className="text-xs text-gray-500 text-center">No nodes found</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
