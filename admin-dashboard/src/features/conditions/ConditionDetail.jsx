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
  Network,
} from 'lucide-react';
import api, { apiEndpoints, getApiBaseUrl } from '../../lib/api';
import { toast, confirmDelete, confirmRemove } from '../../lib/swal';
import ConditionWorkflowGuide from '../../components/shared/ConditionWorkflowGuide';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import AuditInfo from '../../components/shared/AuditInfo';
import { useAuth } from '../../contexts/AuthContext';
import {
  QuickAttachModal,
  EditInterventionMapping,
  SortableInterventionList,
} from '../../components/relationships';

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

// Parse scripture reference to extract book and chapter
// Examples: "John 3:16", "1 John 2:3-5", "Psalm 23:1-3", "Genesis 1:1"
const parseScriptureReference = (reference) => {
  if (!reference) return null;

  const ref = String(reference).trim();
  if (!ref) return null;

  // Split by the last occurrence of a number followed by : or end
  // This handles "1 John 2:3" → ["1 John", "2", ":3"]
  const parts = ref.split(/\s+/);

  // Find the index where chapter number starts (first part that starts with a digit after the book name)
  let bookParts = [];
  let chapter = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Check if this part starts with a digit and we already have book parts
    if (/^\d/.test(part) && bookParts.length > 0) {
      // This is the chapter:verse part
      chapter = parseInt(part.split(':')[0], 10);
      break;
    } else {
      bookParts.push(part);
    }
  }

  const book = bookParts.join(' ');

  if (book && chapter && chapter > 0) {
    return { book, chapter };
  }

  return null;
};

const ConditionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [condition, setCondition] = useState(null);
  const [sections, setSections] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [scriptures, setScriptures] = useState([]);
  const [egwReferences, setEgwReferences] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sections');
  const [workflowExpanded, setWorkflowExpanded] = useState(false);

  // Modal states
  const [attachModalType, setAttachModalType] = useState(null);
  const [editingIntervention, setEditingIntervention] = useState(null);

  useEffect(() => {
    fetchConditionData();
  }, [id]);

  const fetchConditionData = async () => {
    try {
      setLoading(true);
      // Fetch all data in ONE request instead of 7 separate calls
      const [completeRes, careDomainsRes] = await Promise.all([
        api.get(apiEndpoints.conditionComplete(id)),
        api.get(apiEndpoints.careDomains),
      ]);

      const data = completeRes.data.data;
      setCondition(data.condition);
      setSections(data.sections || []);
      setInterventions(data.interventions || []);
      setScriptures(data.scriptures || []);
      setEgwReferences(data.egw_references || []);
      setRecipes(data.recipes || []);
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

  // Handle reordering interventions via drag-and-drop
  const handleReorderInterventions = async (newOrder) => {
    const previousOrder = [...interventions];
    setInterventions(newOrder);

    try {
      await api.post(apiEndpoints.reorderConditionInterventions(id), {
        order: newOrder.map((i) => i.id),
      });
    } catch (error) {
      console.error('Error reordering interventions:', error);
      toast.error('Failed to reorder interventions');
      setInterventions(previousOrder);
    }
  };

  // Handle attachment from QuickAttachModal
  const handleAttachFromModal = (item, mappingData) => {
    if (attachModalType === 'interventions') {
      setInterventions((prev) => [...prev, { ...item, pivot: mappingData }]);
    } else if (attachModalType === 'scriptures') {
      setScriptures((prev) => [...prev, item]);
    } else if (attachModalType === 'recipes') {
      setRecipes((prev) => [...prev, item]);
    } else if (attachModalType === 'egw-references') {
      setEgwReferences((prev) => [...prev, item]);
    }
    setAttachModalType(null);
  };

  // Handle intervention mapping update
  const handleUpdateInterventionMapping = (updatedMapping) => {
    setInterventions((prev) =>
      prev.map((i) =>
        i.id === editingIntervention.id
          ? { ...i, pivot: { ...i.pivot, ...updatedMapping } }
          : i
      )
    );
    setEditingIntervention(null);
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
    <div className="space-y-4 sm:space-y-6 overflow-hidden">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Conditions', href: '/conditions' },
          { label: condition.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
            {condition.name}
          </h1>
          {condition.category && (
            <span className="inline-block mt-2 px-3 py-1 bg-secondary-100 text-secondary-700 text-xs sm:text-sm font-medium rounded-full">
              {condition.category}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 flex-shrink-0">
          <Link
            to={`/conditions/${id}/preview`}
            className="btn-primary flex items-center justify-center gap-2 text-sm touch-manipulation"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
            <span className="sm:hidden">Preview</span>
          </Link>
          <Link
            to={`/knowledge-graph/condition/${id}`}
            className="btn-outline flex items-center justify-center gap-2 text-sm touch-manipulation"
            title="View Knowledge Graph"
          >
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Graph</span>
          </Link>
          <a
            href={`${getApiBaseUrl()}/api/v1/export/conditions/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center justify-center gap-2 text-sm touch-manipulation"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </a>
          {canEdit && (
            <>
              <Link
                to={`/conditions/${id}/edit`}
                className="btn-outline flex items-center justify-center gap-2 text-sm touch-manipulation"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Link>
              <button
                onClick={handleDelete}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 active:bg-red-100 flex items-center justify-center gap-2 text-sm touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {condition.summary && (
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
          <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base break-words">{condition.summary}</p>
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
              {canEdit && (
                <Link
                  to={`/conditions/${id}/sections/new`}
                  className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </Link>
              )}
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
                        {canEdit && (
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
                        )}
                      </div>
                      {section.body && (
                        <div
                          className="text-gray-600 prose prose-sm max-w-none text-sm sm:text-base overflow-x-auto break-words"
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
              {canEdit && (
                <button
                  onClick={() => setAttachModalType('interventions')}
                  className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Attach Intervention
                </button>
              )}
            </div>

            <SortableInterventionList
              interventions={interventions}
              onReorder={handleReorderInterventions}
              onEdit={(intervention) => setEditingIntervention(intervention)}
              onDetach={(intervention) => handleDetachIntervention(intervention.id, intervention.name)}
              canEdit={canEdit}
            />
          </div>
        )}

        {/* Scriptures Tab */}
        {activeTab === 'scriptures' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Linked Scriptures</h2>
              {canEdit && (
                <button
                  onClick={() => setAttachModalType('scriptures')}
                  className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Attach Scripture
                </button>
              )}
            </div>

            {scriptures.length === 0 ? (
              <div className="card text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No scriptures linked yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scriptures.map((scripture) => {
                  const parsed = parseScriptureReference(scripture.reference);
                  const bibleExplorerUrl = parsed
                    ? `/bible?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}`
                    : '/bible';

                  return (
                    <div key={scripture.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link
                          to={bibleExplorerUrl}
                          className="font-semibold text-gray-900 text-sm sm:text-base hover:text-primary-600 transition-colors"
                          title={parsed ? 'Read full chapter in Bible Explorer' : 'Open Bible Explorer'}
                        >
                          {scripture.reference}
                        </Link>
                        <div className="flex gap-1 flex-shrink-0">
                          <Link
                            to={bibleExplorerUrl}
                            className="action-btn"
                            title={parsed ? 'Read full chapter' : 'Open Bible Explorer'}
                          >
                            <BookOpen className="w-4 h-4 text-primary-500" />
                          </Link>
                          {canEdit && (
                            <button
                              onClick={() => handleDetachScripture(scripture.id, scripture.reference)}
                              className="action-btn hover:bg-red-50 active:bg-red-100"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                      {scripture.theme && (
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full mb-2">
                          {scripture.theme}
                        </span>
                      )}
                      <p className="text-gray-600 text-xs sm:text-sm italic break-words">"{scripture.text}"</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EGW References Tab */}
        {activeTab === 'egw' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Ellen G. White Writings</h2>
              {canEdit && (
                <button
                  onClick={() => setAttachModalType('egw-references')}
                  className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Attach EGW Reference
                </button>
              )}
            </div>

            {egwReferences.length === 0 ? (
              <div className="card text-center py-8">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No EGW references linked yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {egwReferences.map((egwRef) => (
                  <div key={egwRef.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Link
                          to={`/egw-references/${egwRef.id}`}
                          className="font-semibold text-gray-900 text-sm sm:text-base hover:text-primary-600 transition-colors"
                        >
                          {egwRef.citation}
                        </Link>
                        {egwRef.topic && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {egwRef.topic}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link
                          to={`/egw-references/${egwRef.id}`}
                          className="action-btn"
                          title="View"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => handleDetachEgwReference(egwRef.id, egwRef.citation)}
                            className="action-btn hover:bg-red-50 active:bg-red-100"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm italic break-words">"{egwRef.quote}"</p>
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
              {canEdit && (
                <button
                  onClick={() => setAttachModalType('recipes')}
                  className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Attach Recipe
                </button>
              )}
            </div>

            {recipes.length === 0 ? (
              <div className="card text-center py-8">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No recipes linked yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        to={`/recipes/${recipe.id}`}
                        className="font-semibold text-gray-900 text-sm sm:text-base hover:text-primary-600 transition-colors"
                      >
                        {recipe.title}
                      </Link>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link
                          to={`/recipes/${recipe.id}`}
                          className="action-btn"
                          title="View"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => handleDetachRecipe(recipe.id, recipe.title)}
                            className="action-btn hover:bg-red-50 active:bg-red-100"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
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

      {/* Quick Attach Modal */}
      <QuickAttachModal
        isOpen={!!attachModalType}
        onClose={() => setAttachModalType(null)}
        entityType={attachModalType}
        conditionId={id}
        excludeIds={
          attachModalType === 'interventions'
            ? interventions.map((i) => i.id)
            : attachModalType === 'scriptures'
            ? scriptures.map((s) => s.id)
            : attachModalType === 'recipes'
            ? recipes.map((r) => r.id)
            : attachModalType === 'egw-references'
            ? egwReferences.map((e) => e.id)
            : []
        }
        onAttach={handleAttachFromModal}
        showMappingForm={attachModalType === 'interventions'}
      />

      {/* Edit Intervention Mapping Modal */}
      <EditInterventionMapping
        isOpen={!!editingIntervention}
        onClose={() => setEditingIntervention(null)}
        conditionId={id}
        intervention={editingIntervention}
        currentMapping={editingIntervention?.pivot}
        onSave={handleUpdateInterventionMapping}
      />
    </div>
  );
};

export default ConditionDetail;
