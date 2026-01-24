import { useState } from 'react';
import { ArrowLeft, RefreshCw, Check, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
            <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-h1:text-xl prose-h1:font-bold prose-h1:text-primary-700 prose-h1:border-b prose-h1:border-primary-200 prose-h1:pb-2 prose-h1:mb-4 prose-h2:text-lg prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-gray-800 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-gray-700 prose-p:text-gray-700 prose-p:mb-3 prose-p:leading-relaxed prose-ul:my-3 prose-ul:pl-6 prose-li:text-gray-700 prose-li:mb-1 prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-primary-300 prose-blockquote:bg-primary-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-600">
              <ReactMarkdown>
                {isEditing ? editedDraft : draft}
              </ReactMarkdown>
            </article>
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
