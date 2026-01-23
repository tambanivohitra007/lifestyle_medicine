import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Conditions from './pages/Conditions';
import ConditionForm from './pages/ConditionForm';
import ConditionDetail from './pages/ConditionDetail';
import CareDomains from './pages/CareDomains';
import CareDomainForm from './pages/CareDomainForm';
import Interventions from './pages/Interventions';
import InterventionForm from './pages/InterventionForm';
import InterventionDetail from './pages/InterventionDetail';
import Evidence from './pages/Evidence';
import EvidenceForm from './pages/EvidenceForm';
import References from './pages/References';
import ReferenceForm from './pages/ReferenceForm';
import Scriptures from './pages/Scriptures';
import ScriptureForm from './pages/ScriptureForm';
import Recipes from './pages/Recipes';
import RecipeForm from './pages/RecipeForm';
import ContentTags from './pages/ContentTags';

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
            <Route path="recipes/:id/edit" element={<RecipeForm />} />

            {/* Content Tags */}
            <Route path="tags" element={<ContentTags />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
