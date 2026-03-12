import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * @constant {Array<{code: string, name: string, nativeName: string, flag: string}>}
 * LANGUAGES - Supported application languages with display metadata.
 */
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

/**
 * Custom hook for managing the application's active language.
 * Wraps react-i18next with convenience methods and language metadata.
 *
 * @returns {Object} Language utilities
 * @returns {Object} return.currentLanguage - The active language object with code, name, nativeName, flag
 * @returns {Array} return.languages - All available language objects
 * @returns {Function} return.changeLanguage - Switch to a specific language code
 * @returns {Function} return.toggleLanguage - Cycle to the next language
 * @returns {boolean} return.isEnglish - Whether the current language is English
 * @returns {boolean} return.isFrench - Whether the current language is French
 */
export const useLanguage = () => {
  const { i18n } = useTranslation();

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = useCallback(
    (languageCode) => {
      i18n.changeLanguage(languageCode);
    },
    [i18n]
  );

  const toggleLanguage = useCallback(() => {
    const currentIndex = LANGUAGES.findIndex((lang) => lang.code === i18n.language);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    i18n.changeLanguage(LANGUAGES[nextIndex].code);
  }, [i18n]);

  return {
    currentLanguage,
    languages: LANGUAGES,
    changeLanguage,
    toggleLanguage,
    isEnglish: i18n.language === 'en',
    isFrench: i18n.language === 'fr',
  };
};

export default useLanguage;
