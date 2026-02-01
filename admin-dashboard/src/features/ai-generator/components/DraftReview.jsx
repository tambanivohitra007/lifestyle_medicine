import { useState } from 'react';
import { ArrowLeft, RefreshCw, Check, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import MDEditor from '@uiw/react-md-editor';

const DraftReview = ({
  conditionName,
  draft,
  onApprove,
  onBack,
  onRegenerateDraft,
  loading,
}) => {
  const { t } = useTranslation(['aiGenerator']);
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

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {t('aiGenerator:phases.draft.title')}
          <span className="hidden sm:inline"> {t('aiGenerator:phases.draft.forCondition', { conditionName })}</span>
        </h2>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={handleStartEditing}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              {t('aiGenerator:actions.edit')}
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {t('aiGenerator:actions.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4 mr-1.5" />
                {t('aiGenerator:actions.done')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm text-yellow-700">
          <strong>{t('aiGenerator:draft.notSaved')}</strong>
          <span className="hidden sm:inline ml-2">
            {isEditing
              ? t('aiGenerator:draft.editInstructions')
              : t('aiGenerator:draft.reviewInstructions')}
          </span>
        </div>
      </div>

      {/* Draft Content */}
      <div className="mb-4 sm:mb-6">
        {isEditing ? (
          <div data-color-mode="light" className="md-editor-mobile">
            <MDEditor
              value={editedDraft}
              onChange={(val) => setEditedDraft(val || '')}
              height={400}
              preview="edit"
              hideToolbar={false}
              enableScroll={true}
              visibleDragbar={false}
              textareaProps={{
                disabled: loading,
                placeholder: t('aiGenerator:draft.editPlaceholder'),
              }}
            />
            <style>{`
              @media (max-width: 640px) {
                .w-md-editor-toolbar {
                  flex-wrap: wrap;
                  padding: 4px !important;
                }
                .w-md-editor-toolbar ul {
                  flex-wrap: wrap;
                }
                .w-md-editor-toolbar li > button {
                  padding: 4px !important;
                  height: 28px !important;
                  width: 28px !important;
                }
              }
            `}</style>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
            <article className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-h1:text-lg sm:prose-h1:text-xl prose-h1:font-bold prose-h1:text-primary-700 prose-h1:border-b prose-h1:border-primary-200 prose-h1:pb-2 prose-h1:mb-4 prose-h2:text-base sm:prose-h2:text-lg prose-h2:font-bold prose-h2:mt-6 sm:prose-h2:mt-8 prose-h2:mb-2 sm:prose-h2:mb-3 prose-h2:text-gray-800 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-sm sm:prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 sm:prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-gray-700 prose-p:text-gray-700 prose-p:mb-2 sm:prose-p:mb-3 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base prose-ul:my-2 sm:prose-ul:my-3 prose-ul:pl-4 sm:prose-ul:pl-6 prose-li:text-gray-700 prose-li:mb-1 prose-li:text-sm sm:prose-li:text-base prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-primary-300 prose-blockquote:bg-primary-50 prose-blockquote:py-2 prose-blockquote:px-3 sm:prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:text-sm sm:prose-blockquote:text-base">
              <ReactMarkdown>
                {draft}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
        <button
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center sm:justify-start px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 order-3 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('aiGenerator:actions.back')}
        </button>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
          <button
            onClick={onRegenerateDraft}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('aiGenerator:actions.regenerate')}
          </button>

          <button
            onClick={handleApprove}
            disabled={loading || isEditing}
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('aiGenerator:actions.structuring')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('aiGenerator:actions.approveStructure')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftReview;
