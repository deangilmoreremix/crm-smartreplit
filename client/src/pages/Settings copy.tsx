import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useApiStore } from '../store/apiStore';
import { Eye, EyeOff, Key, User, Upload, Trash2, Edit, Save, X, RefreshCw } from 'lucide-react';

const Settings: React.FC = () => {
  const { apiKeys, setOpenAiKey, setGeminiKey } = useApiStore();
  const { user } = useAuthStore();
  const { profile, isLoading: profileLoading, error: profileError, fetchProfile, updateProfile, uploadAvatar, deleteAvatar } = useProfileStore();
  
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [openAiInput, setOpenAiInput] = useState(apiKeys.openai || '');
  const [geminiInput, setGeminiInput] = useState(apiKeys.gemini || '');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    jobTitle: '',
    company: '',
    phone: '',
    timezone: '',
    linkedin: '',
    twitter: '',
    website: ''
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const toggleOpenAiVisibility = () => setShowOpenAiKey(!showOpenAiKey);
  const toggleGeminiVisibility = () => setShowGeminiKey(!showGeminiKey);

  const handleOpenAiSave = () => {
    setOpenAiKey(openAiInput);
    alert('OpenAI API key saved successfully!');
  };

  const handleGeminiSave = () => {
    setGeminiKey(geminiInput);
    alert('Gemini API key saved successfully!');
  };
  
  // Load profile data
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        jobTitle: profile.jobTitle || '',
        company: profile.company || '',
        phone: profile.phone || '',
        timezone: profile.timezone || '',
        linkedin: profile.socialLinks?.linkedin || '',
        twitter: profile.socialLinks?.twitter || '',
        website: profile.socialLinks?.website || ''
      });
    }
  }, [profile]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(avatarFile);
      setAvatarFile(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  const handleAvatarDelete = async () => {
    if (window.confirm('Are you sure you want to remove your avatar?')) {
      await deleteAvatar();
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        fullName: profileForm.fullName,
        jobTitle: profileForm.jobTitle,
        company: profileForm.company,
        phone: profileForm.phone,
        timezone: profileForm.timezone,
        socialLinks: {
          linkedin: profileForm.linkedin,
          twitter: profileForm.twitter,
          website: profileForm.website
        }
      });
      
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  
  // List of timezone options
  const timezoneOptions = [
    { value: '', label: 'Select timezone' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your AI CRM platform</p>
      </header>

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <User size={20} className="mr-2 text-gray-500" />
          Profile Settings
        </h2>
        
        {profileLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : profileError ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">
            {profileError}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar section */}
              <div className="md:w-1/3">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.fullName || 'User avatar'} 
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  
                  {isEditingProfile && (
                    <div className="space-y-2 w-full max-w-xs">
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar"
                        className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        <Upload size={16} className="inline-block mr-1" />
                        Select Image
                      </label>
                      
                      {avatarFile && (
                        <button
                          onClick={handleAvatarUpload}
                          disabled={isUploadingAvatar}
                          className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          {isUploadingAvatar ? (
                            <>
                              <RefreshCw size={16} className="mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="mr-1" />
                              Upload Avatar
                            </>
                          )}
                        </button>
                      )}
                      
                      {profile?.avatarUrl && (
                        <button
                          onClick={handleAvatarDelete}
                          className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Remove Avatar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile info section */}
              <div className="md:w-2/3">
                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={profileForm.jobTitle}
                          onChange={(e) => setProfileForm({...profileForm, jobTitle: e.target.value})}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={profileForm.company}
                          onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <select
                          value={profileForm.timezone}
                          onChange={(e) => setProfileForm({...profileForm, timezone: e.target.value})}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {timezoneOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-700 mt-6 mb-3">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          value={profileForm.linkedin}
                          onChange={(e) => setProfileForm({...profileForm, linkedin: e.target.value})}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Twitter
                        </label>
                        <input
                          type="url"
                          value={profileForm.twitter}
                          onChange={(e) => setProfileForm({...profileForm, twitter: e.target.value})}
                          placeholder="https://twitter.com/username"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                          placeholder="https://example.com"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        <X size={16} className="inline mr-1" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Save size={16} className="inline mr-1" />
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-lg text-gray-900">{profile?.fullName || 'User'}</h3>
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center"
                      >
                        <Edit size={14} className="mr-1.5" />
                        Edit Profile
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{profile?.email || user?.email || 'No email'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Job Title</p>
                        <p className="font-medium">{profile?.jobTitle || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Company</p>
                        <p className="font-medium">{profile?.company || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{profile?.phone || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Timezone</p>
                        <p className="font-medium">
                          {profile?.timezone ? 
                            timezoneOptions.find(tz => tz.value === profile.timezone)?.label || profile.timezone :
                            'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    {(profile?.socialLinks?.linkedin || profile?.socialLinks?.twitter || profile?.socialLinks?.website) && (
                      <div className="mt-6">
                        <h3 className="font-medium text-gray-700 mb-3">Social Links</h3>
                        <div className="space-y-2">
                          {profile.socialLinks?.linkedin && (
                            <a 
                              href={profile.socialLinks.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                              </svg>
                              LinkedIn
                            </a>
                          )}
                          
                          {profile.socialLinks?.twitter && (
                            <a 
                              href={profile.socialLinks.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                              Twitter
                            </a>
                          )}
                          
                          {profile.socialLinks?.website && (
                            <a 
                              href={profile.socialLinks.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">API Configuration</h2>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Key size={18} className="mr-2 text-gray-500" />
            <h3 className="text-lg font-medium">OpenAI API Key</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Used for email drafting and sentiment analysis. Get your API key from the{' '}
            <a 
              href="https://platform.openai.com/account/api-keys" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline"
            >
              OpenAI dashboard
            </a>.
          </p>
          
          <div className="flex">
            <div className="relative flex-1">
              <input
                type={showOpenAiKey ? 'text' : 'password'}
                value={openAiInput}
                onChange={(e) => setOpenAiInput(e.target.value)}
                placeholder="sk-..."
                className="w-full p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={toggleOpenAiVisibility}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showOpenAiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleOpenAiSave}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-md transition-colors"
            >
              Save
            </button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <Key size={18} className="mr-2 text-gray-500" />
            <h3 className="text-lg font-medium">Gemini API Key</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Used for follow-up suggestions and task prioritization. Get your API key from the{' '}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>.
          </p>
          
          <div className="flex">
            <div className="relative flex-1">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                placeholder="AI..."
                className="w-full p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={toggleGeminiVisibility}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleGeminiSave}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-md transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="text-gray-600 mb-2">
          <span className="font-medium">Email:</span> {user?.email}
        </p>
        <p className="text-gray-600 mb-2">
          <span className="font-medium">Account Status:</span> {profile?.accountStatus?.charAt(0).toUpperCase() + profile?.accountStatus?.slice(1) || 'Active'}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Member Since:</span> {profile?.createdAt ? profile.createdAt.toLocaleDateString() : new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default Settings;