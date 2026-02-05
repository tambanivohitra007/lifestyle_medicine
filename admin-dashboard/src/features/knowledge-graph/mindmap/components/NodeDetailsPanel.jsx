import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Heart,
  AlertTriangle,
  AlertCircle,
  Activity,
  HeartPulse,
  PlusCircle,
  BookOpen,
  Lightbulb,
  FileText,
  Stethoscope,
  ChefHat,
  FileCheck,
  BookHeart,
  Bookmark,
} from 'lucide-react';

/**
 * Icon mapping for section types
 */
const SECTION_ICONS = {
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'activity': Activity,
  'heart-pulse': HeartPulse,
  'plus-circle': PlusCircle,
  'book-open': BookOpen,
  'lightbulb': Lightbulb,
  'file-text': FileText,
};

/**
 * Node Details Panel - Sliding panel showing full details of clicked node
 */
const NodeDetailsPanel = memo(({ node, onClose }) => {
  const { t } = useTranslation(['knowledgeGraph']);

  if (!node) return null;

  const { type, data } = node;

  // Render content based on node type
  const renderContent = () => {
    switch (type) {
      case 'centerCondition':
        return <ConditionDetails data={data} t={t} />;
      case 'sectionBranch':
      case 'masterNode':
        return <MasterNodeDetails data={data} t={t} />;
      case 'sectionItem':
        return <SectionItemDetails data={data} t={t} />;
      case 'solutionCategory':
        return <SolutionCategoryDetails data={data} t={t} />;
      case 'intervention':
      case 'interventionNode':
        return <InterventionDetails data={data} t={t} />;
      case 'recipe':
        return <RecipeDetails data={data} t={t} />;
      case 'scripture':
        return <ScriptureDetails data={data} t={t} />;
      case 'egwReference':
        return <EgwReferenceDetails data={data} t={t} />;
      case 'leafNode':
        return <LeafNodeDetails data={data} t={t} />;
      default:
        return <GenericDetails data={data} t={t} />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200"
        style={{ backgroundColor: `${data.color}10` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: data.color || '#6b7280' }}
          >
            {getNodeIcon(type, data)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {data.name || data.title || data.label || data.reference || 'Details'}
            </h3>
            <span className="text-xs text-gray-500 capitalize">
              {type.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label={t('close', 'Close')}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
});

NodeDetailsPanel.displayName = 'NodeDetailsPanel';

/**
 * Get icon for node type
 */
function getNodeIcon(type, data) {
  const iconClass = "w-4 h-4 text-white";

  switch (type) {
    case 'centerCondition':
      return <Heart className={iconClass} />;
    case 'sectionBranch': {
      const SectionIcon = SECTION_ICONS[data.icon] || FileText;
      return <SectionIcon className={iconClass} />;
    }
    case 'sectionItem':
      return <FileText className={iconClass} />;
    case 'solutionCategory':
      return <HeartPulse className={iconClass} />;
    case 'intervention':
      return <Stethoscope className={iconClass} />;
    case 'recipe':
      return <ChefHat className={iconClass} />;
    case 'scripture':
      return <BookOpen className={iconClass} />;
    case 'egwReference':
      return <BookHeart className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
}

/**
 * Condition center node details
 */
const ConditionDetails = ({ data, t }) => (
  <div className="space-y-4">
    {data.summary && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('summary', 'Summary')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {data.summary}
        </p>
      </div>
    )}
    {data.category && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('category', 'Category')}
        </h4>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {data.category}
        </span>
      </div>
    )}
  </div>
);

/**
 * Section branch node details (Risk Factors, Complications, etc.)
 */
const SectionBranchDetails = ({ data, t }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <span
        className="px-3 py-1 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: data.color }}
      >
        {data.count} {t('items', 'items')}
      </span>
    </div>

    {data.items && data.items.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {t('allItems', 'All Items')}
        </h4>
        <div className="space-y-2">
          {data.items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <h5 className="font-medium text-sm text-gray-800">
                {item.title || item.name}
              </h5>
              {item.body && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {item.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/**
 * Section item node details
 */
const SectionItemDetails = ({ data, t }) => (
  <div className="space-y-4">
    {data.sectionLabel && (
      <div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${data.color}15`,
            color: data.color
          }}
        >
          {data.sectionLabel}
        </span>
      </div>
    )}

    {data.body && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('content', 'Content')}
        </h4>
        <div
          className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      </div>
    )}
  </div>
);

/**
 * Solution category node details
 */
const SolutionCategoryDetails = ({ data, t }) => (
  <div className="space-y-4">
    {/* Stats */}
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2 rounded-lg bg-rose-50 text-center">
        <div className="text-lg font-bold text-rose-600">
          {data.interventionCount || 0}
        </div>
        <div className="text-xs text-rose-700">{t('interventions', 'Interventions')}</div>
      </div>
      <div className="p-2 rounded-lg bg-indigo-50 text-center">
        <div className="text-lg font-bold text-indigo-600">
          {data.scriptureCount || 0}
        </div>
        <div className="text-xs text-indigo-700">{t('scriptures', 'Scriptures')}</div>
      </div>
      <div className="p-2 rounded-lg bg-purple-50 text-center">
        <div className="text-lg font-bold text-purple-600">
          {data.egwCount || 0}
        </div>
        <div className="text-xs text-purple-700">{t('egwRefs', 'EGW Refs')}</div>
      </div>
    </div>

    {/* Interventions list */}
    {data.interventions && data.interventions.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          {t('interventions', 'Interventions')}
        </h4>
        <div className="space-y-2">
          {data.interventions.map((intervention) => (
            <div
              key={intervention.id}
              className="p-3 rounded-lg border border-gray-200"
            >
              <h5 className="font-medium text-sm text-gray-800">
                {intervention.name}
              </h5>
              {intervention.description && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {intervention.description}
                </p>
              )}
              {intervention.strengthOfEvidence && (
                <span className={`
                  mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium
                  ${intervention.strengthOfEvidence === 'high' ? 'bg-green-100 text-green-700' : ''}
                  ${intervention.strengthOfEvidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${intervention.strengthOfEvidence === 'emerging' ? 'bg-blue-100 text-blue-700' : ''}
                  ${intervention.strengthOfEvidence === 'insufficient' ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                  {intervention.strengthOfEvidence} evidence
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/**
 * Intervention node details
 */
const InterventionDetails = ({ data, t }) => (
  <div className="space-y-4">
    {/* Evidence badge */}
    {data.strengthOfEvidence && (
      <div className="flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-gray-400" />
        <span className={`
          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
          ${data.strengthOfEvidence === 'high' ? 'bg-green-100 text-green-700' : ''}
          ${data.strengthOfEvidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' : ''}
          ${data.strengthOfEvidence === 'emerging' ? 'bg-blue-100 text-blue-700' : ''}
          ${data.strengthOfEvidence === 'insufficient' ? 'bg-gray-100 text-gray-600' : ''}
        `}>
          {data.strengthOfEvidence} {t('evidence', 'evidence')}
        </span>
        {data.evidenceCount > 0 && (
          <span className="text-xs text-gray-500">
            ({data.evidenceCount} {t('studies', 'studies')})
          </span>
        )}
      </div>
    )}

    {/* Description */}
    {data.description && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('description', 'Description')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {data.description}
        </p>
      </div>
    )}

    {/* Mechanism */}
    {data.mechanism && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('mechanism', 'Mechanism of Action')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {data.mechanism}
        </p>
      </div>
    )}

    {/* Clinical notes */}
    {data.clinicalNotes && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('clinicalNotes', 'Clinical Notes')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed italic">
          {data.clinicalNotes}
        </p>
      </div>
    )}

    {/* Linked recipes */}
    {data.recipes && data.recipes.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-amber-500" />
          {t('linkedRecipes', 'Linked Recipes')}
        </h4>
        <div className="space-y-2">
          {data.recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="p-3 rounded-lg border border-amber-200 bg-amber-50"
            >
              <h5 className="font-medium text-sm text-amber-800">
                {recipe.title}
              </h5>
              {recipe.relevanceNote && (
                <p className="mt-1 text-xs text-amber-700">
                  {recipe.relevanceNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/**
 * Recipe node details
 */
const RecipeDetails = ({ data, t }) => (
  <div className="space-y-4">
    {data.description && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('description', 'Description')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {data.description}
        </p>
      </div>
    )}

    {data.dietaryTags && data.dietaryTags.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('dietaryTags', 'Dietary Tags')}
        </h4>
        <div className="flex flex-wrap gap-1">
          {data.dietaryTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )}

    {data.relevanceNote && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('relevance', 'Why This Recipe')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed italic">
          {data.relevanceNote}
        </p>
      </div>
    )}
  </div>
);

/**
 * Scripture node details
 */
const ScriptureDetails = ({ data, t }) => (
  <div className="space-y-4">
    {data.text && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('verse', 'Verse')}
        </h4>
        <blockquote className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-indigo-300 pl-4 py-2 bg-indigo-50 rounded-r-lg">
          "{data.text}"
        </blockquote>
      </div>
    )}

    {data.theme && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('theme', 'Theme')}
        </h4>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          <Bookmark className="w-3 h-3" />
          {data.theme}
        </span>
      </div>
    )}
  </div>
);

/**
 * EGW Reference node details
 */
const EgwReferenceDetails = ({ data, t }) => (
  <div className="space-y-4">
    {data.quote && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('quote', 'Quote')}
        </h4>
        <blockquote className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-purple-300 pl-4 py-2 bg-purple-50 rounded-r-lg">
          "{data.quote}"
        </blockquote>
      </div>
    )}

    <div className="flex flex-wrap gap-2">
      {data.book && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
          {data.book}
        </span>
      )}
      {data.topic && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
          {data.topic}
        </span>
      )}
    </div>
  </div>
);

/**
 * Master node details (expandable category nodes)
 */
const MasterNodeDetails = ({ data, t }) => (
  <div className="space-y-4">
    {/* Category info */}
    <div className="flex items-center gap-2">
      <span
        className="px-3 py-1 rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: data.color }}
      >
        {data.childCount} {t('items', 'items')}
      </span>
      {data.nodeCategory && (
        <span className="text-xs text-gray-500 capitalize">
          {data.nodeCategory}
        </span>
      )}
    </div>

    {/* Solution domain stats */}
    {data.nodeCategory === 'solution' && (
      <div className="grid grid-cols-3 gap-2">
        {data.interventionCount > 0 && (
          <div className="p-2 rounded-lg bg-rose-50 text-center">
            <div className="text-lg font-bold text-rose-600">{data.interventionCount}</div>
            <div className="text-[10px] text-rose-700">{t('interventions', 'Interventions')}</div>
          </div>
        )}
        {data.scriptureCount > 0 && (
          <div className="p-2 rounded-lg bg-indigo-50 text-center">
            <div className="text-lg font-bold text-indigo-600">{data.scriptureCount}</div>
            <div className="text-[10px] text-indigo-700">{t('scriptures', 'Scriptures')}</div>
          </div>
        )}
        {data.egwCount > 0 && (
          <div className="p-2 rounded-lg bg-purple-50 text-center">
            <div className="text-lg font-bold text-purple-600">{data.egwCount}</div>
            <div className="text-[10px] text-purple-700">{t('egwRefs', 'EGW')}</div>
          </div>
        )}
      </div>
    )}

    {/* Section items list */}
    {data.items && data.items.length > 0 && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {t('allItems', 'All Items')}
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <h5 className="font-medium text-sm text-gray-800">
                {item.title || item.name}
              </h5>
              {item.body && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {item.body.replace(/<[^>]*>/g, '')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Hint about expansion */}
    <div className="pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-500 italic">
        {t('expandHint', 'Click this node on the mindmap to expand/collapse its children.')}
      </p>
    </div>
  </div>
);

/**
 * Leaf node details (based on nodeCategory)
 */
const LeafNodeDetails = ({ data, t }) => {
  // Route to appropriate detail view based on nodeCategory
  switch (data.nodeCategory) {
    case 'sectionItem':
      return <SectionItemDetails data={data} t={t} />;
    case 'recipe':
      return <RecipeDetails data={data} t={t} />;
    case 'scripture':
      return <ScriptureDetails data={data} t={t} />;
    case 'egwReference':
      return <EgwReferenceDetails data={data} t={t} />;
    default:
      return <GenericDetails data={data} t={t} />;
  }
};

/**
 * Generic fallback details
 */
const GenericDetails = ({ data, t }) => (
  <div className="space-y-4">
    {data.description && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('description', 'Description')}
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {data.description}
        </p>
      </div>
    )}
    {data.body && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {t('content', 'Content')}
        </h4>
        <div
          className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      </div>
    )}
  </div>
);

export default NodeDetailsPanel;
