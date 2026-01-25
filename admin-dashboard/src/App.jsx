import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

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

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
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

            {/* Content Tags */}
            <Route path="tags" element={<ContentTags />} />

            {/* Users */}
            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/:id/edit" element={<UserForm />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />

            {/* Search */}
            <Route path="search" element={<Search />} />

            {/* Analytics */}
            <Route path="analytics" element={<Analytics />} />

            {/* Import */}
            <Route path="import" element={<Import />} />

            {/* AI Content Generator */}
            <Route path="ai-generator" element={<AiContentGenerator />} />

            {/* Bible Explorer */}
            <Route path="bible" element={<BibleExplorer />} />
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
