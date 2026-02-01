import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  FileText,
  Pill,
  BookOpen,
  Quote,
  UtensilsCrossed,
  Tag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StructuredPreview = ({ conditionName, structured, onImport, onBack, loading }) => {
  const { t } = useTranslation(['aiGenerator']);
  const [expandedSections, setExpandedSections] = useState({
    condition: true,
    sections: true,
    interventions: false,
    evidence: false,
    scriptures: false,
    egwReferences: false,
    recipes: false,
    tags: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(structured, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conditionName.toLowerCase().replace(/\s+/g, '-')}-structured.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const SectionHeader = ({ icon: Icon, title, count, sectionKey, color = 'gray' }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} />
        <span className="font-medium text-gray-900 text-sm sm:text-base">{title}</span>
        {count !== undefined && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
            {count}
          </span>
        )}
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {t('aiGenerator:phases.preview.title')}
        </h2>
        <button
          onClick={handleDownloadJson}
          className="inline-flex items-center justify-center sm:justify-start px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-1.5" />
          {t('aiGenerator:preview.downloadJson')}
        </button>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-700">
          {t('aiGenerator:preview.reviewInstructions')}
        </div>
      </div>

      {/* Structured Content Sections */}
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-[350px] sm:max-h-[500px] overflow-y-auto">
        {/* Condition */}
        {structured?.condition && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader icon={FileText} title={t('aiGenerator:preview.condition')} sectionKey="condition" color="primary" />
            {expandedSections.condition && (
              <div className="p-3 sm:p-4 bg-white">
                <dl className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">{t('aiGenerator:preview.name')}</dt>
                    <dd className="text-gray-900">{structured.condition.name}</dd>
                  </div>
                  {structured.condition.category && (
                    <div>
                      <dt className="font-medium text-gray-500">{t('aiGenerator:preview.category')}</dt>
                      <dd className="text-gray-900">{structured.condition.category}</dd>
                    </div>
                  )}
                  {structured.condition.summary && (
                    <div>
                      <dt className="font-medium text-gray-500">{t('aiGenerator:preview.summary')}</dt>
                      <dd className="text-gray-700">{structured.condition.summary}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Condition Sections */}
        {structured?.condition_sections?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={FileText}
              title={t('aiGenerator:preview.sections')}
              count={structured.condition_sections.length}
              sectionKey="sections"
              color="blue"
            />
            {expandedSections.sections && (
              <div className="p-3 sm:p-4 bg-white space-y-2 sm:space-y-3">
                {structured.condition_sections.map((section, idx) => (
                  <div key={idx} className="border-l-4 border-blue-300 pl-2 sm:pl-3">
                    <p className="font-medium text-gray-900 text-sm">
                      {section.title || section.section_type}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      {t('aiGenerator:preview.type')} {section.section_type}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {section.body?.replace(/<[^>]+>/g, '').substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interventions */}
        {structured?.interventions?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={Pill}
              title={t('aiGenerator:preview.interventions')}
              count={structured.interventions.length}
              sectionKey="interventions"
              color="green"
            />
            {expandedSections.interventions && (
              <div className="p-3 sm:p-4 bg-white space-y-2 sm:space-y-3">
                {structured.interventions.map((intervention, idx) => (
                  <div key={idx} className="border-l-4 border-green-300 pl-2 sm:pl-3">
                    <p className="font-medium text-gray-900 text-sm">{intervention.name}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      {intervention.care_domain}
                      {intervention.pivot && (
                        <span className="hidden sm:inline">
                          {' '}| {intervention.pivot.strength_of_evidence}
                        </span>
                      )}
                    </p>
                    {intervention.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {intervention.description.replace(/<[^>]+>/g, '').substring(0, 100)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evidence Entries */}
        {structured?.evidence_entries?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={BookOpen}
              title={t('aiGenerator:preview.evidence')}
              count={structured.evidence_entries.length}
              sectionKey="evidence"
              color="purple"
            />
            {expandedSections.evidence && (
              <div className="p-3 sm:p-4 bg-white space-y-2 sm:space-y-3">
                {structured.evidence_entries.map((entry, idx) => (
                  <div key={idx} className="border-l-4 border-purple-300 pl-2 sm:pl-3">
                    <p className="font-medium text-gray-900 text-sm">{entry.intervention_name}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      {entry.study_type}
                      {entry.quality_rating && ` | Grade ${entry.quality_rating}`}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{entry.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scriptures */}
        {structured?.scriptures?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={BookOpen}
              title={t('aiGenerator:preview.scriptures')}
              count={structured.scriptures.length}
              sectionKey="scriptures"
              color="amber"
            />
            {expandedSections.scriptures && (
              <div className="p-3 sm:p-4 bg-white space-y-2 sm:space-y-3">
                {structured.scriptures.map((scripture, idx) => (
                  <div key={idx} className="border-l-4 border-amber-300 pl-2 sm:pl-3">
                    <p className="font-medium text-gray-900 text-sm">{scripture.reference}</p>
                    {scripture.theme && (
                      <p className="text-xs text-gray-500 mb-1">{t('aiGenerator:preview.theme')} {scripture.theme}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 italic line-clamp-2">
                      "{scripture.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EGW References */}
        {structured?.egw_references?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={Quote}
              title={t('aiGenerator:preview.egwReferences')}
              count={structured.egw_references.length}
              sectionKey="egwReferences"
              color="indigo"
            />
            {expandedSections.egwReferences && (
              <div className="p-3 sm:p-4 bg-white space-y-2 sm:space-y-3">
                {structured.egw_references.map((ref, idx) => (
                  <div key={idx} className="border-l-4 border-indigo-300 pl-2 sm:pl-3">
                    <p className="font-medium text-gray-900 text-sm">
                      {ref.book}
                      {ref.page_start && `, p. ${ref.page_start}`}
                    </p>
                    {ref.topic && <p className="text-xs text-gray-500 mb-1">{ref.topic}</p>}
                    <p className="text-xs sm:text-sm text-gray-600 italic line-clamp-2">
                      "{ref.quote}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipes */}
        {structured?.recipes?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={UtensilsCrossed}
              title={t('aiGenerator:preview.recipes')}
              count={structured.recipes.length}
              sectionKey="recipes"
              color="orange"
            />
            {expandedSections.recipes && (
              <div className="p-3 sm:p-4 bg-white space-y-2 sm:space-y-3">
                {structured.recipes.map((recipe, idx) => (
                  <div key={idx} className="border-l-4 border-orange-300 pl-2 sm:pl-3">
                    <p className="font-medium text-gray-900 text-sm">{recipe.title}</p>
                    {recipe.dietary_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recipe.dietary_tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Tags */}
        {structured?.content_tags?.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              icon={Tag}
              title={t('aiGenerator:preview.tags')}
              count={structured.content_tags.length}
              sectionKey="tags"
              color="gray"
            />
            {expandedSections.tags && (
              <div className="p-3 sm:p-4 bg-white">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {structured.content_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
        <button
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center sm:justify-start px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('aiGenerator:actions.back')}
        </button>

        <button
          onClick={onImport}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 text-sm order-1 sm:order-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {t('aiGenerator:actions.importing')}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {t('aiGenerator:actions.importToDatabase')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StructuredPreview;
