import { useState } from 'react';
import { ArrowLeft, RefreshCw, Check, Edit3 } from 'lucide-react';

const DraftReview = ({
  conditionName,
  draft,
  onApprove,
  onBack,
  onRegenerateDraft,
  loading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState(draft);

  const handleApprove = () => {
    onApprove(isEditing ? editedDraft : draft);
  };

  const handleStartEditing = () => {
    setEditedDraft(draft);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedDraft(draft);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Phase 2: Review Draft for "{conditionName}"
        </h2>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={handleStartEditing}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              Edit
            </button>
          )}
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-700">
          <strong>DRAFT — NOT YET STRUCTURED OR SAVED</strong>
          <span className="ml-2">Review the content below and approve when ready.</span>
        </div>
      </div>

      {/* Draft Content */}
      <div className="mb-6">
        {isEditing ? (
          <textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            rows={30}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              {(isEditing ? editedDraft : draft).split('\n').map((line, index) => {
                // Handle markdown-style headers
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-base font-semibold text-gray-900 mt-6 mb-2">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-lg font-bold text-gray-900 mt-8 mb-3 border-b pb-2">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-xl font-bold text-primary-700 mb-4">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <li key={index} className="ml-4 text-gray-700">
                      {line.replace(/^[-*] /, '')}
                    </li>
                  );
                }
                if (line.trim() === '') {
                  return <br key={index} />;
                }
                // Handle bold text
                const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return (
                  <p
                    key={index}
                    className="text-gray-700 mb-2"
                    dangerouslySetInnerHTML={{ __html: boldProcessed }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Input
        </button>

        <div className="flex gap-3">
          <button
            onClick={onRegenerateDraft}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Structuring...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Approve & Structure
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftReview;
