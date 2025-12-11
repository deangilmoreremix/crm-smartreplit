import React, { useState, useEffect } from 'react';
import { Music, Mic, RefreshCw, Trash2, Edit, Plus, Save, Volume2, X } from 'lucide-react';

interface VoiceProfile {
  id: string;
  name: string;
  voice_id: string;
  settings?: any;
  created_at?: string;
  user_id?: string;
}

const VOICE_OPTIONS = [
  { id: 'voice-1', name: 'Professional Male' },
  { id: 'voice-2', name: 'Professional Female' },
  { id: 'voice-3', name: 'Casual Male' },
  { id: 'voice-4', name: 'Casual Female' },
  { id: 'voice-5', name: 'Enthusiastic Male' },
  { id: 'voice-6', name: 'Enthusiastic Female' },
  { id: 'voice-7', name: 'Serious Male' },
  { id: 'voice-8', name: 'Serious Female' },
];

const VoiceProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VoiceProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formVoiceId, setFormVoiceId] = useState('');
  const [formSettings, setFormSettings] = useState<any>({
    pitch: 1,
    speed: 1,
    volume: 1
  });
  
  // Mock data initialization
  useEffect(() => {
    const mockProfiles: VoiceProfile[] = [
      {
        id: '1',
        name: 'Default Business Voice',
        voice_id: 'voice-2',
        settings: { pitch: 1, speed: 1, volume: 1 },
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Casual Presentation',
        voice_id: 'voice-4',
        settings: { pitch: 1.1, speed: 0.9, volume: 1 },
        created_at: new Date().toISOString(),
      }
    ];
    setProfiles(mockProfiles);
  }, []);
  
  useEffect(() => {
    if (editingProfile) {
      setFormName(editingProfile.name);
      setFormVoiceId(editingProfile.voice_id);
      setFormSettings(editingProfile.settings || { pitch: 1, speed: 1, volume: 1 });
    } else {
      resetForm();
    }
  }, [editingProfile]);
  
  const loadVoiceProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would fetch from API
      // Using mock data from useEffect
    } catch (err) {
      console.error("Error loading voice profiles:", err);
      setError('Failed to load voice profiles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormName('');
    setFormVoiceId('voice-1');
    setFormSettings({ pitch: 1, speed: 1, volume: 1 });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formVoiceId) return;
    
    setIsSubmitting(true);
    try {
      if (editingProfile) {
        // Update existing profile
        const updatedProfile = {
          ...editingProfile,
          name: formName,
          voice_id: formVoiceId,
          settings: formSettings
        };
        setProfiles(profiles.map(p => p.id === editingProfile.id ? updatedProfile : p));
        setEditingProfile(null);
      } else {
        // Create new profile
        const newProfile: VoiceProfile = {
          id: Date.now().toString(),
          name: formName,
          voice_id: formVoiceId,
          settings: formSettings,
          created_at: new Date().toISOString(),
        };
        setProfiles([...profiles, newProfile]);
      }
      
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error("Error saving voice profile:", err);
      setError('Failed to save voice profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this voice profile?')) return;
    
    setIsDeleting(id);
    try {
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting voice profile:", err);
      setError('Failed to delete voice profile');
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleEdit = (profile: VoiceProfile) => {
    setEditingProfile(profile);
    setShowAddForm(true);
  };
  
  const playPreview = (profileId: string) => {
    if (playingAudio === profileId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(profileId);
      // Simulate audio playback
      setTimeout(() => {
        setPlayingAudio(null);
      }, 3000);
    }
  };
  
  const getVoiceName = (voiceId: string) => {
    return VOICE_OPTIONS.find(option => option.id === voiceId)?.name || 'Unknown Voice';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Profiles</h1>
          <p className="text-gray-600 mt-1">Manage voice settings and preferences for your content</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => {
              setEditingProfile(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Add Profile
          </button>
        </div>
      </header>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Add/Edit Profile Form */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingProfile ? 'Edit Voice Profile' : 'Add New Voice Profile'}
            </h2>
            <button 
              onClick={() => {
                setShowAddForm(false);
                setEditingProfile(null);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter profile name"
                />
              </div>
              
              <div>
                <label htmlFor="voiceType" className="block text-sm font-medium text-gray-700 mb-1">
                  Voice Type
                </label>
                <select
                  id="voiceType"
                  value={formVoiceId}
                  onChange={(e) => setFormVoiceId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {VOICE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-1">
                  Pitch: {formSettings.pitch}
                </label>
                <input
                  type="range"
                  id="pitch"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={formSettings.pitch}
                  onChange={(e) => setFormSettings({
                    ...formSettings,
                    pitch: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">
                  Speed: {formSettings.speed}
                </label>
                <input
                  type="range"
                  id="speed"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={formSettings.speed}
                  onChange={(e) => setFormSettings({
                    ...formSettings,
                    speed: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
                  Volume: {formSettings.volume}
                </label>
                <input
                  type="range"
                  id="volume"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formSettings.volume}
                  onChange={(e) => setFormSettings({
                    ...formSettings,
                    volume: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProfile(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formName}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (editingProfile ? 'Update Profile' : 'Create Profile')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading profiles...</span>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Mic size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No voice profiles</h3>
          <p className="text-gray-500 mb-4">Create your first voice profile to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={18} className="mr-1" />
            Add Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <Mic size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{profile.name}</h3>
                    <p className="text-sm text-gray-500">{getVoiceName(profile.voice_id)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => playPreview(profile.id)}
                    disabled={playingAudio !== null}
                    className="text-gray-400 hover:text-blue-500 disabled:opacity-50"
                    title="Preview voice"
                  >
                    {playingAudio === profile.id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(profile)}
                    className="text-gray-400 hover:text-blue-500"
                    title="Edit profile"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    disabled={isDeleting === profile.id}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    title="Delete profile"
                  >
                    {isDeleting === profile.id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
              
              {profile.settings && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pitch:</span>
                    <span className="font-medium">{profile.settings.pitch}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Speed:</span>
                    <span className="font-medium">{profile.settings.speed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Volume:</span>
                    <span className="font-medium">{profile.settings.volume}</span>
                  </div>
                </div>
              )}
              
              {profile.created_at && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceProfiles;