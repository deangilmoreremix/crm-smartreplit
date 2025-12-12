import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import FileUpload from '../shared/FileUpload';
import AIToolContent from '../shared/AIToolContent';
import { Mail } from 'lucide-react';

const EmailAnalysisContent: React.FC = () => {
  const [emailText, setEmailText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailText.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const analysisResult = await edgeFunctionService.analyzeCustomerEmail(emailText);
      setResult(analysisResult);
    } catch (err) {
      console.error('Error analyzing email:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(newFiles);
    
    // For analysis purposes, we'll just handle text files directly
    // In a real implementation, we might process the file on the server
    if (newFiles.length > 0) {
      const file = newFiles[0];
      
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setEmailText(content || '');
        };
        reader.readAsText(file);
      } else {
        setError('Only text files can be processed directly. Other file types would be processed via the server in a production environment.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Mail className="text-blue-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-blue-800">Email Analysis Tool</h3>
            <p className="text-sm text-blue-700 mt-1">
              Extract key information, sentiment, and action items from customer emails. Helps you prioritize responses and identify critical requests.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Analyzing email content..."
        resultTitle="Email Analysis Results"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email-content" className="block text-sm font-medium text-gray-700 mb-2">
              Email Content
            </label>
            <textarea
              id="email-content"
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste customer email here..."
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
            ></textarea>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Or upload an email file:
            </p>
            <FileUpload 
              fileType="document"
              onFilesAdded={handleFilesAdded}
              accept={{
                'text/plain': ['.txt', '.eml'],
                'message/rfc822': ['.eml'],
              }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || emailText.trim() === ''}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Email
            </button>
          </div>
        </form>
      </AIToolContent>
    </div>
  );
};

export default EmailAnalysisContent;