import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

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
