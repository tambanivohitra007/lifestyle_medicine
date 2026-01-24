import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Plus,
  FileText,
  Stethoscope,
  BookOpen,
  BookMarked,
  ChefHat,
  AlertCircle,
  ChevronRight,
  Eye,
  Download,
} from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete, confirmRemove } from '../../lib/swal';
import ConditionWorkflowGuide from '../../components/shared/ConditionWorkflowGuide';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import AuditInfo from '../../components/shared/AuditInfo';

const SECTION_TYPES = {
  risk_factors: { label: 'Risk Factors / Causes', color: 'bg-red-100 text-red-700' },
  physiology: { label: 'Physiology', color: 'bg-blue-100 text-blue-700' },
  complications: { label: 'Complications', color: 'bg-orange-100 text-orange-700' },
  solutions: { label: 'Lifestyle Solutions', color: 'bg-green-100 text-green-700' },
  additional_factors: { label: 'Additional Factors', color: 'bg-purple-100 text-purple-700' },
  scripture: { label: 'Scripture / SOP', color: 'bg-indigo-100 text-indigo-700' },
  research_ideas: { label: 'Research Ideas', color: 'bg-teal-100 text-teal-700' },
};

const EVIDENCE_STRENGTH = {
  high: { label: 'High', color: 'bg-green-100 text-green-700' },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  emerging: { label: 'Emerging', color: 'bg-blue-100 text-blue-700' },
  insufficient: { label: 'Insufficient', color: 'bg-gray-100 text-gray-700' },
};

const RECOMMENDATION_LEVEL = {
  core: { label: 'Core', color: 'bg-green-100 text-green-700' },
  adjunct: { label: 'Adjunct', color: 'bg-blue-100 text-blue-700' },
  optional: { label: 'Optional', color: 'bg-gray-100 text-gray-700' },
};

const ConditionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [condition, setCondition] = useState(null);
  const [sections, setSections] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [scriptures, setScriptures] = useState([]);
  const [egwReferences, setEgwReferences] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sections');
  const [workflowExpanded, setWorkflowExpanded] = useState(true);

  useEffect(() => {
    fetchConditionData();
  }, [id]);

  const fetchConditionData = async () => {
    try {
      setLoading(true);
      const [conditionRes, sectionsRes, interventionsRes, scripturesRes, egwRes, recipesRes, careDomainsRes] =
        await Promise.all([
          api.get(`${apiEndpoints.conditions}/${id}`),
          api.get(apiEndpoints.conditionSections(id)),
          api.get(apiEndpoints.conditionInterventions(id)),
          api.get(apiEndpoints.conditionScriptures(id)),
          api.get(apiEndpoints.conditionEgwReferences(id)),
          api.get(apiEndpoints.conditionRecipes(id)),
          api.get(apiEndpoints.careDomains),
        ]);

      setCondition(conditionRes.data.data);
      setSections(sectionsRes.data.data || []);
      setInterventions(interventionsRes.data.data || []);
      setScriptures(scripturesRes.data.data || []);
      setEgwReferences(egwRes.data.data || []);
      setRecipes(recipesRes.data.data || []);
      setCareDomains(careDomainsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching condition:', error);
      toast.error('Failed to load condition');
      navigate('/conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete(condition?.name || 'this condition');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.conditionsAdmin}/${id}`);
      toast.success('Condition deleted successfully');
      navigate('/conditions');
    } catch (error) {
      console.error('Error deleting condition:', error);
      toast.error('Failed to delete condition');
    }
  };

  const handleDeleteSection = async (sectionId, sectionTitle) => {
    const confirmed = await confirmDelete(sectionTitle || 'this section');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success('Section deleted');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleDetachIntervention = async (interventionId, interventionName) => {
    const confirmed = await confirmRemove(`Remove "${interventionName}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionIntervention(id, interventionId));
      setInterventions((prev) => prev.filter((i) => i.id !== interventionId));
      toast.success('Intervention removed');
    } catch (error) {
      console.error('Error detaching intervention:', error);
      toast.error('Failed to remove intervention');
    }
  };

  const handleDetachScripture = async (scriptureId, reference) => {
    const confirmed = await confirmRemove(`Remove "${reference}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionScripture(id, scriptureId));
      setScriptures((prev) => prev.filter((s) => s.id !== scriptureId));
      toast.success('Scripture removed');
    } catch (error) {
      console.error('Error detaching scripture:', error);
      toast.error('Failed to remove scripture');
    }
  };

  const handleDetachRecipe = async (recipeId, recipeTitle) => {
    const confirmed = await confirmRemove(`Remove "${recipeTitle}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionRecipe(id, recipeId));
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      toast.success('Recipe removed');
    } catch (error) {
      console.error('Error detaching recipe:', error);
      toast.error('Failed to remove recipe');
    }
  };

  const handleDetachEgwReference = async (egwReferenceId, citation) => {
    const confirmed = await confirmRemove(`Remove "${citation}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionEgwReference(id, egwReferenceId));
      setEgwReferences((prev) => prev.filter((e) => e.id !== egwReferenceId));
      toast.success('EGW reference removed');
    } catch (error) {
      console.error('Error detaching EGW reference:', error);
      toast.error('Failed to remove EGW reference');
    }
  };

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
        <AlertCircle className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Condition not found
        </h3>
        <Link to="/conditions" className="text-primary-600 hover:text-primary-700">
          Back to conditions
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'sections', label: 'Sections', icon: FileText, count: sections.length },
    { id: 'interventions', label: 'Interventions', icon: Stethoscope, count: interventions.length },
    { id: 'scriptures', label: 'Scriptures', icon: BookOpen, count: scriptures.length },
    { id: 'egw', label: 'EGW Writings', icon: BookMarked, count: egwReferences.length },
    { id: 'recipes', label: 'Recipes', icon: ChefHat, count: recipes.length },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Conditions', href: '/conditions' },
          { label: condition.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
            {condition.name}
          </h1>
          {condition.category && (
            <span className="inline-block mt-2 px-3 py-1 bg-secondary-100 text-secondary-700 text-xs sm:text-sm font-medium rounded-full">
              {condition.category}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Link
            to={`/conditions/${id}/preview`}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview Guide</span>
            <span className="sm:hidden">Preview</span>
          </Link>
          <a
            href={`http://localhost:8000/api/v1/export/conditions/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </a>
          <Link
            to={`/conditions/${id}/edit`}
            className="btn-outline flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50 active:bg-red-100 flex items-center justify-center gap-2 flex-1 sm:flex-initial touch-manipulation"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      {condition.summary && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
          <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{condition.summary}</p>
        </div>
      )}

      {/* Audit Info */}
      <AuditInfo data={condition} />

      {/* Workflow Guide */}
      <ConditionWorkflowGuide
        conditionId={id}
        sections={sections}
        interventions={interventions}
        scriptures={scriptures}
        recipes={recipes}
        careDomains={careDomains}
        isExpanded={workflowExpanded}
        onToggle={() => setWorkflowExpanded(!workflowExpanded)}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto pb-px scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Condition Sections</h2>
              <Link
                to={`/conditions/${id}/sections/new`}
                className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </Link>
            </div>

            {sections.length === 0 ? (
              <div className="card text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No sections added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections
                  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                  .map((section) => (
                    <div key={section.id} className="card">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              SECTION_TYPES[section.section_type]?.color || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {SECTION_TYPES[section.section_type]?.label || section.section_type}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{section.title}</h3>
                        </div>
                        <div className="flex gap-1 self-end sm:self-start">
                          <Link
                            to={`/conditions/${id}/sections/${section.id}/edit`}
                            className="action-btn"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSection(section.id, section.title)}
                            className="action-btn hover:bg-red-50 active:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      {section.body && (
                        <div
                          className="text-gray-600 prose prose-sm max-w-none text-sm sm:text-base"
                          dangerouslySetInnerHTML={{ __html: section.body }}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Interventions Tab */}
        {activeTab === 'interventions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Linked Interventions</h2>
              <Link
                to={`/conditions/${id}/interventions/attach`}
                className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Attach Intervention
              </Link>
            </div>

            {interventions.length === 0 ? (
              <div className="card text-center py-8">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No interventions linked yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {intervention.name}
                          </h3>
                          {intervention.pivot?.strength_of_evidence && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                EVIDENCE_STRENGTH[intervention.pivot.strength_of_evidence]?.color
                              }`}
                            >
                              {EVIDENCE_STRENGTH[intervention.pivot.strength_of_evidence]?.label}
                            </span>
                          )}
                          {intervention.pivot?.recommendation_level && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                RECOMMENDATION_LEVEL[intervention.pivot.recommendation_level]?.color
                              }`}
                            >
                              {RECOMMENDATION_LEVEL[intervention.pivot.recommendation_level]?.label}
                            </span>
                          )}
                        </div>
                        {intervention.care_domain && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-1">
                            Domain: {intervention.care_domain.name}
                          </p>
                        )}
                        {intervention.description && (
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {intervention.description}
                          </p>
                        )}
                        {intervention.pivot?.clinical_notes && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-2 italic">
                            Note: {intervention.pivot.clinical_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-start">
                        <Link
                          to={`/interventions/${intervention.id}`}
                          className="action-btn"
                          title="View Intervention"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </Link>
                        <button
                          onClick={() => handleDetachIntervention(intervention.id, intervention.name)}
                          className="action-btn hover:bg-red-50 active:bg-red-100"
                          title="Remove from Condition"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scriptures Tab */}
        {activeTab === 'scriptures' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Linked Scriptures</h2>
              <Link
                to={`/conditions/${id}/scriptures/attach`}
                className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Attach Scripture
              </Link>
            </div>

            {scriptures.length === 0 ? (
              <div className="card text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No scriptures linked yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scriptures.map((scripture) => (
                  <div key={scripture.id} className="card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {scripture.reference}
                      </h3>
                      <button
                        onClick={() => handleDetachScripture(scripture.id, scripture.reference)}
                        className="action-btn hover:bg-red-50 active:bg-red-100 flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {scripture.theme && (
                      <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full mb-2">
                        {scripture.theme}
                      </span>
                    )}
                    <p className="text-gray-600 text-xs sm:text-sm italic">"{scripture.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EGW References Tab */}
        {activeTab === 'egw' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Ellen G. White Writings</h2>
              <Link
                to={`/conditions/${id}/egw-references/attach`}
                className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Attach EGW Reference
              </Link>
            </div>

            {egwReferences.length === 0 ? (
              <div className="card text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No EGW references linked yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {egwReferences.map((egwRef) => (
                  <div key={egwRef.id} className="card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {egwRef.citation}
                        </h3>
                        {egwRef.topic && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {egwRef.topic}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDetachEgwReference(egwRef.id, egwRef.citation)}
                        className="action-btn hover:bg-red-50 active:bg-red-100 flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm italic">"{egwRef.quote}"</p>
                    {egwRef.context && (
                      <p className="text-gray-500 text-xs mt-2">{egwRef.context}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Linked Recipes</h2>
              <Link
                to={`/conditions/${id}/recipes/attach`}
                className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Attach Recipe
              </Link>
            </div>

            {recipes.length === 0 ? (
              <div className="card text-center py-8">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No recipes linked yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{recipe.title}</h3>
                      <button
                        onClick={() => handleDetachRecipe(recipe.id, recipe.title)}
                        className="action-btn hover:bg-red-50 active:bg-red-100 flex-shrink-0"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {recipe.dietary_tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {recipe.description && (
                      <p className="text-gray-600 text-xs sm:text-sm line-clamp-3">
                        {recipe.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionDetail;
