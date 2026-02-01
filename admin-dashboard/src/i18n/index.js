import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enAuth from './locales/en/auth.json';
import enConditions from './locales/en/conditions.json';
import enInterventions from './locales/en/interventions.json';
import enRecipes from './locales/en/recipes.json';
import enUsers from './locales/en/users.json';
import enDashboard from './locales/en/dashboard.json';
import enEvidence from './locales/en/evidence.json';
import enReferences from './locales/en/references.json';
import enScriptures from './locales/en/scriptures.json';
import enCareDomains from './locales/en/careDomains.json';
import enTags from './locales/en/tags.json';
import enAnalytics from './locales/en/analytics.json';
import enKnowledgeGraph from './locales/en/knowledgeGraph.json';
import enAiGenerator from './locales/en/aiGenerator.json';
import enImport from './locales/en/import.json';
import enBible from './locales/en/bible.json';
import enProfile from './locales/en/profile.json';
import enSearch from './locales/en/search.json';

// Import French translations
import frCommon from './locales/fr/common.json';
import frNavigation from './locales/fr/navigation.json';
import frAuth from './locales/fr/auth.json';
import frConditions from './locales/fr/conditions.json';
import frInterventions from './locales/fr/interventions.json';
import frRecipes from './locales/fr/recipes.json';
import frUsers from './locales/fr/users.json';
import frDashboard from './locales/fr/dashboard.json';
import frEvidence from './locales/fr/evidence.json';
import frReferences from './locales/fr/references.json';
import frScriptures from './locales/fr/scriptures.json';
import frCareDomains from './locales/fr/careDomains.json';
import frTags from './locales/fr/tags.json';
import frAnalytics from './locales/fr/analytics.json';
import frKnowledgeGraph from './locales/fr/knowledgeGraph.json';
import frAiGenerator from './locales/fr/aiGenerator.json';
import frImport from './locales/fr/import.json';
import frBible from './locales/fr/bible.json';
import frProfile from './locales/fr/profile.json';
import frSearch from './locales/fr/search.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    conditions: enConditions,
    interventions: enInterventions,
    recipes: enRecipes,
    users: enUsers,
    dashboard: enDashboard,
    evidence: enEvidence,
    references: enReferences,
    scriptures: enScriptures,
    careDomains: enCareDomains,
    tags: enTags,
    analytics: enAnalytics,
    knowledgeGraph: enKnowledgeGraph,
    aiGenerator: enAiGenerator,
    import: enImport,
    bible: enBible,
    profile: enProfile,
    search: enSearch,
  },
  fr: {
    common: frCommon,
    navigation: frNavigation,
    auth: frAuth,
    conditions: frConditions,
    interventions: frInterventions,
    recipes: frRecipes,
    users: frUsers,
    dashboard: frDashboard,
    evidence: frEvidence,
    references: frReferences,
    scriptures: frScriptures,
    careDomains: frCareDomains,
    tags: frTags,
    analytics: frAnalytics,
    knowledgeGraph: frKnowledgeGraph,
    aiGenerator: frAiGenerator,
    import: frImport,
    bible: frBible,
    profile: frProfile,
    search: frSearch,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'navigation',
      'auth',
      'conditions',
      'interventions',
      'recipes',
      'users',
      'dashboard',
      'evidence',
      'references',
      'scriptures',
      'careDomains',
      'tags',
      'analytics',
      'knowledgeGraph',
      'aiGenerator',
      'import',
      'bible',
      'profile',
      'search',
    ],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
