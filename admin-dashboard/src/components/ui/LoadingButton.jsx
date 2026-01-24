import { Loader2 } from 'lucide-react';

/**
 * Button component with loading state
 *
 * @param {boolean} loading - Whether the button is in loading state
 * @param {boolean} disabled - Whether the button is disabled
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {string} loadingText - Text to show when loading (optional)
 * @param {object} props - Other button props
 */
const LoadingButton = ({
  loading = false,
  disabled = false,
  className = '',
  children,
  loadingText,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} ${
        loading || disabled ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText || children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
