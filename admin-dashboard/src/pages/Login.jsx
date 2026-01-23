import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Lock, Mail } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(apiEndpoints.login, { email, password });
      const { token, user } = response.data;

      login(token, user);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.errors?.email) {
        setError(err.response.data.errors.email[0]);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="inline-flex items-center justify-center w-24 sm:w-32 h-24 sm:h-32 mb-4">
                        <img src="/lifestyle.png" alt="Logo"  />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Welcome Back
                      </h1>
                      <p className="text-gray-600 text-sm sm:text-base">
                        Lifestyle Medicine Knowledge Platform
                      </p>
                    </div>

                {/* Login Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email */}
            <div>
              <label className="label flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="label flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> admin@example.com
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Password:</span> password
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
          Family & Lifestyle Medicine Lansing
        </p>
      </div>
    </div>
  );
};

export default Login;
