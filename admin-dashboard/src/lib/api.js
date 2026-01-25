import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const apiEndpoints = {
  // Auth
  login: '/login',
  logout: '/logout',
  user: '/user',
  updateProfile: '/profile',
  updatePassword: '/password',

  // Global Search
  search: '/search',

  // Care Domains
  careDomains: '/care-domains',
  careDomainsAdmin: '/admin/care-domains',

  // Conditions
  conditions: '/conditions',
  conditionsAdmin: '/admin/conditions',
  conditionSections: (id) => `/conditions/${id}/sections`,
  conditionInterventions: (id) => `/conditions/${id}/interventions`,
  conditionScriptures: (id) => `/conditions/${id}/scriptures`,
  conditionRecipes: (id) => `/conditions/${id}/recipes`,
  conditionEgwReferences: (id) => `/conditions/${id}/egw-references`,

  // Interventions
  interventions: '/interventions',
  interventionsAdmin: '/admin/interventions',
  interventionEvidence: (id) => `/interventions/${id}/evidence`,
  interventionConditions: (id) => `/interventions/${id}/conditions`,
  interventionMedia: (id) => `/interventions/${id}/media`,
  interventionMediaAdmin: (id) => `/admin/interventions/${id}/media`,
  interventionMediaReorder: (id) => `/admin/interventions/${id}/media/reorder`,
  interventionMediaItem: (interventionId, mediaId) => `/admin/interventions/${interventionId}/media/${mediaId}`,

  // Evidence & References
  evidenceEntries: '/evidence-entries',
  evidenceEntriesAdmin: '/admin/evidence-entries',
  references: '/references',
  referencesAdmin: '/admin/references',

  // Scriptures
  scriptures: '/scriptures',
  scripturesAdmin: '/admin/scriptures',

  // EGW References
  egwReferences: '/egw-references',
  egwReferencesAdmin: '/admin/egw-references',
  egwReferencesBooks: '/egw-references-books',
  egwReferencesTopics: '/egw-references-topics',
  egwReferencesAbbreviations: '/egw-references-abbreviations',

  // Recipes
  recipes: '/recipes',
  recipesAdmin: '/admin/recipes',

  // Content Tags
  contentTags: '/content-tags',
  contentTagsAdmin: '/admin/content-tags',

  // Condition Sections
  conditionSectionsAdmin: '/admin/condition-sections',

  // Relationships
  attachConditionIntervention: (conditionId, interventionId) =>
    `/admin/conditions/${conditionId}/interventions/${interventionId}`,
  attachConditionScripture: (conditionId, scriptureId) =>
    `/admin/conditions/${conditionId}/scriptures/${scriptureId}`,
  attachConditionRecipe: (conditionId, recipeId) =>
    `/admin/conditions/${conditionId}/recipes/${recipeId}`,
  attachConditionEgwReference: (conditionId, egwReferenceId) =>
    `/admin/conditions/${conditionId}/egw-references/${egwReferenceId}`,

  // Import
  importConditions: '/admin/import/conditions',
  importInterventions: '/admin/import/interventions',
  importTemplates: '/admin/import/templates',

  // Export
  exportConditionPdf: (id) => `/export/conditions/${id}/pdf`,
  exportConditionsSummaryPdf: '/export/conditions/summary/pdf',

  // User Management
  users: '/admin/users',
  userToggleActive: (id) => `/admin/users/${id}/toggle-active`,
  userRestore: (id) => `/admin/users/${id}/restore`,

  // AI Suggestions
  aiSuggestScriptures: '/admin/ai/suggest-scriptures',
  aiSuggestEgwReferences: '/admin/ai/suggest-egw-references',

  // AI Content Generator
  aiStatus: '/admin/ai/status',
  aiGenerateDraft: '/admin/ai/generate-draft',
  aiStructureContent: '/admin/ai/structure-content',
  aiImportContent: '/admin/ai/import-content',

  // Bible Explorer API
  bibleLookup: '/bible/lookup',
  bibleSearch: '/bible/search',
  bibleTranslations: '/bible/translations',
  bibleBibles: '/bible/bibles',
  bibleBooks: '/bible/books',
  bibleChapter: '/bible/chapter',
  bibleDailyVerse: '/bible/daily-verse',
  bibleHealthThemes: '/bible/health-themes',
  bibleHealthTheme: (themeKey) => `/bible/health-themes/${themeKey}`,
  bibleSearchHealth: '/bible/search-health',

  // Analytics
  analyticsOverview: '/admin/analytics/overview',
  analyticsConditionsByCategory: '/admin/analytics/conditions-by-category',
  analyticsInterventionsByDomain: '/admin/analytics/interventions-by-domain',
  analyticsGrowth: '/admin/analytics/growth',
  analyticsUserActivity: '/admin/analytics/user-activity',
  analyticsEvidenceQuality: '/admin/analytics/evidence-quality',
  analyticsContentCompleteness: '/admin/analytics/content-completeness',
  analyticsExport: '/admin/analytics/export',
};
