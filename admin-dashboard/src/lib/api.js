import axios from 'axios';
import { toast } from './swal';

// Validate required environment variables in production
const validateEnvVars = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  if (import.meta.env.PROD && !apiUrl) {
    throw new Error(
      'VITE_API_BASE_URL environment variable is required in production. ' +
      'Please set it in your .env file or deployment configuration.'
    );
  }

  return apiUrl || 'http://localhost:8000/api/v1';
};

const API_BASE_URL = validateEnvVars();

// Export API_BASE_URL for components that need direct URL access (e.g., file downloads)
export const getApiBaseUrl = () => API_BASE_URL.replace('/api/v1', '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler for API responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        break;

      case 403:
        // Forbidden - user doesn't have permission
        toast.error(data?.message || 'You do not have permission to perform this action.');
        break;

      case 404:
        // Not found - don't show generic toast, let component handle it
        break;

      case 422:
        // Validation error - show first error message
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
        } else if (data?.message) {
          toast.error(data.message);
        }
        break;

      case 429:
        // Rate limited
        toast.warning('Too many requests. Please wait a moment and try again.');
        break;

      case 500:
      case 502:
      case 503:
        // Server errors
        toast.error('Server error. Please try again later.');
        break;

      default:
        // Other errors - show message if available
        if (data?.message) {
          toast.error(data.message);
        }
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
  conditionComplete: (id) => `/conditions/${id}/complete`, // All related data in one request
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
  updateConditionIntervention: (conditionId, interventionId) =>
    `/admin/conditions/${conditionId}/interventions/${interventionId}`,
  reorderConditionInterventions: (conditionId) =>
    `/admin/conditions/${conditionId}/interventions/reorder`,
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
  exportRecipePdf: (id) => `/export/recipes/${id}/pdf`,
  exportEvidenceCsv: '/export/evidence/csv',
  exportReferencesCsv: '/export/references/csv',

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

  // Infographic Generation
  infographicsStatus: '/admin/infographics/status',
  conditionInfographicsGenerate: (id) => `/admin/conditions/${id}/infographics/generate`,
  conditionInfographicsStatus: (id) => `/admin/conditions/${id}/infographics/status`,
  conditionInfographics: (id) => `/admin/conditions/${id}/infographics`,
  infographicRetry: (id) => `/admin/infographics/${id}/retry`,

  // Condition Media
  conditionMedia: (id) => `/conditions/${id}/media`,
  conditionMediaAdmin: (id) => `/admin/conditions/${id}/media`,
  conditionMediaItem: (conditionId, mediaId) => `/admin/conditions/${conditionId}/media/${mediaId}`,
  conditionMediaReorder: (id) => `/admin/conditions/${id}/media/reorder`,

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
