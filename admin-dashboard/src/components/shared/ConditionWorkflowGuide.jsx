import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  Stethoscope,
  BookOpen,
  ChefHat,
  Plus,
  ChevronRight,
  Lightbulb,
  Activity,
  Utensils,
  Droplets,
  Sun,
  Shield,
  Wind,
  Moon,
  Heart,
  Brain,
  Pill,
  Syringe,
} from 'lucide-react';

// Map care domain icons
const DOMAIN_ICONS = {
  'Nutrition': Utensils,
  'Exercise': Activity,
  'Water Therapy': Droplets,
  'Sunlight': Sun,
  'Temperance': Shield,
  'Air': Wind,
  'Rest': Moon,
  'Trust in God': Heart,
  'Mental Health': Brain,
  'Supplements': Pill,
  'Medications': Syringe,
};

// Required sections for a complete treatment guide
const REQUIRED_SECTIONS = [
  { type: 'risk_factors', label: 'Risk Factors / Causes', description: 'Identify what causes or contributes to this condition' },
  { type: 'physiology', label: 'Physiology', description: 'Explain the underlying mechanisms and pathophysiology' },
  { type: 'complications', label: 'Complications', description: 'List potential complications if untreated' },
];

// Optional but recommended sections
const OPTIONAL_SECTIONS = [
  { type: 'additional_factors', label: 'Additional Factors', description: 'Other relevant considerations' },
  { type: 'research_ideas', label: 'Research Ideas', description: 'Potential areas for future research' },
];

// Core NEWSTART+ care domains for interventions
const CORE_DOMAINS = [
  'Nutrition',
  'Exercise',
  'Water Therapy',
  'Mental Health',
  'Rest',
  'Trust in God',
];

const ConditionWorkflowGuide = ({
  conditionId,
  sections = [],
  interventions = [],
  scriptures = [],
  recipes = [],
  careDomains = [],
  isExpanded = true,
  onToggle,
}) => {
  // Check which sections exist
  const existingSectionTypes = new Set(sections.map(s => s.section_type));

  // Check which care domains have interventions
  const domainsWithInterventions = new Set(
    interventions.map(i => i.care_domain?.name).filter(Boolean)
  );

  // Calculate completion percentages
  const requiredSectionsComplete = REQUIRED_SECTIONS.filter(s => existingSectionTypes.has(s.type)).length;
  const requiredSectionsTotal = REQUIRED_SECTIONS.length;

  const coreDomainsWithInterventions = CORE_DOMAINS.filter(d => domainsWithInterventions.has(d)).length;
  const coreDomainsTotal = CORE_DOMAINS.length;

  const hasScriptures = scriptures.length > 0;
  const hasRecipes = recipes.length > 0;

  // Overall completion score
  const completionItems = [
    requiredSectionsComplete === requiredSectionsTotal,
    coreDomainsWithInterventions >= 3, // At least 3 core domains
    hasScriptures,
    interventions.length > 0,
  ];
  const completionScore = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  const getCompletionColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="card border-l-4 border-l-primary-500 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${getCompletionColor(completionScore)}`}>
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Treatment Guide Workflow</h3>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Follow this guide to create a complete treatment protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <div className={`text-lg font-bold ${completionScore >= 80 ? 'text-green-600' : completionScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {completionScore}%
            </div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors touch-manipulation"
            >
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(completionScore)}`}
          style={{ width: `${completionScore}%` }}
        />
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Step 1: Required Sections */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">1</span>
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Document the Condition</h4>
              <span className="text-xs text-gray-500">({requiredSectionsComplete}/{requiredSectionsTotal})</span>
            </div>
            <div className="ml-4 sm:ml-8 space-y-2">
              {REQUIRED_SECTIONS.map((section) => {
                const isComplete = existingSectionTypes.has(section.type);
                return (
                  <div key={section.type} className="flex items-start sm:items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div className="min-w-0">
                        <span className={`font-medium text-sm ${isComplete ? 'text-gray-700' : 'text-gray-900'}`}>
                          {section.label}
                        </span>
                        <p className="text-xs text-gray-500 hidden sm:block">{section.description}</p>
                      </div>
                    </div>
                    {!isComplete && (
                      <Link
                        to={`/conditions/${conditionId}/sections/new?type=${section.type}`}
                        className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0 touch-manipulation"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Interventions by Care Domain */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">2</span>
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Add Interventions</h4>
              <span className="text-xs text-gray-500">({coreDomainsWithInterventions}/{coreDomainsTotal} core)</span>
            </div>
            <div className="ml-4 sm:ml-8">
              <div className="grid grid-cols-2 gap-2">
                {careDomains.map((domain) => {
                  const hasIntervention = domainsWithInterventions.has(domain.name);
                  const isCoreDomain = CORE_DOMAINS.includes(domain.name);
                  const DomainIcon = DOMAIN_ICONS[domain.name] || Stethoscope;
                  const interventionCount = interventions.filter(i => i.care_domain?.name === domain.name).length;

                  return (
                    <div
                      key={domain.id}
                      className={`p-2 rounded-lg border ${
                        hasIntervention
                          ? 'border-green-200 bg-green-50'
                          : isCoreDomain
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <DomainIcon className={`w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 ${
                          hasIntervention ? 'text-green-600' : isCoreDomain ? 'text-yellow-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-xs font-medium truncate ${
                          hasIntervention ? 'text-green-700' : isCoreDomain ? 'text-yellow-700' : 'text-gray-600'
                        }`}>
                          {domain.name}
                        </span>
                        {hasIntervention && (
                          <span className="ml-auto text-xs bg-green-200 text-green-700 px-1.5 rounded flex-shrink-0">
                            {interventionCount}
                          </span>
                        )}
                        {!hasIntervention && isCoreDomain && (
                          <AlertTriangle className="w-3 h-3 text-yellow-500 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                to={`/conditions/${conditionId}/interventions/attach`}
                className="mt-3 inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                Attach Interventions
              </Link>
            </div>
          </div>

          {/* Step 3: Evidence & References */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">3</span>
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Add Evidence & References</h4>
            </div>
            <div className="ml-4 sm:ml-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700">
                Evidence entries are added to interventions individually.
              </p>
              <Link
                to="/evidence"
                className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium touch-manipulation"
              >
                Manage Evidence
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Step 4: Spiritual Care */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">4</span>
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Spiritual Guidance</h4>
              <span className="text-xs text-gray-500">
                {hasScriptures ? (
                  <span className="text-green-600">({scriptures.length})</span>
                ) : (
                  <span className="text-yellow-600">(recommended)</span>
                )}
              </span>
            </div>
            <div className="ml-4 sm:ml-8 flex items-start sm:items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                {hasScriptures ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div className="min-w-0">
                  <span className="font-medium text-gray-700 text-sm">Bible & Spirit of Prophecy</span>
                  <p className="text-xs text-gray-500 hidden sm:block">Scripture passages and Ellen White quotes</p>
                </div>
              </div>
              <Link
                to={`/conditions/${conditionId}/scriptures/attach`}
                className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0 touch-manipulation"
              >
                {hasScriptures ? 'Add' : <><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add</span></>}
              </Link>
            </div>
          </div>

          {/* Step 5: Recipes (Optional) */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex-shrink-0">5</span>
              <h4 className="font-medium text-gray-700 text-sm sm:text-base">Recipes (Optional)</h4>
              {hasRecipes && (
                <span className="text-xs text-green-600">({recipes.length})</span>
              )}
            </div>
            <div className="ml-4 sm:ml-8 flex items-start sm:items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                {hasRecipes ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div className="min-w-0">
                  <span className="font-medium text-gray-700 text-sm">Therapeutic Recipes</span>
                  <p className="text-xs text-gray-500 hidden sm:block">Culinary medicine recipes</p>
                </div>
              </div>
              <Link
                to={`/conditions/${conditionId}/recipes/attach`}
                className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0 touch-manipulation"
              >
                {hasRecipes ? 'Add' : <><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add</span></>}
              </Link>
            </div>
          </div>

          {/* Optional Sections */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-3">Optional Sections</h4>
            <div className="space-y-2">
              {OPTIONAL_SECTIONS.map((section) => {
                const isComplete = existingSectionTypes.has(section.type);
                return (
                  <div key={section.type} className="flex items-start sm:items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-gray-600 text-sm">{section.label}</span>
                        <p className="text-xs text-gray-500 hidden sm:block">{section.description}</p>
                      </div>
                    </div>
                    {!isComplete && (
                      <Link
                        to={`/conditions/${conditionId}/sections/new?type=${section.type}`}
                        className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0 touch-manipulation"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionWorkflowGuide;
