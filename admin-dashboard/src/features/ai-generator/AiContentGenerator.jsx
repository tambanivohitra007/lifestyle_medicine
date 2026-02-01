import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { useNotifications } from '../../contexts/NotificationContext';
import ConditionInput from './components/ConditionInput';
import DraftReview from './components/DraftReview';
import StructuredPreview from './components/StructuredPreview';
import ImportProgress from './components/ImportProgress';
import InfographicGenerator from './components/InfographicGenerator';

const PHASES = {
  INPUT: 'input',
  DRAFT: 'draft',
  STRUCTURED: 'structured',
  IMPORTING: 'importing',
  COMPLETE: 'complete',
  INFOGRAPHICS: 'infographics',
};

const AiContentGenerator = () => {
  const { t } = useTranslation(['aiGenerator', 'common']);
  const { notifyAiGeneration } = useNotifications();
  const [phase, setPhase] = useState(PHASES.INPUT);
  const [aiConfigured, setAiConfigured] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data across phases
  const [conditionName, setConditionName] = useState('');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState('');
  const [structured, setStructured] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Check if AI is configured
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get(apiEndpoints.aiStatus);
        setAiConfigured(response.data.configured);
      } catch (err) {
        setAiConfigured(false);
      }
    };
    checkStatus();
  }, []);

  // Phase 1: Generate draft
  const handleGenerateDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(apiEndpoints.aiGenerateDraft, {
        condition_name: conditionName,
        context: context,
      }, {
        timeout: 180000, // 3 minute timeout for AI draft generation
      });
      setDraft(response.data.draft);
      setPhase(PHASES.DRAFT);
    } catch (err) {
      setError(err.response?.data?.error || t('aiGenerator:errors.draftFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Structure content
  const handleApproveDraft = async (approvedDraft) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(apiEndpoints.aiStructureContent, {
        condition_name: conditionName,
        approved_draft: approvedDraft,
      }, {
        timeout: 300000, // 5 minute timeout for AI structuring (System 2 thinking)
      });
      setStructured(response.data.structured);
      setPhase(PHASES.STRUCTURED);
    } catch (err) {
      setError(err.response?.data?.error || t('aiGenerator:errors.structureFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: Import content
  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setPhase(PHASES.IMPORTING);
    try {
      const response = await api.post(apiEndpoints.aiImportContent, {
        structured: structured,
      }, {
        timeout: 120000, // 2 minute timeout for database import
      });
      setImportResult(response.data);
      setPhase(PHASES.COMPLETE);
      // Send success notification
      notifyAiGeneration({
        success: true,
        conditionName: conditionName,
        message: `Successfully imported "${conditionName}" with ${response.data.sections_created || 0} sections, ${response.data.interventions_created || 0} interventions.`,
      });
    } catch (err) {
      setError(err.response?.data?.error || t('aiGenerator:errors.importFailed'));
      setPhase(PHASES.STRUCTURED);
      // Send error notification
      notifyAiGeneration({
        success: false,
        conditionName: conditionName,
        message: err.response?.data?.error || 'Failed to import AI-generated content.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset to start
  const handleReset = () => {
    setPhase(PHASES.INPUT);
    setConditionName('');
    setContext('');
    setDraft('');
    setStructured(null);
    setImportResult(null);
    setError(null);
  };

  // Go back to draft editing
  const handleBackToDraft = () => {
    setPhase(PHASES.DRAFT);
    setStructured(null);
  };

  // Not configured state
  if (aiConfigured === false) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-yellow-800">{t('aiGenerator:notConfigured.title')}</h2>
                <p className="mt-2 text-sm sm:text-base text-yellow-700">
                  {t('aiGenerator:notConfigured.message')}
                  <code className="mx-1 px-2 py-0.5 bg-yellow-100 rounded text-xs sm:text-sm break-all">{t('aiGenerator:notConfigured.envVar')}</code>
                  {t('aiGenerator:notConfigured.envVarSuffix')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading check state
  if (aiConfigured === null) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('aiGenerator:title')}</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                {t('aiGenerator:subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: PHASES.INPUT, labelKey: 'aiGenerator:steps.input', mobileLabelKey: 'aiGenerator:steps.input', num: 1 },
              { key: PHASES.DRAFT, labelKey: 'aiGenerator:steps.reviewDraft', mobileLabelKey: 'aiGenerator:steps.review', num: 2 },
              { key: PHASES.STRUCTURED, labelKey: 'aiGenerator:steps.previewImport', mobileLabelKey: 'aiGenerator:steps.import', num: 3 },
            ].map((step, index) => {
              const isActive = phase === step.key ||
                (phase === PHASES.IMPORTING && step.key === PHASES.STRUCTURED) ||
                (phase === PHASES.COMPLETE && step.key === PHASES.STRUCTURED);
              const isComplete =
                (step.key === PHASES.INPUT && phase !== PHASES.INPUT) ||
                (step.key === PHASES.DRAFT && [PHASES.STRUCTURED, PHASES.IMPORTING, PHASES.COMPLETE].includes(phase)) ||
                (step.key === PHASES.STRUCTURED && phase === PHASES.COMPLETE);

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col sm:flex-row items-center">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base transition-colors ${
                        isComplete
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isComplete ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step.num}
                    </div>
                    <span
                      className={`mt-1 sm:mt-0 sm:ml-2 text-xs sm:text-sm font-medium text-center sm:text-left ${
                        isActive || isComplete ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      <span className="hidden sm:inline">{t(step.labelKey)}</span>
                      <span className="sm:hidden">{t(step.mobileLabelKey)}</span>
                    </span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`flex-1 h-0.5 sm:h-1 mx-2 sm:mx-4 rounded ${
                        isComplete ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-sm sm:text-base text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Phase Content */}
        {phase === PHASES.INPUT && (
          <ConditionInput
            conditionName={conditionName}
            context={context}
            onConditionNameChange={setConditionName}
            onContextChange={setContext}
            onGenerate={handleGenerateDraft}
            loading={loading}
          />
        )}

        {phase === PHASES.DRAFT && (
          <DraftReview
            conditionName={conditionName}
            draft={draft}
            onApprove={handleApproveDraft}
            onBack={() => setPhase(PHASES.INPUT)}
            onRegenerateDraft={handleGenerateDraft}
            loading={loading}
          />
        )}

        {(phase === PHASES.STRUCTURED || phase === PHASES.IMPORTING) && (
          <StructuredPreview
            conditionName={conditionName}
            structured={structured}
            onImport={handleImport}
            onBack={handleBackToDraft}
            loading={loading || phase === PHASES.IMPORTING}
          />
        )}

        {phase === PHASES.IMPORTING && <ImportProgress />}

        {phase === PHASES.COMPLETE && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('aiGenerator:complete.title')}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6" dangerouslySetInnerHTML={{ __html: t('aiGenerator:complete.message', { conditionName }) }} />

              {importResult && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left max-w-md mx-auto">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{t('aiGenerator:summary.title')}</h3>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-600">
                    {importResult.condition_id && (
                      <li className="break-all">{t('aiGenerator:summary.conditionId')} <code className="bg-gray-200 px-1 rounded text-xs">{importResult.condition_id}</code></li>
                    )}
                    {importResult.sections_created > 0 && (
                      <li>{t('aiGenerator:summary.sectionsCreated', { count: importResult.sections_created })}</li>
                    )}
                    {importResult.interventions_created > 0 && (
                      <li>{t('aiGenerator:summary.interventionsCreated', { count: importResult.interventions_created })}</li>
                    )}
                    {importResult.scriptures_created > 0 && (
                      <li>{t('aiGenerator:summary.scripturesCreated', { count: importResult.scriptures_created })}</li>
                    )}
                    {importResult.egw_references_created > 0 && (
                      <li>{t('aiGenerator:summary.egwReferencesCreated', { count: importResult.egw_references_created })}</li>
                    )}
                    {importResult.recipes_created > 0 && (
                      <li>{t('aiGenerator:summary.recipesCreated', { count: importResult.recipes_created })}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
                <button
                  onClick={handleReset}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
                >
                  {t('aiGenerator:actions.generateAnother')}
                </button>
                {importResult?.condition_id && (
                  <a
                    href={`/conditions/${importResult.condition_id}`}
                    className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 text-sm sm:text-base order-1 sm:order-2"
                  >
                    {t('aiGenerator:actions.viewCondition')}
                  </a>
                )}
              </div>

              {/* Optional Phase 4: Infographics */}
              {importResult?.condition_id && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Image className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">{t('aiGenerator:infographics.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('aiGenerator:infographics.description')}
                  </p>
                  <button
                    onClick={() => setPhase(PHASES.INFOGRAPHICS)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 text-sm"
                  >
                    {t('aiGenerator:infographics.generate')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === PHASES.INFOGRAPHICS && importResult?.condition_id && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPhase(PHASES.COMPLETE)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('aiGenerator:actions.backToSummary')}
              </button>
              <a
                href={`/conditions/${importResult.condition_id}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {t('aiGenerator:actions.viewCondition')}
              </a>
            </div>
            <InfographicGenerator
              conditionId={importResult.condition_id}
              conditionName={conditionName}
              onComplete={() => {
                // Optionally redirect or show success message
              }}
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-sm"
              >
                {t('aiGenerator:actions.generateAnotherCondition')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiContentGenerator;
