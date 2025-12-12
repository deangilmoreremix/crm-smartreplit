import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import FileUpload from '../shared/FileUpload';
import AIToolContent from '../shared/AIToolContent';
import { MessageSquare, Upload } from 'lucide-react';

const MeetingSummaryContent: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const summaryResult = await edgeFunctionService.generateMeetingSummary(transcript);
      setResult(summaryResult);
    } catch (err) {
      console.error('Error generating meeting summary:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while summarizing the meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(newFiles);
    setIsUploading(true);
    
    // For analysis purposes, we'll just handle text files directly
    // In a real implementation, we might use a transcription service for audio files
    if (newFiles.length > 0) {
      const file = newFiles[0];
      
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setTranscript(content || '');
          setIsUploading(false);
        };
        reader.readAsText(file);
      } else {
        setTimeout(() => {
          setIsUploading(false);
          setError('For this analysis, only text files can be processed directly. In a production environment, audio and video files would be transcribed via a service like Whisper API.');
        }, 1500);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div className="flex items-start">
          <MessageSquare className="text-purple-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-purple-800">Meeting Summarizer</h3>
            <p className="text-sm text-purple-700 mt-1">
              Transform meeting transcripts into concise, actionable summaries. Identify key points, decisions made, and action items in seconds.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Summarizing meeting transcript..."
        resultTitle="Meeting Summary"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Transcript
            </label>
            <textarea
              id="transcript"
              rows={10}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste meeting transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            ></textarea>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Or upload a transcript file:
            </p>
            <FileUpload 
              fileType="any"
              onFilesAdded={handleFilesAdded}
              isUploading={isUploading}
              accept={{
                'text/plain': ['.txt'],
                'audio/mpeg': ['.mp3'],
                'audio/wav': ['.wav'],
                'video/mp4': ['.mp4'],
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports text files. Audio/video transcription requires additional services.
            </p>
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-gray-600">
              <Upload className="inline h-4 w-4 mr-1 text-gray-500" />
              Max size: 25MB
            </p>
            <button
              type="submit"
              disabled={isLoading || transcript.trim() === '' || isUploading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
            >
              Summarize Meeting
            </button>
          </div>
        </form>
      </AIToolContent>
    </div>
  );
};

export default MeetingSummaryContent;