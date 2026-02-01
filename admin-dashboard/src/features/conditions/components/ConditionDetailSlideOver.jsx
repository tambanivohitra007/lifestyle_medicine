import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Plus,
  FileText,
  Stethoscope,
  BookOpen,
  BookMarked,
  ChefHat,
  ChevronRight,
  Eye,
  Download,
  Network,
  Loader2,
  Image,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints, getApiBaseUrl } from '../../../lib/api';
import { toast, confirmDelete, confirmRemove } from '../../../lib/swal';
import { sanitizeHtml } from '../../../lib/sanitize';
import SlideOver from '../../../components/shared/SlideOver';
import AuditInfo from '../../../components/shared/AuditInfo';
import { useAuth } from '../../../contexts/AuthContext';
import {
  QuickAttachModal,
  EditInterventionMapping,
  SortableInterventionList,
} from '../../../components/relationships';
import InfographicGenerator from '../../ai-generator/components/InfographicGenerator';

const ConditionDetailSlideOver = ({ isOpen, onClose, conditionId, onEdit, onDelete }) => {
  const { t } = useTranslation(['conditions', 'common']);

  const SECTION_TYPES = {
    risk_factors: { labelKey: 'conditions:sections.types.riskFactors', color: 'bg-red-100 text-red-700' },
    physiology: { labelKey: 'conditions:sections.types.physiology', color: 'bg-blue-100 text-blue-700' },
    complications: { labelKey: 'conditions:sections.types.complications', color: 'bg-orange-100 text-orange-700' },
    solutions: { labelKey: 'conditions:sections.types.solutions', color: 'bg-green-100 text-green-700' },
    additional_factors: { labelKey: 'conditions:sections.types.additionalFactors', color: 'bg-purple-100 text-purple-700' },
    scripture: { labelKey: 'conditions:sections.types.scripture', color: 'bg-indigo-100 text-indigo-700' },
    research_ideas: { labelKey: 'conditions:sections.types.researchIdeas', color: 'bg-teal-100 text-teal-700' },
  };
  const { canEdit } = useAuth();
  const [condition, setCondition] = useState(null);
  const [sections, setSections] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [scriptures, setScriptures] = useState([]);
  const [egwReferences, setEgwReferences] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [infographics, setInfographics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sections');

  // Modal states
  const [attachModalType, setAttachModalType] = useState(null);
  const [editingIntervention, setEditingIntervention] = useState(null);

  useEffect(() => {
    if (isOpen && conditionId) {
      fetchConditionData();
    }
  }, [isOpen, conditionId]);

  const fetchConditionData = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoints.conditionComplete(conditionId));
      const data = response.data.data;
      setCondition(data.condition);
      setSections(data.sections || []);
      setInterventions(data.interventions || []);
      setScriptures(data.scriptures || []);
      setEgwReferences(data.egw_references || []);
      setRecipes(data.recipes || []);
      setInfographics(data.infographics || []);
    } catch (error) {
      console.error('Error fetching condition:', error);
      toast.error(t('conditions:toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId, sectionTitle) => {
    const confirmed = await confirmDelete(sectionTitle || 'this section');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.conditionSectionsAdmin}/${sectionId}`);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success(t('conditions:sections.toast.deleted'));
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(t('conditions:detail.deleteSectionFailed'));
    }
  };

  const handleDetachIntervention = async (interventionId, interventionName) => {
    const confirmed = await confirmRemove(`Remove "${interventionName}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionIntervention(conditionId, interventionId));
      setInterventions((prev) => prev.filter((i) => i.id !== interventionId));
      toast.success(t('conditions:detail.interventionRemoved'));
    } catch (error) {
      console.error('Error detaching intervention:', error);
      toast.error(t('conditions:detail.removeInterventionFailed'));
    }
  };

  const handleDetachScripture = async (scriptureId, reference) => {
    const confirmed = await confirmRemove(`Remove "${reference}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionScripture(conditionId, scriptureId));
      setScriptures((prev) => prev.filter((s) => s.id !== scriptureId));
      toast.success(t('conditions:detail.scriptureRemoved'));
    } catch (error) {
      console.error('Error detaching scripture:', error);
      toast.error(t('conditions:detail.removeScriptureFailed'));
    }
  };

  const handleDetachRecipe = async (recipeId, recipeTitle) => {
    const confirmed = await confirmRemove(`Remove "${recipeTitle}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionRecipe(conditionId, recipeId));
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      toast.success(t('conditions:detail.recipeRemoved'));
    } catch (error) {
      console.error('Error detaching recipe:', error);
      toast.error(t('conditions:detail.removeRecipeFailed'));
    }
  };

  const handleDetachEgwReference = async (egwReferenceId, citation) => {
    const confirmed = await confirmRemove(`Remove "${citation}" from this condition?`);
    if (!confirmed) return;

    try {
      await api.delete(apiEndpoints.attachConditionEgwReference(conditionId, egwReferenceId));
      setEgwReferences((prev) => prev.filter((e) => e.id !== egwReferenceId));
      toast.success(t('conditions:detail.egwRemoved'));
    } catch (error) {
      console.error('Error detaching EGW reference:', error);
      toast.error(t('conditions:detail.removeEgwFailed'));
    }
  };

  const handleReorderInterventions = async (newOrder) => {
    const previousOrder = [...interventions];
    setInterventions(newOrder);

    try {
      await api.post(apiEndpoints.reorderConditionInterventions(conditionId), {
        order: newOrder.map((i) => i.id),
      });
    } catch (error) {
      console.error('Error reordering interventions:', error);
      toast.error(t('conditions:detail.reorderFailed'));
      setInterventions(previousOrder);
    }
  };

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

  const tabs = [
    { id: 'sections', labelKey: 'conditions:detail.sections', icon: FileText, count: sections.length },
    { id: 'interventions', labelKey: 'conditions:detail.interventions', icon: Stethoscope, count: interventions.length },
    { id: 'scriptures', labelKey: 'conditions:detail.scriptures', icon: BookOpen, count: scriptures.length },
    { id: 'egw', labelKey: 'conditions:detail.egwShort', icon: BookMarked, count: egwReferences.length },
    { id: 'recipes', labelKey: 'recipes:title', icon: ChefHat, count: recipes.length },
    { id: 'infographics', labelKey: 'common:labels.images', icon: Image, count: infographics.length },
  ];

  return (
    <>
      <SlideOver
        isOpen={isOpen}
        onClose={onClose}
        title={loading ? t('common:messages.loading') : condition?.name || t('conditions:detail.title')}
        subtitle={condition?.category}
        size="xl"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : condition ? (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/conditions/${conditionId}`}
                className="btn-primary flex items-center gap-2 text-sm"
                onClick={onClose}
              >
                <ExternalLink className="w-4 h-4" />
                {t('conditions:detail.fullPage')}
              </Link>
              <Link
                to={`/conditions/${conditionId}/preview`}
                className="btn-outline flex items-center gap-2 text-sm"
                onClick={onClose}
              >
                <Eye className="w-4 h-4" />
                {t('conditions:preview.title')}
              </Link>
              <Link
                to={`/knowledge-graph/condition/${conditionId}`}
                className="btn-outline flex items-center gap-2 text-sm"
                onClick={onClose}
              >
                <Network className="w-4 h-4" />
                {t('conditions:detail.graph')}
              </Link>
              <a
                href={`${getApiBaseUrl()}/api/v1/export/conditions/${conditionId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </a>
              {canEdit && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(conditionId);
                    }}
                    className="btn-outline flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    {t('common:buttons.edit')}
                  </button>
                  <button
                    onClick={() => onDelete(conditionId, condition.name)}
                    className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common:buttons.delete')}
                  </button>
                </>
              )}
            </div>

            {/* Summary */}
            {condition.summary && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">{t('common:labels.summary')}</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{condition.summary}</p>
              </div>
            )}

            {/* Audit Info */}
            <AuditInfo data={condition} />

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-1 overflow-x-auto pb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium text-xs transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {t(tab.labelKey)}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
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
            <div className="min-h-[200px]">
              {/* Sections Tab */}
              {activeTab === 'sections' && (
                <div className="space-y-3">
                  {canEdit && (
                    <Link
                      to={`/conditions/${conditionId}/sections/new`}
                      className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
                      onClick={onClose}
                    >
                      <Plus className="w-4 h-4" />
                      {t('conditions:detail.addSection')}
                    </Link>
                  )}
                  {sections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('conditions:detail.noSections')}</p>
                    </div>
                  ) : (
                    sections
                      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                      .map((section) => (
                        <div key={section.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  SECTION_TYPES[section.section_type]?.color || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {SECTION_TYPES[section.section_type]?.labelKey ? t(SECTION_TYPES[section.section_type].labelKey) : section.section_type}
                              </span>
                              <span className="font-medium text-gray-900 text-sm">{section.title}</span>
                            </div>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Link
                                  to={`/conditions/${conditionId}/sections/${section.id}/edit`}
                                  className="p-1.5 hover:bg-gray-200 rounded"
                                  onClick={onClose}
                                >
                                  <Edit className="w-3.5 h-3.5 text-gray-600" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteSection(section.id, section.title)}
                                  className="p-1.5 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                          {section.body && (
                            <div
                              className="text-gray-600 prose prose-sm max-w-none text-xs line-clamp-3"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body) }}
                            />
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Interventions Tab */}
              {activeTab === 'interventions' && (
                <div className="space-y-3">
                  {canEdit && (
                    <button
                      onClick={() => setAttachModalType('interventions')}
                      className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
                    >
                      <Plus className="w-4 h-4" />
                      {t('conditions:attach.intervention')}
                    </button>
                  )}
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
                <div className="space-y-3">
                  {canEdit && (
                    <button
                      onClick={() => setAttachModalType('scriptures')}
                      className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
                    >
                      <Plus className="w-4 h-4" />
                      {t('conditions:attach.scripture')}
                    </button>
                  )}
                  {scriptures.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('conditions:detail.noScriptures')}</p>
                    </div>
                  ) : (
                    scriptures.map((scripture) => (
                      <div key={scripture.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{scripture.reference}</span>
                          {canEdit && (
                            <button
                              onClick={() => handleDetachScripture(scripture.id, scripture.reference)}
                              className="p-1.5 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                        {scripture.theme && (
                          <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full mb-1">
                            {scripture.theme}
                          </span>
                        )}
                        <p className="text-gray-600 text-xs italic line-clamp-2">"{scripture.text}"</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* EGW References Tab */}
              {activeTab === 'egw' && (
                <div className="space-y-3">
                  {canEdit && (
                    <button
                      onClick={() => setAttachModalType('egw-references')}
                      className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
                    >
                      <Plus className="w-4 h-4" />
                      {t('conditions:attach.egwReference')}
                    </button>
                  )}
                  {egwReferences.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('conditions:detail.noEgwReferences')}</p>
                    </div>
                  ) : (
                    egwReferences.map((egwRef) => (
                      <div key={egwRef.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">{egwRef.citation}</span>
                            {egwRef.topic && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {egwRef.topic}
                              </span>
                            )}
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleDetachEgwReference(egwRef.id, egwRef.citation)}
                              className="p-1.5 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs italic line-clamp-2">"{egwRef.quote}"</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Recipes Tab */}
              {activeTab === 'recipes' && (
                <div className="space-y-3">
                  {canEdit && (
                    <button
                      onClick={() => setAttachModalType('recipes')}
                      className="btn-primary flex items-center justify-center gap-2 text-sm w-full"
                    >
                      <Plus className="w-4 h-4" />
                      {t('conditions:attach.recipe')}
                    </button>
                  )}
                  {recipes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ChefHat className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('conditions:detail.noRecipes')}</p>
                    </div>
                  ) : (
                    recipes.map((recipe) => (
                      <div key={recipe.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{recipe.title}</span>
                          <div className="flex gap-1">
                            <Link
                              to={`/recipes/${recipe.id}`}
                              className="p-1.5 hover:bg-gray-200 rounded"
                              onClick={onClose}
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </Link>
                            {canEdit && (
                              <button
                                onClick={() => handleDetachRecipe(recipe.id, recipe.title)}
                                className="p-1.5 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                        {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {recipe.dietary_tags.slice(0, 3).map((tag, idx) => (
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
                          <p className="text-gray-600 text-xs line-clamp-2">{recipe.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Infographics Tab */}
              {activeTab === 'infographics' && (
                <div className="space-y-3">
                  {/* Show existing infographics */}
                  {infographics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {infographics.map((media) => (
                        <a
                          key={media.id}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={media.url}
                            alt={media.alt_text || 'Infographic'}
                            className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Infographic Generator */}
                  {canEdit && (
                    <InfographicGenerator
                      conditionId={conditionId}
                      conditionName={condition?.name}
                      onComplete={fetchConditionData}
                    />
                  )}

                  {!canEdit && infographics.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('conditions:detail.noInfographics')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>{t('conditions:detail.notFound')}</p>
          </div>
        )}
      </SlideOver>

      {/* Quick Attach Modal */}
      <QuickAttachModal
        isOpen={!!attachModalType}
        onClose={() => setAttachModalType(null)}
        entityType={attachModalType}
        conditionId={conditionId}
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
        conditionId={conditionId}
        intervention={editingIntervention}
        currentMapping={editingIntervention?.pivot}
        onSave={handleUpdateInterventionMapping}
      />
    </>
  );
};

export default ConditionDetailSlideOver;
