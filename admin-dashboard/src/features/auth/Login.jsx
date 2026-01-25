import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Leaf, Heart, Activity, Shield } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const pillars = [
    { icon: Leaf, label: 'Nutrition' },
    { icon: Activity, label: 'Movement' },
    { icon: Heart, label: 'Wellness' },
    { icon: Shield, label: 'Prevention' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-secondary-900/95" />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top - Logo */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <img src="/lifestyle.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Lifestyle Medicine</h2>
                <p className="text-white/70 text-sm">Knowledge Platform</p>
              </div>
            </div>
          </div>

          {/* Middle - Tagline */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                Transforming Health<br />
                <span className="text-primary-300">Through Lifestyle</span>
              </h1>
              <p className="text-xl text-white/80 max-w-md">
                Evidence-based medicine combined with whole-person care for lasting wellness.
              </p>
            </div>

            {/* Core Values */}
            <div className="flex flex-wrap gap-3">
              {['Affordable', 'Comprehensive', 'Personalized', 'Accessible'].map((value) => (
                <span
                  key={value}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20"
                >
                  {value}
                </span>
              ))}
            </div>

            {/* Pillars */}
            <div className="grid grid-cols-4 gap-4 pt-4">
              {pillars.map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                    <Icon className="w-6 h-6 text-primary-300" />
                  </div>
                  <span className="text-xs text-white/70">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom - Footer */}
          <div className="text-white/50 text-sm">
            <p>Family & Lifestyle Medicine Lansing</p>
            <p className="mt-1">Mon-Thu 8:00 AM - 5:00 PM</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg shadow-primary-600/30 mb-4">
              <img src="/lifestyle.png" alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Lifestyle Medicine</h1>
            <p className="text-gray-500 text-sm mt-1">Knowledge Platform</p>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Mode Notice - Only shown in development */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Development Mode
              </p>
              <div className="text-xs text-amber-700 space-y-1">
                <p><span className="font-medium">Email:</span> admin@example.com</p>
                <p><span className="font-medium">Password:</span> password</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Family & Lifestyle Medicine Lansing
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
