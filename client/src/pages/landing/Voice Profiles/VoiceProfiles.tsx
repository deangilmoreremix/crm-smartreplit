import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { fetchVoiceProfiles, createVoiceProfile, updateVoiceProfile, deleteVoiceProfile } from '../../services/supabaseClient';
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
  const { user } = useAuthStore();
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
  
  useEffect(() => {
    loadVoiceProfiles();
  }, [user]);
  
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
      const { data, error } = await fetchVoiceProfiles(user?.id);
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Error loading voice profiles:", err);
      setError('Failed to load voice profiles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormName('');
    setFormVoiceId('');
    setFormSettings({
      pitch: 1,
      speed: 1,
      volume: 1
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const profileData = {
        name: formName,
        voice_id: formVoiceId,
        settings: formSettings,
        user_id: user?.id
      };
      
      let result;
      
      if (editingProfile) {
        result = await updateVoiceProfile(editingProfile.id, profileData);
      } else {
        result = await createVoiceProfile(profileData);
      }
      
      if (result.error) throw result.error;
      
      // Reset and reload
      setEditingProfile(null);
      setShowAddForm(false);
      resetForm();
      await loadVoiceProfiles();
      
    } catch (err) {
      console.error("Error saving voice profile:", err);
      setError('Failed to save voice profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteProfile = async (id: string) => {
    if (confirm('Are you sure you want to delete this voice profile?')) {
      setIsDeleting(id);
      try {
        const { error } = await deleteVoiceProfile(id);
        if (error) throw error;
        
        setProfiles(profiles.filter(profile => profile.id !== id));
      } catch (err) {
        console.error("Error deleting voice profile:", err);
        setError('Failed to delete voice profile');
      } finally {
        setIsDeleting(null);
      }
    }
  };
  
  const playAudioSample = (voiceId: string) => {
    // In a real app, we would play an audio sample here
    // For this demo, we'll just toggle the state
    if (playingAudio === voiceId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(voiceId);
    }
  };
  
  const getVoiceName = (voiceId: string) => {
    const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
    return voice ? voice.name : voiceId;
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Profiles</h1>
          <p className="text-gray-600 mt-1">Create and manage voice profiles for content generation</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => {
              setEditingProfile(null);
              setShowAddForm(!showAddForm);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {showAddForm ? (
              <>
                <X size={18} className="mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus size={18} className="mr-1" />
                Add Voice Profile
              </>
            )}
          </button>
        </div>
      </header>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}
      
      {(showAddForm || editingProfile) && (
        <div className="card-modern p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingProfile ? 'Edit Voice Profile' : 'Create New Voice Profile'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Professional Sales Voice"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice Type
              </label>
              <select
                required
                value={formVoiceId}
                onChange={(e) => setFormVoiceId(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a voice type</option>
                {VOICE_OPTIONS.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-4 border rounded-md p-4 bg-gray-50">
              <h3 className="font-medium text-gray-700">Voice Settings</h3>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Pitch: {formSettings.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={formSettings.pitch}
                  onChange={(e) => setFormSettings({...formSettings, pitch: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Speed: {formSettings.speed.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={formSettings.speed}
                  onChange={(e) => setFormSettings({...formSettings, speed: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Volume: {formSettings.volume.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={formSettings.volume}
                  onChange={(e) => setFormSettings({...formSettings, volume: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingProfile(null);
                  setShowAddForm(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 ${
                  isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white py-2 px-4 rounded-md transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="card-modern">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Loading voice profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center">
            <Music size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg mb-1">No voice profiles found</p>
            <p className="text-gray-400 text-sm mb-4">Create your first voice profile to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              <Plus size={18} className="mr-1" />
              Create Voice Profile
            </button>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Your Voice Profiles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {profiles.map(profile => (
                <div key={profile.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white">
                        <Mic size={20} />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{profile.name}</h3>
                        <p className="text-sm text-gray-500">{getVoiceName(profile.voice_id)}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <button
                        onClick={() => setEditingProfile(profile)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={isDeleting === profile.id}
                        className={`p-1 ${isDeleting === profile.id ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}
                      >
                        {isDeleting === profile.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Created: {profile.created_at 
                      ? new Date(profile.created_at).toLocaleDateString() 
                      : 'Unknown date'}
                  </div>
                  
                  {profile.settings && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pitch:</span>
                        <span>{profile.settings.pitch?.toFixed(1) || '1.0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Speed:</span>
                        <span>{profile.settings.speed?.toFixed(1) || '1.0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Volume:</span>
                        <span>{profile.settings.volume?.toFixed(1) || '1.0'}</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => playAudioSample(profile.voice_id)}
                    className="w-full flex items-center justify-center gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
                  >
                    {playingAudio === profile.voice_id ? (
                      <>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-3 bg-blue-600 animate-pulse"></div>
                          <div className="w-1 h-5 bg-blue-600 animate-pulse delay-75"></div>
                          <div className="w-1 h-4 bg-blue-600 animate-pulse delay-150"></div>
                        </div>
                        Playing Sample...
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} />
                        Listen to Sample
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceProfiles;