import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Stethoscope,
  Plus,
  ChevronDown,
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
  FileText,
  Sparkles,
  BookOpen,
  ChefHat,
  ArrowRight,
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
  { type: 'risk_factors', label: 'Risk Factors', icon: AlertTriangle },
  { type: 'physiology', label: 'Physiology', icon: Activity },
  { type: 'complications', label: 'Complications', icon: FileText },
];

// Optional but recommended sections
const OPTIONAL_SECTIONS = [
  { type: 'additional_factors', label: 'Additional Factors' },
  { type: 'research_ideas', label: 'Research Ideas' },
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
  isExpanded = false,
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

  // Step completion status
  const steps = [
    { complete: requiredSectionsComplete === requiredSectionsTotal, count: requiredSectionsComplete, total: requiredSectionsTotal },
    { complete: coreDomainsWithInterventions >= 3, count: coreDomainsWithInterventions, total: coreDomainsTotal },
    { complete: hasScriptures, count: scriptures.length },
    { complete: hasRecipes, count: recipes.length, optional: true },
  ];

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 50) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-pink-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  return (
    <div className={`rounded-xl border ${getScoreBg(completionScore)} overflow-hidden transition-all duration-300`}>
      {/* Compact Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-white/50 transition-colors"
      >
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-200"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${completionScore} 100`}
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={completionScore >= 80 ? 'text-emerald-500' : completionScore >= 50 ? 'text-amber-500' : 'text-rose-500'} stopColor="currentColor" />
                <stop offset="100%" className={completionScore >= 80 ? 'text-teal-500' : completionScore >= 50 ? 'text-orange-500' : 'text-pink-500'} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${completionScore >= 80 ? 'text-emerald-600' : completionScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {completionScore}%
            </span>
          </div>
        </div>

        {/* Title & Quick Stats */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`w-4 h-4 ${completionScore >= 80 ? 'text-emerald-500' : completionScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`} />
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Treatment Workflow</h3>
          </div>

          {/* Mini Progress Indicators */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {requiredSectionsComplete}/{requiredSectionsTotal}
            </span>
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              {interventions.length}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {scriptures.length}
            </span>
            <span className="flex items-center gap-1">
              <ChefHat className="w-3.5 h-3.5" />
              {recipes.length}
            </span>
          </div>
        </div>

        {/* Expand Button */}
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-4 bg-white/60">
          {/* Step 1: Documentation */}
          <WorkflowStep
            number={1}
            title="Documentation"
            subtitle="Required sections"
            isComplete={requiredSectionsComplete === requiredSectionsTotal}
            progress={`${requiredSectionsComplete}/${requiredSectionsTotal}`}
          >
            <div className="flex flex-wrap gap-2">
              {REQUIRED_SECTIONS.map((section) => {
                const isComplete = existingSectionTypes.has(section.type);
                const Icon = section.icon;
                return (
                  <div
                    key={section.type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isComplete
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">{section.label}</span>
                    {!isComplete && (
                      <Link
                        to={`/conditions/${conditionId}/sections/new?type=${section.type}`}
                        className="ml-1 p-1 rounded hover:bg-gray-100 text-primary-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </WorkflowStep>

          {/* Step 2: Interventions */}
          <WorkflowStep
            number={2}
            title="Interventions"
            subtitle="Care domains"
            isComplete={coreDomainsWithInterventions >= 3}
            progress={`${coreDomainsWithInterventions}/${coreDomainsTotal} core`}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {careDomains.map((domain) => {
                const hasIntervention = domainsWithInterventions.has(domain.name);
                const isCoreDomain = CORE_DOMAINS.includes(domain.name);
                const DomainIcon = DOMAIN_ICONS[domain.name] || Stethoscope;
                const count = interventions.filter(i => i.care_domain?.name === domain.name).length;

                return (
                  <div
                    key={domain.id}
                    className={`relative p-2.5 rounded-lg border text-center transition-all ${
                      hasIntervention
                        ? 'bg-emerald-50 border-emerald-200'
                        : isCoreDomain
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <DomainIcon className={`w-5 h-5 mx-auto mb-1 ${
                      hasIntervention ? 'text-emerald-600' : isCoreDomain ? 'text-amber-600' : 'text-gray-400'
                    }`} />
                    <div className={`text-xs font-medium truncate ${
                      hasIntervention ? 'text-emerald-700' : isCoreDomain ? 'text-amber-700' : 'text-gray-500'
                    }`}>
                      {domain.name.replace(' Therapy', '')}
                    </div>
                    {hasIntervention && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-emerald-500 text-white text-xs font-bold rounded-full">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <Link
              to={`/conditions/${conditionId}/interventions/attach`}
              className="mt-3 inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="w-4 h-4" />
              Attach Interventions
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </WorkflowStep>

          {/* Step 3: Spiritual Care */}
          <WorkflowStep
            number={3}
            title="Spiritual Care"
            subtitle="Scripture & EGW"
            isComplete={hasScriptures}
            progress={hasScriptures ? `${scriptures.length} added` : 'Recommended'}
            progressWarning={!hasScriptures}
          >
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasScriptures ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <BookOpen className={`w-5 h-5 ${hasScriptures ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Bible & Spirit of Prophecy</div>
                  <div className="text-xs text-gray-500">Scripture passages and Ellen White quotes</div>
                </div>
              </div>
              <Link
                to={`/conditions/${conditionId}/scriptures/attach`}
                className="btn-outline text-sm py-1.5 px-3"
                onClick={(e) => e.stopPropagation()}
              >
                {hasScriptures ? 'Add More' : 'Add'}
              </Link>
            </div>
          </WorkflowStep>

          {/* Step 4: Recipes (Optional) */}
          <WorkflowStep
            number={4}
            title="Recipes"
            subtitle="Optional"
            isComplete={hasRecipes}
            progress={hasRecipes ? `${recipes.length} added` : 'Optional'}
            isOptional
          >
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasRecipes ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <ChefHat className={`w-5 h-5 ${hasRecipes ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Therapeutic Recipes</div>
                  <div className="text-xs text-gray-500">Culinary medicine for healing</div>
                </div>
              </div>
              <Link
                to={`/conditions/${conditionId}/recipes/attach`}
                className="btn-outline text-sm py-1.5 px-3"
                onClick={(e) => e.stopPropagation()}
              >
                {hasRecipes ? 'Add More' : 'Add'}
              </Link>
            </div>
          </WorkflowStep>

          {/* Optional Sections */}
          {OPTIONAL_SECTIONS.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Optional Sections</div>
              <div className="flex flex-wrap gap-2">
                {OPTIONAL_SECTIONS.map((section) => {
                  const isComplete = existingSectionTypes.has(section.type);
                  return (
                    <div
                      key={section.type}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
                        isComplete
                          ? 'bg-gray-100 border-gray-200 text-gray-600'
                          : 'bg-white border-dashed border-gray-300 text-gray-500'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <span>{section.label}</span>
                      {!isComplete && (
                        <Link
                          to={`/conditions/${conditionId}/sections/new?type=${section.type}`}
                          className="text-primary-600 hover:text-primary-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Workflow Step Component
const WorkflowStep = ({ number, title, subtitle, isComplete, progress, progressWarning, isOptional, children }) => (
  <div className="relative">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isComplete
          ? 'bg-emerald-500 text-white'
          : isOptional
          ? 'bg-gray-200 text-gray-500'
          : 'bg-primary-100 text-primary-700'
      }`}>
        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          <span className="text-xs text-gray-400">{subtitle}</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isComplete
          ? 'bg-emerald-100 text-emerald-700'
          : progressWarning
          ? 'bg-amber-100 text-amber-700'
          : isOptional
          ? 'bg-gray-100 text-gray-500'
          : 'bg-gray-100 text-gray-600'
      }`}>
        {progress}
      </span>
    </div>
    <div className="ml-10">
      {children}
    </div>
  </div>
);

export default ConditionWorkflowGuide;
