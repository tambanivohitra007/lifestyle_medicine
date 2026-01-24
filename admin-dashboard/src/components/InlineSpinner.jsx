import { Loader2 } from 'lucide-react';

/**
 * Small inline spinner for buttons and inline loading states
 *
 * @param {string} size - Size of the spinner: 'sm', 'md', 'lg' (default: 'sm')
 * @param {string} className - Additional CSS classes
 */
const InlineSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-label="Loading"
    />
  );
};

export default InlineSpinner;
