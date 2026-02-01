import { useEffect, useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { sanitizeHtml } from '../../lib/sanitize';
import Modal from '../../components/ui/Modal';

const SECTION_ORDER = [
  'risk_factors',
  'physiology',
  'complications',
  'solutions',
  'additional_factors',
  'scripture',
];

const SECTION_TITLES = {
  risk_factors: 'RISK FACTORS/CAUSES',
  physiology: 'RELEVANT PHYSIOLOGY',
  complications: 'COMPLICATIONS',
  solutions: 'LIFESTYLE SOLUTIONS',
  additional_factors: 'ADDITIONAL FACTORS',
  scripture: 'BIBLE & SPIRIT OF PROPHECY',
};

const EVIDENCE_STRENGTH_LABELS = {
  high: 'High Evidence',
  moderate: 'Moderate Evidence',
  emerging: 'Emerging Evidence',
  insufficient: 'Insufficient Evidence',
};

const RECOMMENDATION_LABELS = {
  core: 'Core Recommendation',
  adjunct: 'Adjunct Recommendation',
  optional: 'Optional',
};

const INFOGRAPHIC_LABELS = {
  overview: 'Condition Overview',
  risk_factors: 'Risk Factors',
  lifestyle_solutions: 'Lifestyle Solutions',
};

const ConditionPreviewModal = ({ isOpen, onClose, conditionId }) => {
  const [condition, setCondition] = useState(null);
  const [sections, setSections] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [scriptures, setScriptures] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [infographics, setInfographics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && conditionId) {
      fetchAllData();
    }
  }, [isOpen, conditionId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [conditionRes, sectionsRes, interventionsRes, scripturesRes, recipesRes, infographicsRes] =
        await Promise.all([
          api.get(`${apiEndpoints.conditions}/${conditionId}`),
          api.get(apiEndpoints.conditionSections(conditionId)),
          api.get(apiEndpoints.conditionInterventions(conditionId)),
          api.get(apiEndpoints.conditionScriptures(conditionId)),
          api.get(apiEndpoints.conditionRecipes(conditionId)),
          api.get(apiEndpoints.conditionInfographics(conditionId)).catch(() => ({ data: { data: [] } })),
        ]);

      setCondition(conditionRes.data.data);
      setSections(sectionsRes.data.data || []);
      setInterventions(interventionsRes.data.data || []);
      setScriptures(scripturesRes.data.data || []);
      setRecipes(recipesRes.data.data || []);
      setInfographics(infographicsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get infographic by type
  const getInfographicByType = (type) => {
    return infographics.find((img) =>
      img.alt_text?.toLowerCase().includes(type.replace('_', ' ')) ||
      img.caption?.toLowerCase().includes(type.replace('_', ' '))
    );
  };

  // Infographic component
  const InfographicImage = ({ type }) => {
    const infographic = getInfographicByType(type);
    if (!infographic) return null;

    return (
      <div className="my-4 text-center">
        <img
          src={infographic.url}
          alt={infographic.alt_text || `${INFOGRAPHIC_LABELS[type]} infographic`}
          className="max-w-full h-auto mx-auto rounded-lg shadow-md"
          style={{ maxHeight: '400px' }}
        />
        {infographic.caption && (
          <p className="text-xs text-gray-500 mt-2 italic">{infographic.caption}</p>
        )}
      </div>
    );
  };

  // Group interventions by care domain
  const interventionsByDomain = interventions.reduce((acc, intervention) => {
    const domainName = intervention.care_domain?.name || 'Other';
    if (!acc[domainName]) {
      acc[domainName] = [];
    }
    acc[domainName].push(intervention);
    return acc;
  }, {});

  // Sort sections by the predefined order
  const sortedSections = [...sections].sort((a, b) => {
    const orderA = SECTION_ORDER.indexOf(a.section_type);
    const orderB = SECTION_ORDER.indexOf(b.section_type);
    if (orderA === orderB) return (a.order_index || 0) - (b.order_index || 0);
    return orderA - orderB;
  });

  const handlePrint = () => {
    // Open in new window for printing
    window.open(`/conditions/${conditionId}/preview`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Preview" size="full">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : !condition ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Condition not found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex justify-end gap-2 sticky -top-4 bg-white py-2 -mt-2 border-b border-gray-100">
            <button
              onClick={handlePrint}
              className="btn-outline flex items-center gap-2 text-sm"
              title="Open in new tab for printing"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <a
              href={`${getApiBaseUrl()}/api/v1/export/conditions/${conditionId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 text-sm"
              title="Download PDF document"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>

          {/* Document Content */}
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <div className="text-center mb-6">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                Lifestyle Medicine Treatment Guide
              </p>
              <h1 className="text-2xl font-bold text-gray-900">{condition.name}</h1>
              {condition.category && (
                <p className="text-gray-600 mt-1 text-sm">{condition.category}</p>
              )}
            </div>

            {/* Summary */}
            {condition.summary && (
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{condition.summary}</p>
                <InfographicImage type="overview" />
                <hr className="mt-6 border-gray-200" />
              </div>
            )}

            {/* Sections */}
            {sortedSections.map((section, index) => {
              const isLastOfType = !sortedSections.slice(index + 1).some(
                (s) => s.section_type === section.section_type
              );

              return (
                <div key={section.id} className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {section.title || SECTION_TITLES[section.section_type] || section.section_type}
                  </h2>
                  {section.body && (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body) }}
                    />
                  )}
                  {isLastOfType && section.section_type === 'risk_factors' && (
                    <InfographicImage type="risk_factors" />
                  )}
                  {isLastOfType && section.section_type === 'solutions' && (
                    <InfographicImage type="lifestyle_solutions" />
                  )}
                  <hr className="mt-6 border-gray-200" />
                </div>
              );
            })}

            {/* Interventions by Care Domain */}
            {Object.keys(interventionsByDomain).length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  INTERVENTIONS BY CARE DOMAIN
                </h2>

                {Object.entries(interventionsByDomain).map(([domainName, domainInterventions]) => (
                  <div key={domainName} className="mb-4">
                    <h3 className="text-base font-semibold text-primary-700 mb-2">
                      {domainName}
                    </h3>

                    {domainInterventions.map((intervention) => (
                      <div
                        key={intervention.id}
                        className="mb-3 pl-3 border-l-2 border-gray-200"
                      >
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {intervention.name}
                          </span>
                          {intervention.pivot?.strength_of_evidence && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {EVIDENCE_STRENGTH_LABELS[intervention.pivot.strength_of_evidence]}
                            </span>
                          )}
                          {intervention.pivot?.recommendation_level && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              {RECOMMENDATION_LABELS[intervention.pivot.recommendation_level]}
                            </span>
                          )}
                        </div>

                        {intervention.description && (
                          <p className="text-gray-600 text-xs mb-1">
                            {intervention.description}
                          </p>
                        )}

                        {intervention.mechanism && (
                          <p className="text-gray-500 text-xs italic">
                            Mechanism: {intervention.mechanism}
                          </p>
                        )}

                        {intervention.pivot?.clinical_notes && (
                          <p className="text-gray-600 text-xs mt-1 bg-yellow-50 p-2 rounded">
                            <strong>Clinical Note:</strong> {intervention.pivot.clinical_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {!sortedSections.some((s) => s.section_type === 'solutions') && (
                  <InfographicImage type="lifestyle_solutions" />
                )}
                <hr className="mt-6 border-gray-200" />
              </div>
            )}

            {/* Scriptures */}
            {scriptures.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  SCRIPTURE REFERENCES
                </h2>
                <div className="space-y-3">
                  {scriptures.map((scripture) => (
                    <blockquote
                      key={scripture.id}
                      className="border-l-4 border-indigo-300 pl-3 py-2 bg-indigo-50"
                    >
                      <p className="font-semibold text-indigo-900 mb-1 text-sm">
                        {scripture.reference}
                        {scripture.theme && (
                          <span className="text-xs font-normal text-indigo-600 ml-2">
                            ({scripture.theme})
                          </span>
                        )}
                      </p>
                      <p className="text-gray-700 italic text-sm">"{scripture.text}"</p>
                    </blockquote>
                  ))}
                </div>
                <hr className="mt-6 border-gray-200" />
              </div>
            )}

            {/* Recipes */}
            {recipes.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  RECOMMENDED RECIPES
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                        {recipe.title}
                      </h4>
                      {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {recipe.dietary_tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {recipe.description && (
                        <p className="text-xs text-gray-600">{recipe.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Generated from the Lifestyle Medicine Knowledge Platform</p>
              <p className="mt-1">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ConditionPreviewModal;
