import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Edit, FileText } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import Breadcrumbs from '../components/Breadcrumbs';

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

const ConditionPreview = () => {
  const { id } = useParams();
  const [condition, setCondition] = useState(null);
  const [sections, setSections] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [scriptures, setScriptures] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [conditionRes, sectionsRes, interventionsRes, scripturesRes, recipesRes] =
        await Promise.all([
          api.get(`${apiEndpoints.conditions}/${id}`),
          api.get(apiEndpoints.conditionSections(id)),
          api.get(apiEndpoints.conditionInterventions(id)),
          api.get(apiEndpoints.conditionScriptures(id)),
          api.get(apiEndpoints.conditionRecipes(id)),
        ]);

      setCondition(conditionRes.data.data);
      setSections(sectionsRes.data.data || []);
      setInterventions(interventionsRes.data.data || []);
      setScriptures(scripturesRes.data.data || []);
      setRecipes(recipesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!condition) {
    return (
      <div className="card text-center py-8 sm:py-12">
        <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Condition not found
        </h3>
        <Link to="/conditions" className="text-primary-600 hover:text-primary-700">
          Back to conditions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs - Hidden when printing */}
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: 'Conditions', href: '/conditions' },
            { label: condition.name, href: `/conditions/${id}` },
            { label: 'Preview' },
          ]}
        />
      </div>

      {/* Header - Hidden when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Document Preview</h1>
          <p className="text-gray-600 text-sm sm:text-base">Treatment guide format</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/conditions/${id}`}
            className="btn-outline flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Content</span>
            <span className="sm:hidden">Edit</span>
          </Link>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="card max-w-4xl mx-auto treatment-guide print:shadow-none print:p-0">
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide mb-2">
            Lifestyle Medicine Treatment Guide
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{condition.name}</h1>
          {condition.category && (
            <p className="text-gray-600 mt-2 text-sm sm:text-base">{condition.category}</p>
          )}
        </div>

        {/* Summary */}
        {condition.summary && (
          <div className="section">
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              {condition.summary}
            </p>
            <div className="divider" />
          </div>
        )}

        {/* Sections */}
        {sortedSections.map((section) => (
          <div key={section.id} className="section">
            <h2>
              {section.title || SECTION_TITLES[section.section_type] || section.section_type}
            </h2>
            {section.body && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: section.body }}
              />
            )}
            <div className="divider" />
          </div>
        ))}

        {/* Interventions by Care Domain */}
        {Object.keys(interventionsByDomain).length > 0 && (
          <div className="section">
            <h2>INTERVENTIONS BY CARE DOMAIN</h2>

            {Object.entries(interventionsByDomain).map(([domainName, domainInterventions]) => (
              <div key={domainName} className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-primary-700 mb-2 sm:mb-3">
                  {domainName}
                </h3>

                {domainInterventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="mb-3 sm:mb-4 pl-3 sm:pl-4 border-l-2 border-gray-200"
                  >
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
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
                      <p className="text-gray-600 text-xs sm:text-sm mb-1">
                        {intervention.description}
                      </p>
                    )}

                    {intervention.mechanism && (
                      <p className="text-gray-500 text-xs sm:text-sm italic">
                        Mechanism: {intervention.mechanism}
                      </p>
                    )}

                    {intervention.pivot?.clinical_notes && (
                      <p className="text-gray-600 text-xs sm:text-sm mt-1 bg-yellow-50 p-2 rounded">
                        <strong>Clinical Note:</strong> {intervention.pivot.clinical_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div className="divider" />
          </div>
        )}

        {/* Scriptures */}
        {scriptures.length > 0 && (
          <div className="section">
            <h2>SCRIPTURE REFERENCES</h2>
            <div className="space-y-3 sm:space-y-4">
              {scriptures.map((scripture) => (
                <blockquote key={scripture.id} className="border-l-4 border-indigo-300 pl-3 sm:pl-4 py-2 bg-indigo-50">
                  <p className="font-semibold text-indigo-900 mb-1 text-sm sm:text-base">
                    {scripture.reference}
                    {scripture.theme && (
                      <span className="text-xs sm:text-sm font-normal text-indigo-600 ml-2">
                        ({scripture.theme})
                      </span>
                    )}
                  </p>
                  <p className="text-gray-700 italic text-sm sm:text-base">"{scripture.text}"</p>
                </blockquote>
              ))}
            </div>
            <div className="divider" />
          </div>
        )}

        {/* Recipes */}
        {recipes.length > 0 && (
          <div className="section">
            <h2>RECOMMENDED RECIPES</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
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
                    <p className="text-xs sm:text-sm text-gray-600">{recipe.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-500">
          <p>
            Generated from the Lifestyle Medicine Knowledge Platform
          </p>
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
  );
};

export default ConditionPreview;
