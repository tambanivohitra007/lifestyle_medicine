import { memo } from 'react';
import { X, ExternalLink, AlertCircle, Pill, BookOpen, UtensilsCrossed, FileText, Quote, FlaskConical, Heart } from 'lucide-react';

const NODE_TYPE_CONFIG = {
  condition: {
    icon: AlertCircle,
    color: '#ef4444',
    bgColor: '#fef2f2',
    title: 'Condition',
  },
  intervention: {
    icon: Pill,
    color: '#f43f5e',
    bgColor: '#fff1f2',
    title: 'Intervention',
  },
  careDomain: {
    icon: Heart,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    title: 'Care Domain',
  },
  scripture: {
    icon: BookOpen,
    color: '#6366f1',
    bgColor: '#eef2ff',
    title: 'Scripture',
  },
  egwReference: {
    icon: Quote,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    title: 'EGW Reference',
  },
  recipe: {
    icon: UtensilsCrossed,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    title: 'Recipe',
  },
  evidenceEntry: {
    icon: FlaskConical,
    color: '#10b981',
    bgColor: '#ecfdf5',
    title: 'Evidence',
  },
  reference: {
    icon: FileText,
    color: '#64748b',
    bgColor: '#f8fafc',
    title: 'Reference',
  },
};

const NodeDetailsPanel = memo(({ node, onClose, onNavigate }) => {
  if (!node) return null;

  const config = NODE_TYPE_CONFIG[node.type] || NODE_TYPE_CONFIG.reference;
  const Icon = config.icon;
  const data = node.data || {};

  const renderConditionDetails = () => (
    <>
      {data.category && (
        <DetailRow label="Category" value={data.category} />
      )}
      {data.summary && (
        <DetailSection label="Summary" value={data.summary} />
      )}
    </>
  );

  const renderInterventionDetails = () => (
    <>
      {data.careDomain && (
        <DetailRow label="Care Domain" value={data.careDomain} />
      )}
      {data.mechanism && (
        <DetailSection label="Mechanism" value={data.mechanism} />
      )}
    </>
  );

  const renderScriptureDetails = () => (
    <>
      {data.theme && (
        <DetailRow label="Theme" value={data.theme} />
      )}
      {data.text && (
        <DetailSection label="Text" value={data.text} isQuote />
      )}
    </>
  );

  const renderEgwDetails = () => (
    <>
      {data.book && (
        <DetailRow label="Book" value={data.book} />
      )}
      {data.topic && (
        <DetailRow label="Topic" value={data.topic} />
      )}
      {data.quote && (
        <DetailSection label="Quote" value={data.quote} isQuote />
      )}
    </>
  );

  const renderRecipeDetails = () => (
    <>
      {data.dietaryTags && data.dietaryTags.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Dietary Tags</div>
          <div className="flex flex-wrap gap-1">
            {(Array.isArray(data.dietaryTags) ? data.dietaryTags : [data.dietaryTags]).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      {data.description && (
        <DetailSection label="Description" value={data.description} />
      )}
    </>
  );

  const renderEvidenceDetails = () => (
    <>
      {data.studyType && (
        <DetailRow label="Study Type" value={data.studyType.replace(/_/g, ' ')} />
      )}
      {data.qualityRating && (
        <DetailRow label="Quality" value={data.qualityRating} />
      )}
      {data.population && (
        <DetailRow label="Population" value={data.population} />
      )}
      {data.summary && (
        <DetailSection label="Summary" value={data.summary} />
      )}
    </>
  );

  const renderReferenceDetails = () => (
    <>
      {data.year && (
        <DetailRow label="Year" value={data.year} />
      )}
      {data.citation && (
        <DetailSection label="Citation" value={data.citation} />
      )}
      {(data.doi || data.pmid || data.url) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Links</div>
          <div className="flex flex-wrap gap-2">
            {data.doi && (
              <a
                href={`https://doi.org/${data.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                DOI
              </a>
            )}
            {data.pmid && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${data.pmid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                PubMed
              </a>
            )}
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                URL
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );

  const renderCareDomainDetails = () => (
    <>
      {data.description && (
        <DetailSection label="Description" value={data.description} />
      )}
    </>
  );

  const renderDetails = () => {
    switch (node.type) {
      case 'condition':
        return renderConditionDetails();
      case 'intervention':
        return renderInterventionDetails();
      case 'scripture':
        return renderScriptureDetails();
      case 'egwReference':
        return renderEgwDetails();
      case 'recipe':
        return renderRecipeDetails();
      case 'evidenceEntry':
        return renderEvidenceDetails();
      case 'reference':
        return renderReferenceDetails();
      case 'careDomain':
        return renderCareDomainDetails();
      default:
        return null;
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-100"
        style={{ backgroundColor: config.bgColor }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="p-2 rounded-lg shadow-sm flex-shrink-0"
              style={{ backgroundColor: config.color }}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: config.color }}
              >
                {config.title}
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight break-words">
                {data.label || 'Untitled'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderDetails()}
      </div>

      {/* Footer Actions */}
      {data.entityId && onNavigate && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => onNavigate(node.type, data.entityId)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: config.color }}
          >
            <ExternalLink className="w-4 h-4" />
            View Full Details
          </button>
        </div>
      )}
    </div>
  );
});

// Helper components
const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-medium text-gray-900 capitalize">{value}</span>
  </div>
);

const DetailSection = ({ label, value, isQuote }) => (
  <div className="mb-3">
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div
      className={`text-xs text-gray-700 leading-relaxed ${
        isQuote ? 'italic border-l-2 border-gray-200 pl-3' : ''
      }`}
    >
      {value}
    </div>
  </div>
);

NodeDetailsPanel.displayName = 'NodeDetailsPanel';

export default NodeDetailsPanel;
