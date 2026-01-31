import DOMPurify from 'dompurify';

// Configure DOMPurify to allow safe HTML tags only
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'hr', 'sup', 'sub'
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'id'];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML content
 * @returns {string} - Sanitized HTML safe for dangerouslySetInnerHTML
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Strip all HTML tags from content (for search, plain text previews, etc.)
 * @param {string} html - HTML content
 * @returns {string} - Plain text without HTML tags
 */
export const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = DOMPurify.sanitize(html);
  return tmp.textContent || tmp.innerText || '';
};

export default sanitizeHtml;
