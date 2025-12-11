import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Video, Zap, Download, Trash2, Plus, Play, Pause, Square } from 'lucide-react';
import { demoRecorder, RecordingSession, DemoFeature } from '../services/demo-recorder.service';

const DemoRecorder: React.FC = () => {
  const { isDark } = useTheme();
  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [features, setFeatures] = useState<DemoFeature[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [format, setFormat] = useState<'gif' | 'mp4' | 'webm'>('webm');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');

  const handleStartRecording = async () => {
    if (!sessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    try {
      const session = await demoRecorder.startRecording(sessionName, format);
      setRecordingSession(session);
      setIsRecording(true);
      setSessionName('');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Make sure you granted screen capture permission.');
    }
  };

  const handleStopRecording = () => {
    const stopped = demoRecorder.stopRecording();
    setRecordingSession(stopped);
    setIsRecording(false);
  };

  const handlePauseRecording = () => {
    demoRecorder.pauseRecording();
    setIsRecording(false);
  };

  const handleResumeRecording = () => {
    demoRecorder.resumeRecording();
    setIsRecording(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) {
      alert('Please enter a feature name');
      return;
    }

    const feature = demoRecorder.registerFeature({
      name: newFeatureName,
      description: newFeatureDescription,
      recordingId: recordingSession?.id || '',
      autoTrigger: false,
      duration: 0
    });

    setFeatures([...features, feature]);
    setNewFeatureName('');
    setNewFeatureDescription('');
  };

  const handleDeleteFeature = (featureId: string) => {
    demoRecorder.deleteFeature(featureId);
    setFeatures(features.filter(f => f.id !== featureId));
  };

  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Video className="w-8 h-8 text-purple-600" />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Demo Recorder
          </h1>
        </div>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Record and generate GIFs/videos of your application features for demos
        </p>
      </div>

      {/* Recording Controls */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recording Session
        </h2>

        {!isRecording && !recordingSession ? (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., User Login Flow"
                className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                data-testid="input-session-name"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Output Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'gif' | 'mp4' | 'webm')}
                className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                data-testid="select-format"
              >
                <option value="webm">WebM Video</option>
                <option value="mp4">MP4 Video</option>
                <option value="gif">Animated GIF</option>
              </select>
            </div>

            <button
              onClick={handleStartRecording}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
              data-testid="button-start-recording"
            >
              <Play className="w-4 h-4" />
              <span>Start Recording</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border`}>
              <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {isRecording ? '🔴 Recording in progress...' : '⏸️ Recording paused'}
              </p>
              {recordingSession && (
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Session: {recordingSession.name} | Frames: {recordingSession.frames.length}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              {isRecording ? (
                <>
                  <button
                    onClick={handlePauseRecording}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                    data-testid="button-pause-recording"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                    data-testid="button-stop-recording"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleResumeRecording}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                    data-testid="button-resume-recording"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
                    data-testid="button-stop-recording-paused"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feature Management */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Registered Features
        </h2>

        <div className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              placeholder="Feature name"
              className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              data-testid="input-feature-name"
            />
            <textarea
              value={newFeatureDescription}
              onChange={(e) => setNewFeatureDescription(e.target.value)}
              placeholder="Feature description"
              className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              rows={2}
              data-testid="textarea-feature-description"
            />
            <button
              onClick={handleAddFeature}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
              data-testid="button-add-feature"
            >
              <Plus className="w-4 h-4" />
              <span>Add Feature</span>
            </button>
          </div>

          {features.length > 0 && (
            <div className="grid gap-4 mt-6">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  data-testid={`card-feature-${feature.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {feature.name}
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          {feature.autoTrigger ? 'Auto-trigger enabled' : 'Manual trigger'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      data-testid={`button-delete-feature-${feature.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {features.length === 0 && (
            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No features registered yet. Add one above.
            </p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
        <h3 className={`font-medium mb-2 ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
          💡 How to use
        </h3>
        <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
          <li>• Start recording and interact with features in your app</li>
          <li>• Register features to mark important sections of your demo</li>
          <li>• Stop recording to export as GIF or video</li>
          <li>• Use generated files for documentation or marketing</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoRecorder;
