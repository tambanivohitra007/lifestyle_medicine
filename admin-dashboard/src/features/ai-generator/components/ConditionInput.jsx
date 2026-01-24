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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Phase 1: Enter Condition Details
      </h2>

      <div className="space-y-6">
        {/* Condition Name */}
        <div>
          <label htmlFor="conditionName" className="block text-sm font-medium text-gray-700 mb-2">
            Condition Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="conditionName"
            value={conditionName}
            onChange={(e) => onConditionNameChange(e.target.value)}
            placeholder="e.g., Hypertension, Type 2 Diabetes, Anxiety Disorder"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the medical condition name as it should appear in the database.
          </p>
        </div>

        {/* Additional Context */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Context <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            rows={4}
            placeholder="Add any specific focus areas, patient populations, or lifestyle medicine approaches you want emphasized..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Provide context to guide the AI toward specific aspects or approaches.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">What will be generated:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Condition overview and summary</li>
                <li>Risk factors, physiology, and complications</li>
                <li>Lifestyle medicine interventions organized by care domain (NEWSTART+)</li>
                <li>Evidence entries with study references</li>
                <li>Scripture passages and spiritual care guidance</li>
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
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Generating Draft...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
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
