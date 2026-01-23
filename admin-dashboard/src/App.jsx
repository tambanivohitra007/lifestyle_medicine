import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Conditions from './pages/Conditions';
import ConditionForm from './pages/ConditionForm';
import ConditionDetail from './pages/ConditionDetail';

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

// Placeholder components for other pages
const ComingSoon = ({ title }) => (
  <div className="card text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-600">This page is coming soon!</p>
  </div>
);

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
            <Route path="conditions" element={<Conditions />} />
            <Route path="conditions/new" element={<ConditionForm />} />
            <Route path="conditions/:id" element={<ConditionDetail />} />
            <Route path="conditions/:id/edit" element={<ConditionForm />} />
            <Route
              path="interventions"
              element={<ComingSoon title="Interventions" />}
            />
            <Route
              path="care-domains"
              element={<ComingSoon title="Care Domains" />}
            />
            <Route path="evidence" element={<ComingSoon title="Evidence" />} />
            <Route
              path="references"
              element={<ComingSoon title="References" />}
            />
            <Route
              path="scriptures"
              element={<ComingSoon title="Scriptures" />}
            />
            <Route path="recipes" element={<ComingSoon title="Recipes" />} />
            <Route path="tags" element={<ComingSoon title="Content Tags" />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
