import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  FileText,
  Stethoscope,
  BookOpen,
  ChefHat,
  AlertCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const SECTION_TYPES = {
  risk_factors: { label: 'Risk Factors', color: 'bg-red-100 text-red-700' },
  physiology: { label: 'Physiology', color: 'bg-blue-100 text-blue-700' },
  complications: { label: 'Complications', color: 'bg-orange-100 text-orange-700' },
  solutions: { label: 'Lifestyle Solutions', color: 'bg-green-100 text-green-700' },
  additional_factors: { label: 'Additional Factors', color: 'bg-purple-100 text-purple-700' },
  scripture: { label: 'Scripture / SOP', color: 'bg-indigo-100 text-indigo-700' },
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
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sections');

  useEffect(() => {
    fetchConditionData();
  }, [id]);

  const fetchConditionData = async () => {
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
      console.error('Error fetching condition:', error);
      alert('Failed to load condition');
      navigate('/conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this condition?')) return;

    try {
      await api.delete(`${apiEndpoints.conditionsAdmin}/${id}`);
      navigate('/conditions');
    } catch (error) {
      console.error('Error deleting condition:', error);
      alert('Failed to delete condition');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      await api.delete(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleDetachIntervention = async (interventionId) => {
    if (!confirm('Remove this intervention from the condition?')) return;

    try {
      await api.delete(apiEndpoints.attachConditionIntervention(id, interventionId));
      setInterventions((prev) => prev.filter((i) => i.id !== interventionId));
    } catch (error) {
      console.error('Error detaching intervention:', error);
      alert('Failed to remove intervention');
    }
  };

  const handleDetachScripture = async (scriptureId) => {
    if (!confirm('Remove this scripture from the condition?')) return;

    try {
      await api.delete(apiEndpoints.attachConditionScripture(id, scriptureId));
      setScriptures((prev) => prev.filter((s) => s.id !== scriptureId));
    } catch (error) {
      console.error('Error detaching scripture:', error);
      alert('Failed to remove scripture');
    }
  };

  const handleDetachRecipe = async (recipeId) => {
    if (!confirm('Remove this recipe from the condition?')) return;

    try {
      await api.delete(apiEndpoints.attachConditionRecipe(id, recipeId));
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (error) {
      console.error('Error detaching recipe:', error);
      alert('Failed to remove recipe');
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
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
    { id: 'recipes', label: 'Recipes', icon: ChefHat, count: recipes.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/conditions"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{condition.name}</h1>
            {condition.category && (
              <span className="inline-block mt-2 px-3 py-1 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-full">
                {condition.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/conditions/${id}/preview`}
            className="btn-primary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Guide
          </Link>
          <Link
            to={`/conditions/${id}/edit`}
            className="btn-outline flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Summary */}
      {condition.summary && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{condition.summary}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Condition Sections</h2>
              <Link
                to={`/conditions/${id}/sections/new`}
                className="btn-primary flex items-center gap-2 text-sm"
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
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              SECTION_TYPES[section.section_type]?.color || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {SECTION_TYPES[section.section_type]?.label || section.section_type}
                          </span>
                          <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/conditions/${id}/sections/${section.id}/edit`}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      {section.body && (
                        <div
                          className="text-gray-600 prose prose-sm max-w-none"
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Linked Interventions</h2>
              <Link
                to={`/conditions/${id}/interventions/attach`}
                className="btn-primary flex items-center gap-2 text-sm"
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
                    className="card flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
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
                        <p className="text-sm text-gray-500 mb-1">
                          Domain: {intervention.care_domain.name}
                        </p>
                      )}
                      {intervention.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {intervention.description}
                        </p>
                      )}
                      {intervention.pivot?.clinical_notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          Note: {intervention.pivot.clinical_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        to={`/interventions/${intervention.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        title="View Intervention"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => handleDetachIntervention(intervention.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                        title="Remove from Condition"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Linked Scriptures</h2>
              <Link
                to={`/conditions/${id}/scriptures/attach`}
                className="btn-primary flex items-center gap-2 text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scriptures.map((scripture) => (
                  <div key={scripture.id} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {scripture.reference}
                      </h3>
                      <button
                        onClick={() => handleDetachScripture(scripture.id)}
                        className="p-1.5 rounded hover:bg-red-50"
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
                    <p className="text-gray-600 text-sm italic">"{scripture.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Linked Recipes</h2>
              <Link
                to={`/conditions/${id}/recipes/attach`}
                className="btn-primary flex items-center gap-2 text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
                      <button
                        onClick={() => handleDetachRecipe(recipe.id)}
                        className="p-1.5 rounded hover:bg-red-50"
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
                      <p className="text-gray-600 text-sm line-clamp-3">
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
