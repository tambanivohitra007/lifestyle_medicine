import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import ConditionInput from './components/ConditionInput';
import DraftReview from './components/DraftReview';
import StructuredPreview from './components/StructuredPreview';
import ImportProgress from './components/ImportProgress';

const PHASES = {
  INPUT: 'input',
  DRAFT: 'draft',
  STRUCTURED: 'structured',
  IMPORTING: 'importing',
  COMPLETE: 'complete',
};

const AiContentGenerator = () => {
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
      });
      setDraft(response.data.draft);
      setPhase(PHASES.DRAFT);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate draft');
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
      });
      setStructured(response.data.structured);
      setPhase(PHASES.STRUCTURED);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to structure content');
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
      });
      setImportResult(response.data);
      setPhase(PHASES.COMPLETE);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import content');
      setPhase(PHASES.STRUCTURED);
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
                <h2 className="text-base sm:text-lg font-semibold text-yellow-800">AI Service Not Configured</h2>
                <p className="mt-2 text-sm sm:text-base text-yellow-700">
                  The AI Content Generator requires a Gemini API key. Please add your API key to the
                  <code className="mx-1 px-2 py-0.5 bg-yellow-100 rounded text-xs sm:text-sm break-all">GEMINI_API_KEY</code>
                  environment variable.
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AI Content Generator</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                Generate comprehensive condition content using AI
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: PHASES.INPUT, label: 'Input', mobileLabel: '1', num: 1 },
              { key: PHASES.DRAFT, label: 'Review Draft', mobileLabel: '2', num: 2 },
              { key: PHASES.STRUCTURED, label: 'Preview & Import', mobileLabel: '3', num: 3 },
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
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.num === 1 ? 'Input' : step.num === 2 ? 'Review' : 'Import'}</span>
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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Import Complete!</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                The content for <strong>{conditionName}</strong> has been successfully imported.
              </p>

              {importResult && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left max-w-md mx-auto">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Import Summary</h3>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-600">
                    {importResult.condition_id && (
                      <li className="break-all">Condition ID: <code className="bg-gray-200 px-1 rounded text-xs">{importResult.condition_id}</code></li>
                    )}
                    {importResult.sections_created > 0 && (
                      <li>{importResult.sections_created} sections created</li>
                    )}
                    {importResult.interventions_created > 0 && (
                      <li>{importResult.interventions_created} interventions created</li>
                    )}
                    {importResult.scriptures_created > 0 && (
                      <li>{importResult.scriptures_created} scriptures created</li>
                    )}
                    {importResult.egw_references_created > 0 && (
                      <li>{importResult.egw_references_created} EGW references created</li>
                    )}
                    {importResult.recipes_created > 0 && (
                      <li>{importResult.recipes_created} recipes created</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  onClick={handleReset}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
                >
                  Generate Another
                </button>
                {importResult?.condition_id && (
                  <a
                    href={`/conditions/${importResult.condition_id}`}
                    className="px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 text-sm sm:text-base order-1 sm:order-2"
                  >
                    View Condition
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiContentGenerator;
