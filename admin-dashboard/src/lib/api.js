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

  // Interventions
  interventions: '/interventions',
  interventionsAdmin: '/admin/interventions',
  interventionEvidence: (id) => `/interventions/${id}/evidence`,
  interventionConditions: (id) => `/interventions/${id}/conditions`,

  // Evidence & References
  evidenceEntries: '/evidence-entries',
  evidenceEntriesAdmin: '/admin/evidence-entries',
  references: '/references',
  referencesAdmin: '/admin/references',

  // Scriptures
  scriptures: '/scriptures',
  scripturesAdmin: '/admin/scriptures',

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
};
