import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Safely displays HTML content with optional truncation and "Read More" functionality
 *
 * @param {string} content - HTML content to display
 * @param {number} maxLines - Maximum number of lines before truncation (default: 3)
 * @param {boolean} allowExpand - Whether to show "Read More" button (default: false)
 * @param {string} className - Additional CSS classes
 */
const RichTextPreview = ({
  content,
  maxLines = 3,
  allowExpand = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // Strip HTML tags for plain text measurement
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const plainText = stripHtml(content);
  const isLongContent = plainText.length > 150 || (plainText.match(/\n/g) || []).length > maxLines;

  // Base styles for prose rendering (similar to Tailwind's prose)
  const proseStyles = `
    prose prose-sm max-w-none
    prose-headings:font-semibold prose-headings:text-gray-900
    prose-p:text-gray-600 prose-p:leading-relaxed
    prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700
    prose-strong:text-gray-900 prose-strong:font-semibold
    prose-em:text-gray-700 prose-em:italic
    prose-ul:list-disc prose-ul:pl-5 prose-ul:text-gray-600
    prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-gray-600
    prose-li:text-gray-600
    prose-blockquote:border-l-4 prose-blockquote:border-primary-200 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
    prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
  `;

  // Truncation style only if not expanded
  const truncationStyle = !isExpanded && isLongContent && !allowExpand
    ? `line-clamp-${maxLines}`
    : '';

  return (
    <div className={className}>
      <div
        className={`${proseStyles} ${truncationStyle} ${isExpanded ? '' : 'overflow-hidden'}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {allowExpand && isLongContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 focus:outline-none focus:underline"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  );
};

RichTextPreview.propTypes = {
  content: PropTypes.string,
  maxLines: PropTypes.number,
  allowExpand: PropTypes.bool,
  className: PropTypes.string,
};

export default RichTextPreview;

/**
 * Utility function to strip HTML tags from content (for search, previews, etc.)
 * Can be used separately when you need plain text
 */
export const stripHtmlTags = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};
