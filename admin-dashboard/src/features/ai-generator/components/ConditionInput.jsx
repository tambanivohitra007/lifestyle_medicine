import { Sparkles, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConditionInput = ({
  conditionName,
  context,
  onConditionNameChange,
  onContextChange,
  onGenerate,
  loading,
}) => {
  const { t } = useTranslation(['aiGenerator']);
  const canGenerate = conditionName.trim().length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        {t('aiGenerator:phases.input.title')}
      </h2>

      <div className="space-y-4 sm:space-y-6">
        {/* Condition Name */}
        <div>
          <label htmlFor="conditionName" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            {t('aiGenerator:input.conditionName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="conditionName"
            value={conditionName}
            onChange={(e) => onConditionNameChange(e.target.value)}
            placeholder={t('aiGenerator:input.conditionNamePlaceholder')}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {t('aiGenerator:input.conditionNameHint')}
          </p>
        </div>

        {/* Additional Context */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            {t('aiGenerator:input.additionalContext')} <span className="text-gray-400">{t('aiGenerator:input.optional')}</span>
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            rows={3}
            placeholder={t('aiGenerator:input.additionalContextPlaceholder')}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {t('aiGenerator:input.additionalContextHint')}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-700">
              <p className="font-medium mb-1">{t('aiGenerator:input.whatGenerated')}</p>
              <ul className="list-disc ml-4 space-y-0.5 sm:space-y-1">
                <li>{t('aiGenerator:input.item1')}</li>
                <li>{t('aiGenerator:input.item2')}</li>
                <li>{t('aiGenerator:input.item3')}</li>
                <li>{t('aiGenerator:input.item4')}</li>
                <li>{t('aiGenerator:input.item5')}</li>
                <li>{t('aiGenerator:input.item6')}</li>
                <li>{t('aiGenerator:input.item7')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            onClick={onGenerate}
            disabled={!canGenerate || loading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2" />
                {t('aiGenerator:actions.generatingDraft')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('aiGenerator:actions.generateDraft')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionInput;
