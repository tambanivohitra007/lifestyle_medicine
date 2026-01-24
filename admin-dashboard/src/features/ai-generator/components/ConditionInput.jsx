import { Sparkles, Info } from 'lucide-react';

const ConditionInput = ({
  conditionName,
  context,
  onConditionNameChange,
  onContextChange,
  onGenerate,
  loading,
}) => {
  const canGenerate = conditionName.trim().length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Phase 1: Enter Condition Details
      </h2>

      <div className="space-y-4 sm:space-y-6">
        {/* Condition Name */}
        <div>
          <label htmlFor="conditionName" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Condition Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="conditionName"
            value={conditionName}
            onChange={(e) => onConditionNameChange(e.target.value)}
            placeholder="e.g., Hypertension, Type 2 Diabetes"
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Enter the medical condition name as it should appear in the database.
          </p>
        </div>

        {/* Additional Context */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Additional Context <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            rows={3}
            placeholder="Add any specific focus areas, patient populations, or lifestyle medicine approaches..."
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Provide context to guide the AI toward specific aspects or approaches.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-700">
              <p className="font-medium mb-1">What will be generated:</p>
              <ul className="list-disc ml-4 space-y-0.5 sm:space-y-1">
                <li>Condition overview and summary</li>
                <li>Risk factors, physiology, and complications</li>
                <li>Lifestyle medicine interventions (NEWSTART+)</li>
                <li>Evidence entries with study references</li>
                <li>Scripture passages and spiritual care</li>
                <li>Ellen G. White references</li>
                <li>Relevant recipes (when applicable)</li>
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
                Generating Draft...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Generate Draft
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionInput;
