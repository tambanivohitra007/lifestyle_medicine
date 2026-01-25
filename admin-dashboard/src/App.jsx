import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ShieldX, Home } from 'lucide-react';

// Layout
import { Layout } from './components/layout';

// Features
import { Login } from './features/auth';
import { Dashboard } from './features/dashboard';
import { Analytics } from './features/analytics';
import { Search } from './features/search';
import { Import } from './features/import';
import { Profile } from './features/profile';
import { AiContentGenerator } from './features/ai-generator';

import {
  Conditions,
  ConditionForm,
  ConditionDetail,
  ConditionPreview,
  ConditionSectionForm,
  AttachIntervention,
  AttachScripture,
  AttachRecipe,
  AttachEgwReference,
} from './features/conditions';

import { CareDomains, CareDomainForm } from './features/care-domains';
import { Interventions, InterventionForm, InterventionDetail } from './features/interventions';
import { Evidence, EvidenceForm } from './features/evidence';
import { References, ReferenceForm } from './features/references';
import { Scriptures, ScriptureForm } from './features/scriptures';
import { Recipes, RecipeForm, RecipeDetail } from './features/recipes';
import { EgwReferences, EgwReferenceForm } from './features/egw-references';
import { ContentTags } from './features/content-tags';
import { Users, UserForm } from './features/users';
import BibleExplorer from './features/bible/BibleExplorer';
import { KnowledgeGraphPage, FullGraphPage } from './features/knowledge-graph';

// Forbidden Page Component
const Forbidden = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        You don't have permission to access this page.
        {user?.role && (
          <span className="block mt-2 text-sm">
            Your role: <span className="font-medium capitalize">{user.role}</span>
          </span>
        )}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Home className="w-4 h-4" />
        Go to Dashboard
      </Link>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Role-Protected Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    return <Forbidden />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Full-screen Knowledge Graph Routes (outside Layout) */}
          <Route
            path="/knowledge-graph"
            element={
              <ProtectedRoute>
                <FullGraphPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-graph/:type/:id"
            element={
              <ProtectedRoute>
                <KnowledgeGraphPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Conditions */}
            <Route path="conditions" element={<Conditions />} />
            <Route path="conditions/new" element={<ConditionForm />} />
            <Route path="conditions/:id" element={<ConditionDetail />} />
            <Route path="conditions/:id/edit" element={<ConditionForm />} />
            <Route path="conditions/:id/preview" element={<ConditionPreview />} />
            <Route path="conditions/:id/sections/new" element={<ConditionSectionForm />} />
            <Route path="conditions/:id/sections/:sectionId/edit" element={<ConditionSectionForm />} />
            <Route path="conditions/:id/interventions/attach" element={<AttachIntervention />} />
            <Route path="conditions/:id/scriptures/attach" element={<AttachScripture />} />
            <Route path="conditions/:id/recipes/attach" element={<AttachRecipe />} />
            <Route path="conditions/:id/egw-references/attach" element={<AttachEgwReference />} />

            {/* Care Domains */}
            <Route path="care-domains" element={<CareDomains />} />
            <Route path="care-domains/new" element={<CareDomainForm />} />
            <Route path="care-domains/:id/edit" element={<CareDomainForm />} />

            {/* Interventions */}
            <Route path="interventions" element={<Interventions />} />
            <Route path="interventions/new" element={<InterventionForm />} />
            <Route path="interventions/:id" element={<InterventionDetail />} />
            <Route path="interventions/:id/edit" element={<InterventionForm />} />

            {/* Evidence */}
            <Route path="evidence" element={<Evidence />} />
            <Route path="evidence/new" element={<EvidenceForm />} />
            <Route path="evidence/:id/edit" element={<EvidenceForm />} />

            {/* References */}
            <Route path="references" element={<References />} />
            <Route path="references/new" element={<ReferenceForm />} />
            <Route path="references/:id/edit" element={<ReferenceForm />} />

            {/* Scriptures */}
            <Route path="scriptures" element={<Scriptures />} />
            <Route path="scriptures/new" element={<ScriptureForm />} />
            <Route path="scriptures/:id/edit" element={<ScriptureForm />} />

            {/* Recipes */}
            <Route path="recipes" element={<Recipes />} />
            <Route path="recipes/new" element={<RecipeForm />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="recipes/:id/edit" element={<RecipeForm />} />

            {/* EGW References */}
            <Route path="egw-references" element={<EgwReferences />} />
            <Route path="egw-references/new" element={<EgwReferenceForm />} />
            <Route path="egw-references/:id/edit" element={<EgwReferenceForm />} />

            {/* Content Tags - Admin only */}
            <Route path="tags" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><ContentTags /></RoleRoute>} />

            {/* Users - Admin only */}
            <Route path="users" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><Users /></RoleRoute>} />
            <Route path="users/new" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><UserForm /></RoleRoute>} />
            <Route path="users/:id/edit" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><UserForm /></RoleRoute>} />

            {/* Profile - All authenticated users */}
            <Route path="profile" element={<Profile />} />

            {/* Search - All authenticated users */}
            <Route path="search" element={<Search />} />

            {/* Analytics - Admin only */}
            <Route path="analytics" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><Analytics /></RoleRoute>} />

            {/* Import - Admin only */}
            <Route path="import" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><Import /></RoleRoute>} />

            {/* AI Content Generator - Admin only */}
            <Route path="ai-generator" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><AiContentGenerator /></RoleRoute>} />

            {/* Bible Explorer - All authenticated users */}
            <Route path="bible" element={<BibleExplorer />} />

            {/* Forbidden page */}
            <Route path="forbidden" element={<Forbidden />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
