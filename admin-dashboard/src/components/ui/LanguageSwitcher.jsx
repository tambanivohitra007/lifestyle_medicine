import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const LanguageSwitcher = ({ variant = 'default', showLabel = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { currentLanguage, languages, changeLanguage } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  const baseButtonClasses = 'flex items-center gap-2 transition-colors touch-manipulation';

  const variantClasses = {
    default: 'px-3 py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-700',
    header: 'px-2 py-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-600',
    sidebar: 'px-3 py-2 rounded-lg hover:bg-secondary-800 text-gray-300 hover:text-white',
    mobile: 'px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseButtonClasses} ${variantClasses[variant]}`}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        {showLabel && (
          <>
            <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[160px] ${
            variant === 'sidebar' ? 'bottom-full mb-2 left-0' : 'top-full right-0'
          }`}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleSelect(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                currentLanguage.code === language.code
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="flex-1 text-left font-medium">{language.nativeName}</span>
              {currentLanguage.code === language.code && (
                <Check className="w-4 h-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
