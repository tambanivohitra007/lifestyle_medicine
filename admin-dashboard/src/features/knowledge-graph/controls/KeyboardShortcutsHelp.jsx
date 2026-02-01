import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SHORTCUTS_CONFIG = [
  { keys: ['Ctrl', 'S'], descriptionKey: 'knowledgeGraph:shortcuts.saveAsPng' },
  { keys: ['Ctrl', '0'], descriptionKey: 'knowledgeGraph:shortcuts.resetZoom' },
  { keys: ['Ctrl', '+'], descriptionKey: 'knowledgeGraph:shortcuts.zoomIn' },
  { keys: ['Ctrl', '-'], descriptionKey: 'knowledgeGraph:shortcuts.zoomOut' },
  { keys: ['F'], descriptionKey: 'knowledgeGraph:shortcuts.fitToView' },
  { keys: ['H'], descriptionKey: 'knowledgeGraph:shortcuts.hierarchicalLayout' },
  { keys: ['R'], descriptionKey: 'knowledgeGraph:shortcuts.radialLayout' },
  { keys: ['C'], descriptionKey: 'knowledgeGraph:shortcuts.clusterLayout' },
  { keys: ['Esc'], descriptionKey: 'knowledgeGraph:shortcuts.clearSelection' },
];

const KeyboardShortcutsHelp = () => {
  const { t } = useTranslation(['knowledgeGraph']);
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white rounded-lg shadow-md border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
        title={t('knowledgeGraph:shortcuts.title')}
      >
        <Keyboard className="w-4 h-4 text-gray-500" />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{t('knowledgeGraph:shortcuts.title')}</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      <div className="space-y-1.5">
        {SHORTCUTS_CONFIG.map((shortcut, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{t(shortcut.descriptionKey)}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIdx) => (
                <span key={keyIdx}>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-600">
                    {key}
                  </kbd>
                  {keyIdx < shortcut.keys.length - 1 && (
                    <span className="text-gray-400 mx-0.5">+</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
