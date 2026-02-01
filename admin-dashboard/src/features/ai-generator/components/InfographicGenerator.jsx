import { useState, useEffect, useCallback } from 'react';
import { Image, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../../lib/api';

const INFOGRAPHIC_TYPES = {
  overview: {
    labelKey: 'aiGenerator:infographics.types.overview',
    descriptionKey: 'aiGenerator:infographics.types.overviewDesc',
  },
  risk_factors: {
    labelKey: 'aiGenerator:infographics.types.riskFactors',
    descriptionKey: 'aiGenerator:infographics.types.riskFactorsDesc',
  },
  lifestyle_solutions: {
    labelKey: 'aiGenerator:infographics.types.lifestyleSolutions',
    descriptionKey: 'aiGenerator:infographics.types.lifestyleSolutionsDesc',
  },
};

const STATUS_CONFIG = {
  not_started: { icon: Image, color: 'text-gray-400', bg: 'bg-gray-100', labelKey: 'aiGenerator:infographics.status.notStarted' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', labelKey: 'aiGenerator:infographics.status.queued' },
  processing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', labelKey: 'aiGenerator:infographics.status.generating', animate: true },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', labelKey: 'aiGenerator:infographics.status.complete' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', labelKey: 'aiGenerator:infographics.status.failed' },
};

const InfographicGenerator = ({ conditionId, conditionName, onComplete }) => {
  const { t } = useTranslation(['aiGenerator']);
  const [configured, setConfigured] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(['overview', 'risk_factors', 'lifestyle_solutions']);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Check if Imagen is configured
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get(apiEndpoints.infographicsStatus);
        setConfigured(response.data.configured);
      } catch (err) {
        console.error('Failed to check Imagen status:', err.response?.status, err.message);
        setConfigured(false);
      }
    };
    checkStatus();
  }, []);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    if (!conditionId) return;

    try {
      const response = await api.get(apiEndpoints.conditionInfographicsStatus(conditionId));
      setStatus(response.data);

      // Check if still generating
      const isGenerating = response.data.is_generating;
      setGenerating(isGenerating);

      // Stop polling if generation is complete
      if (!isGenerating && pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);

        // Notify parent if all completed
        if (response.data.summary.completed === response.data.summary.total) {
          onComplete?.();
        }
      }
    } catch (err) {
      console.error('Failed to fetch infographic status:', err);
    }
  }, [conditionId, pollingInterval, onComplete]);

  // Initial status fetch
  useEffect(() => {
    if (conditionId && configured) {
      fetchStatus();
    }
  }, [conditionId, configured, fetchStatus]);

  // Start polling when generating
  useEffect(() => {
    if (generating && !pollingInterval) {
      const interval = setInterval(fetchStatus, 5000);
      setPollingInterval(interval);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [generating, pollingInterval, fetchStatus]);

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) {
      setError(t('aiGenerator:infographics.selectAtLeastOne'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(apiEndpoints.conditionInfographicsGenerate(conditionId), {
        types: selectedTypes,
      });

      setGenerating(true);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (requestId) => {
    try {
      await api.post(apiEndpoints.infographicRetry(requestId));
      setGenerating(true);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retry generation');
    }
  };

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // Not configured state
  if (configured === false) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">{t('aiGenerator:infographics.notConfigured.title')}</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {t('aiGenerator:infographics.notConfigured.message')}{' '}
              <code className="px-1 py-0.5 bg-yellow-100 rounded text-xs">{t('aiGenerator:infographics.notConfigured.envVar')}</code>{' '}
              {t('aiGenerator:infographics.notConfigured.suffix')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (configured === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Image className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{t('aiGenerator:infographics.cardTitle')}</h3>
          <p className="text-sm text-gray-500">
            {t('aiGenerator:infographics.cardSubtitle', { conditionName })}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Type Selection */}
      {!generating && (!status || status.summary.completed === 0) && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">{t('aiGenerator:infographics.selectTypes')}</p>
          <div className="space-y-2">
            {Object.entries(INFOGRAPHIC_TYPES).map(([type, config]) => (
              <label
                key={type}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTypes.includes(type)
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-900">{t(config.labelKey)}</span>
                  <p className="text-xs text-gray-500">{t(config.descriptionKey)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Status Display */}
      {status && (
        <div className="mb-4 space-y-2">
          {Object.entries(status.types).map(([type, data]) => {
            const statusConfig = STATUS_CONFIG[data.status] || STATUS_CONFIG.not_started;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={type}
                className={`flex items-center justify-between p-3 rounded-lg ${statusConfig.bg}`}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon
                    className={`w-5 h-5 ${statusConfig.color} ${
                      statusConfig.animate ? 'animate-spin' : ''
                    }`}
                  />
                  <div>
                    <span className="font-medium text-gray-900">{data.label}</span>
                    <span className={`ml-2 text-xs ${statusConfig.color}`}>
                      {t(statusConfig.labelKey)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {data.media && (
                    <a
                      href={data.media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      {t('aiGenerator:infographics.view')}
                    </a>
                  )}
                  {data.status === 'failed' && data.request_id && (
                    <button
                      onClick={() => handleRetry(data.request_id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t('aiGenerator:infographics.retry')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Summary */}
      {status && generating && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {t('aiGenerator:infographics.progress', { completed: status.summary.completed, total: status.summary.total })}
            </span>
          </div>
          <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${(status.summary.completed / status.summary.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      {!generating && (
        <button
          onClick={handleGenerate}
          disabled={loading || selectedTypes.length === 0}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            loading || selectedTypes.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('aiGenerator:infographics.starting')}
            </>
          ) : status && status.summary.completed > 0 ? (
            <>
              <RefreshCw className="w-4 h-4" />
              {t('aiGenerator:infographics.regenerate')}
            </>
          ) : (
            <>
              <Image className="w-4 h-4" />
              {t('aiGenerator:infographics.generate')}
            </>
          )}
        </button>
      )}

      <p className="mt-3 text-xs text-gray-500 text-center">
        {t('aiGenerator:infographics.timeEstimate')}
      </p>
    </div>
  );
};

export default InfographicGenerator;
