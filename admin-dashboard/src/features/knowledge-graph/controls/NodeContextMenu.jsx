import { memo, useEffect, useRef } from 'react';
import { Eye, ExternalLink, Focus, Copy, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Context menu that appears on right-click of a node.
 * Provides quick actions like view details, navigate, focus, etc.
 */
const NodeContextMenu = memo(({
  node,
  position,
  onClose,
  onViewDetails,
  onNavigate,
  onFocus,
}) => {
  const { t } = useTranslation(['knowledgeGraph']);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!node || !position) return null;

  const isGroupNode = node.type === 'group';
  const hasDetailPage = ['condition', 'intervention', 'recipe', 'scripture', 'egwReference'].includes(node.type);

  const handleCopyLabel = () => {
    const label = node.data?.label || '';
    navigator.clipboard.writeText(label);
    onClose();
  };

  const menuItems = [
    // View details in side panel (not for groups)
    !isGroupNode && {
      icon: Eye,
      label: t('knowledgeGraph:contextMenu.viewDetails'),
      onClick: () => {
        onViewDetails(node);
        onClose();
      },
    },
    // Navigate to full page (only for certain types)
    !isGroupNode && hasDetailPage && {
      icon: ExternalLink,
      label: t('knowledgeGraph:contextMenu.openFullPage'),
      onClick: () => {
        onNavigate(node.type, node.data?.entityId);
        onClose();
      },
    },
    // Focus/zoom on node
    {
      icon: Focus,
      label: isGroupNode ? t('knowledgeGraph:contextMenu.zoomToGroup') : t('knowledgeGraph:contextMenu.focusOnNode'),
      onClick: () => {
        onFocus(node);
        onClose();
      },
    },
    // Copy node label
    !isGroupNode && {
      icon: Copy,
      label: t('knowledgeGraph:contextMenu.copyName'),
      onClick: handleCopyLabel,
    },
  ].filter(Boolean);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100] min-w-[160px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide">
          {isGroupNode ? t('knowledgeGraph:contextMenu.group') : t(`knowledgeGraph:nodes.${node.type}`)}
        </div>
        <div className="text-xs font-medium text-gray-900 truncate max-w-[180px]">
          {node.data?.label || t('knowledgeGraph:contextMenu.untitled')}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <item.icon className="w-3.5 h-3.5 text-gray-400" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Close hint */}
      <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400">
        {t('knowledgeGraph:contextMenu.escToClose')}
      </div>
    </div>
  );
});

NodeContextMenu.displayName = 'NodeContextMenu';

export default NodeContextMenu;
