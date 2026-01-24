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

const StructuredPreview = ({ conditionName, structured, onImport, onBack, loading }) => {
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
      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 text-${color}-600`} />
        <span className="font-medium text-gray-900">{title}</span>
        {count !== undefined && (
          <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
            {count}
          </span>
        )}
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Phase 3: Structured Content Preview
        </h2>
        <button
          onClick={handleDownloadJson}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download JSON
        </button>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          Review the structured data below. Click "Import to Database" to save all entities.
        </div>
      </div>

      {/* Structured Content Sections */}
      <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto pr-2">
        {/* Condition */}
        {structured?.condition && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader icon={FileText} title="Condition" sectionKey="condition" color="primary" />
            {expandedSections.condition && (
              <div className="p-4 bg-white">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Name</dt>
                    <dd className="text-gray-900">{structured.condition.name}</dd>
                  </div>
                  {structured.condition.category && (
                    <div>
                      <dt className="font-medium text-gray-500">Category</dt>
                      <dd className="text-gray-900">{structured.condition.category}</dd>
                    </div>
                  )}
                  {structured.condition.summary && (
                    <div>
                      <dt className="font-medium text-gray-500">Summary</dt>
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
              title="Condition Sections"
              count={structured.condition_sections.length}
              sectionKey="sections"
              color="blue"
            />
            {expandedSections.sections && (
              <div className="p-4 bg-white space-y-3">
                {structured.condition_sections.map((section, idx) => (
                  <div key={idx} className="border-l-4 border-blue-300 pl-3">
                    <p className="font-medium text-gray-900">
                      {section.title || section.section_type}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      Type: {section.section_type} | Order: {section.order_index}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {section.body?.replace(/<[^>]+>/g, '').substring(0, 150)}...
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
              title="Interventions"
              count={structured.interventions.length}
              sectionKey="interventions"
              color="green"
            />
            {expandedSections.interventions && (
              <div className="p-4 bg-white space-y-3">
                {structured.interventions.map((intervention, idx) => (
                  <div key={idx} className="border-l-4 border-green-300 pl-3">
                    <p className="font-medium text-gray-900">{intervention.name}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      Domain: {intervention.care_domain}
                      {intervention.pivot && (
                        <>
                          {' '}| Evidence: {intervention.pivot.strength_of_evidence}
                          {' '}| Level: {intervention.pivot.recommendation_level}
                        </>
                      )}
                    </p>
                    {intervention.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {intervention.description.replace(/<[^>]+>/g, '').substring(0, 150)}...
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
              title="Evidence Entries"
              count={structured.evidence_entries.length}
              sectionKey="evidence"
              color="purple"
            />
            {expandedSections.evidence && (
              <div className="p-4 bg-white space-y-3">
                {structured.evidence_entries.map((entry, idx) => (
                  <div key={idx} className="border-l-4 border-purple-300 pl-3">
                    <p className="font-medium text-gray-900">{entry.intervention_name}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      Study: {entry.study_type}
                      {entry.quality_rating && ` | Quality: ${entry.quality_rating}`}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">{entry.summary}</p>
                    {entry.references?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {entry.references.length} reference(s) attached
                      </p>
                    )}
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
              title="Scriptures"
              count={structured.scriptures.length}
              sectionKey="scriptures"
              color="amber"
            />
            {expandedSections.scriptures && (
              <div className="p-4 bg-white space-y-3">
                {structured.scriptures.map((scripture, idx) => (
                  <div key={idx} className="border-l-4 border-amber-300 pl-3">
                    <p className="font-medium text-gray-900">{scripture.reference}</p>
                    {scripture.theme && (
                      <p className="text-xs text-gray-500 mb-1">Theme: {scripture.theme}</p>
                    )}
                    <p className="text-sm text-gray-600 italic line-clamp-2">
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
              title="EGW References"
              count={structured.egw_references.length}
              sectionKey="egwReferences"
              color="indigo"
            />
            {expandedSections.egwReferences && (
              <div className="p-4 bg-white space-y-3">
                {structured.egw_references.map((ref, idx) => (
                  <div key={idx} className="border-l-4 border-indigo-300 pl-3">
                    <p className="font-medium text-gray-900">
                      {ref.book}
                      {ref.page_start && `, p. ${ref.page_start}`}
                      {ref.page_end && `-${ref.page_end}`}
                    </p>
                    {ref.topic && <p className="text-xs text-gray-500 mb-1">Topic: {ref.topic}</p>}
                    <p className="text-sm text-gray-600 italic line-clamp-2">
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
              title="Recipes"
              count={structured.recipes.length}
              sectionKey="recipes"
              color="orange"
            />
            {expandedSections.recipes && (
              <div className="p-4 bg-white space-y-3">
                {structured.recipes.map((recipe, idx) => (
                  <div key={idx} className="border-l-4 border-orange-300 pl-3">
                    <p className="font-medium text-gray-900">{recipe.title}</p>
                    {recipe.dietary_tags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {recipe.dietary_tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {recipe.description}
                      </p>
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
              title="Content Tags"
              count={structured.content_tags.length}
              sectionKey="tags"
              color="gray"
            />
            {expandedSections.tags && (
              <div className="p-4 bg-white">
                <div className="flex flex-wrap gap-2">
                  {structured.content_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
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
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Draft
        </button>

        <button
          onClick={onImport}
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import to Database
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StructuredPreview;
