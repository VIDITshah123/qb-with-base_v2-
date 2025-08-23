import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiMail, FiSave, FiEdit2, FiX, FiCheck, FiLock, FiAlertCircle } from 'react-icons/fi';
import authService from '../../services/authService';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm();

  // Reset form when user data changes
  useEffect(() => {
    resetProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
  }, [user, resetProfile]);

  // Handle profile picture change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle profile update
  const onSubmitProfile = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      if (avatar) {
        formData.append('avatar', avatar);
      }

      // In a real app, you would call your API here
      // const updatedUser = await authService.updateProfile(formData);
      // updateUser(updatedUser);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatar(null);
      setAvatarPreview('');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const onSubmitPassword = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // In a real app, you would call your API here
      // await authService.changePassword(
      //   data.currentPassword,
      //   data.newPassword,
      //   data.confirmPassword
      // );
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password updated successfully!');
      setIsEditingPassword(false);
      resetPassword();
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Profile Settings
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => {
              if (isEditing) {
                resetProfile();
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isEditing ? (
              <>
                <FiX className="-ml-1 mr-2 h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <FiEdit2 className="-ml-1 mr-2 h-5 w-5" />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>
      <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Profile Information
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Your personal information and account details.
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FiCheck className="h-5 w-5 text-green-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit(onSubmitProfile)}>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          <img
                            className="h-24 w-24 rounded-full object-cover"
                            src={avatarPreview || (user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName + ' ' + (user?.lastName || ''))}&background=3B82F6&color=fff`)}
                            alt=""
                          />
                          {isEditing && (
                            <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <FiEdit2 className="h-5 w-5" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarChange}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-lg font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Member since {formatDate(user?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First name
                        </label>
                        {isEditing ? (
                          <div className="mt-1">
                            <input
                              type="text"
                              id="firstName"
                              {...registerProfile('firstName', {
                                required: 'First name is required',
                                minLength: { value: 2, message: 'First name must be at least 2 characters' },
                              })}
                              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                                profileErrors.firstName ? 'border-red-300' : ''
                              }`}
                            />
                            {profileErrors.firstName && (
                              <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{user?.firstName}</p>
                        )}
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last name
                        </label>
                        {isEditing ? (
                          <div className="mt-1">
                            <input
                              type="text"
                              id="lastName"
                              {...registerProfile('lastName')}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-900">{user?.lastName || 'Not provided'}</p>
                        )}
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email address
                        </label>
                        {isEditing ? (
                          <div className="mt-1">
                            <input
                              type="email"
                              id="email"
                              {...registerProfile('email', {
                                required: 'Email is required',
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Invalid email address',
                                },
                              })}
                              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                                profileErrors.email ? 'border-red-300' : ''
                              }`}
                              disabled={!user?.isEmailVerified}
                            />
                            {!user?.isEmailVerified && (
                              <p className="mt-1 text-sm text-yellow-600">
                                Please verify your email to change it.
                              </p>
                            )}
                            {profileErrors.email && (
                              <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                            {user?.isEmailVerified ? (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Verified
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                                onClick={() => {
                                  // Add email verification logic here
                                  alert('Verification email sent! Please check your inbox.');
                                }}
                              >
                                Verify Email
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            resetProfile();
                            setIsEditing(false);
                          }}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!isProfileDirty && !avatar}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Change Password
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Update your account password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPassword(!isEditingPassword);
                    if (isEditingPassword) {
                      resetPassword();
                      setError('');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isEditingPassword ? (
                    <>
                      <FiX className="-ml-0.5 mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <FiLock className="-ml-0.5 mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
              
              {isEditingPassword && (
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={handlePasswordSubmit(onSubmitPassword)}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <div className="mt-1">
                          <input
                            id="currentPassword"
                            type="password"
                            {...registerPassword('currentPassword', {
                              required: 'Current password is required',
                              minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                              },
                            })}
                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              passwordErrors.currentPassword ? 'border-red-300' : ''
                            }`}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">
                              {passwordErrors.currentPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <div className="mt-1">
                          <input
                            id="newPassword"
                            type="password"
                            {...registerPassword('newPassword', {
                              required: 'New password is required',
                              minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                              },
                              validate: (value) =>
                                /[A-Z]/.test(value) || 'Must contain at least one uppercase letter',
                            })}
                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              passwordErrors.newPassword ? 'border-red-300' : ''
                            }`}
                          />
                          {passwordErrors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">
                              {passwordErrors.newPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <div className="mt-1">
                          <input
                            id="confirmPassword"
                            type="password"
                            {...registerPassword('confirmPassword', {
                              required: 'Please confirm your password',
                              validate: (value) =>
                                value === watch('newPassword') || 'Passwords do not match',
                            })}
                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                              passwordErrors.confirmPassword ? 'border-red-300' : ''
                            }`}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">
                              {passwordErrors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Account Actions
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Manage your account settings and preferences.
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Delete Account
                      </h4>
                      <p className="text-sm text-gray-500">
                        Permanently delete your account and all of your data.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          // Handle account deletion
                          alert('Account deletion requested. This would trigger account deletion in a real app.');
                        }
                      }}
                    >
                      Delete Account
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Download Data
                      </h4>
                      <p className="text-sm text-gray-500">
                        Download all of your personal data.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        // Handle data export
                        alert('Data export started. You will receive an email when your data is ready to download.');
                      }}
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfilePage;
