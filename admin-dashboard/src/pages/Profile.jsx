import { useState } from 'react';
import { User, Mail, Lock, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { apiEndpoints } from '../lib/api';

const Profile = () => {
  const { user, updateUser } = useAuth();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: null }));
    }
    setProfileSuccess('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
    setPasswordSuccess('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});
    setProfileSuccess('');

    try {
      const response = await api.put(apiEndpoints.updateProfile, profileData);
      const updatedUser = response.data.user;

      // Update the auth context with new user data
      updateUser(updatedUser);

      setProfileSuccess('Profile updated successfully');
    } catch (error) {
      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setProfileErrors({ general: error.response.data.message });
      } else {
        setProfileErrors({ general: 'Failed to update profile' });
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});
    setPasswordSuccess('');

    // Client-side validation
    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordErrors({ password_confirmation: 'Passwords do not match' });
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put(apiEndpoints.updatePassword, passwordData);
      setPasswordSuccess('Password updated successfully');
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (error) {
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setPasswordErrors({ general: error.response.data.message });
      } else {
        setPasswordErrors({ general: 'Failed to update password' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderError = (field, errors) => {
    const error = errors[field];
    if (!error) return null;
    return (
      <p className="mt-1 text-sm text-red-500">
        {Array.isArray(error) ? error[0] : error}
      </p>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Manage your account information and password
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Profile Information */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary-100">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-600">Update your name and email address</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* General Error */}
            {profileErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {profileErrors.general}
              </div>
            )}

            {/* Success Message */}
            {profileSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {profileSuccess}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className={`input-field pl-10 ${profileErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Your name"
                />
              </div>
              {renderError('name', profileErrors)}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className={`input-field pl-10 ${profileErrors.email ? 'border-red-500' : ''}`}
                  placeholder="your@email.com"
                />
              </div>
              {renderError('email', profileErrors)}
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {profileLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-secondary-100">
              <Lock className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {/* General Error */}
            {passwordErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {passwordErrors.general}
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="label">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="current_password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className={`input-field pl-10 ${passwordErrors.current_password ? 'border-red-500' : ''}`}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              {renderError('current_password', passwordErrors)}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="password" className="label">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  className={`input-field pl-10 ${passwordErrors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              {renderError('password', passwordErrors)}
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="password_confirmation" className="label">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="password_confirmation"
                  name="password_confirmation"
                  value={passwordData.password_confirmation}
                  onChange={handlePasswordChange}
                  className={`input-field pl-10 ${passwordErrors.password_confirmation ? 'border-red-500' : ''}`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              {renderError('password_confirmation', passwordErrors)}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {passwordLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
