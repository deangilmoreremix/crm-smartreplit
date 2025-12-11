import React, { ReactNode, useState } from 'react';
import { Copy, Download, RefreshCw, Eye, FileText } from 'lucide-react';
import { CSVLink } from 'react-csv';

interface AIToolContentProps {
  isLoading: boolean;
  error: string | null;
  result: string | null;
  loadingMessage?: string;
  resultTitle?: string;
  children?: ReactNode;
}

const AIToolContent: React.FC<AIToolContentProps> = ({
  isLoading,
  error,
  result,
  loadingMessage = "Processing your request...",
  resultTitle = "AI-Generated Results",
  children
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const element = document.createElement('a');
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${resultTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePreview = () => {
    if (!result) return;
    const preview = window.open('', '_blank', 'width=800,height=600');
    if (preview) {
      const escaped = result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      preview.document.write(`<!DOCTYPE html><html><head><title>Preview</title></head><body style="font-family:sans-serif;white-space:pre-wrap;padding:1rem;">${escaped}</body></html>`);
      preview.document.close();
    }
  };

  const csvData = result ? result.split('\n').map(line => ({ line })) : [];
  
  return (
    <div className="max-h-[65vh] overflow-y-auto pr-1">
      {children}
      
      {isLoading && (
        <div className="my-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 shadow-sm animate-pulse transition-all duration-300">
          <div className="flex items-center">
            <div className="relative h-12 w-12 mr-4">
              <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
              <div className="relative rounded-full bg-white p-3 flex items-center justify-center">
                <RefreshCw size={24} className="text-blue-500 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-700 text-lg">{loadingMessage}</h3>
              <p className="mt-1 text-blue-600 text-sm">
                This may take a moment as our AI processes your request...
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="my-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-sm">
          <h3 className="text-red-700 font-medium mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error Occurred
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {result && !isLoading && (
        <div className="my-6 overflow-hidden rounded-xl border border-indigo-100 shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            {/* Header section */}
            <div className="flex justify-between items-center p-4 border-b border-indigo-100 bg-white/70 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                {resultTitle}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyToClipboard}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md transition-all ${
                    copySuccess 
                      ? 'bg-green-100 text-green-700 ring-1 ring-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 ring-1 ring-gray-200'
                  }`}
                  title="Copy to clipboard"
                >
                  {copySuccess ? (
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copySuccess ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors ring-1 ring-indigo-200"
                  title="Download as text file"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
                {result && (
                  <CSVLink
                    data={csvData}
                    filename={`${resultTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.csv`}
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors ring-1 ring-indigo-200"
                    title="Download as CSV"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    CSV
                  </CSVLink>
                )}
                <button
                  onClick={handlePreview}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors ring-1 ring-gray-200"
                  title="Preview"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </button>
              </div>
            </div>
            
            {/* Content section with fancy styling */}
            <div className="p-6 prose prose-blue max-w-none bg-white/90 backdrop-blur-sm shadow-inner max-h-[40vh] overflow-y-auto">
              {result.split('\n').map((line, index) => {
                // Format headings
                if (line.match(/^#+\s/)) {
                  const level = line.match(/^#+/)?.[0].length || 1;
                  const content = line.replace(/^#+\s/, '');
                  if (level === 1) 
                    return <h2 key={index} className="text-xl font-bold text-gray-900 border-b pb-1 border-gray-200">{content}</h2>;
                  if (level === 2) 
                    return <h3 key={index} className="text-lg font-semibold text-gray-800 mt-4">{content}</h3>;
                  return <h4 key={index} className="text-base font-medium text-gray-800 mt-3">{content}</h4>;
                }
                
                // Format lists with numbers
                if (line.match(/^\d+\.\s/)) {
                  const number = line.match(/^\d+/)?.[0];
                  const content = line.replace(/^\d+\.\s/, '');
                  return (
                    <div key={index} className="flex my-1.5">
                      <span className="font-bold text-indigo-600 mr-2 flex-shrink-0">{number}.</span>
                      <p className="mt-0">{content}</p>
                    </div>
                  );
                }
                
                // Format bulleted lists
                if (line.match(/^[\*\-]\s/)) {
                  const content = line.replace(/^[\*\-]\s/, '');
                  return (
                    <div key={index} className="flex items-start my-1.5">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 mt-2 mr-2 flex-shrink-0"></div>
                      <p className="mt-0">{content}</p>
                    </div>
                  );
                }
                
                // Regular paragraphs with subtle highlights for important phrases
                if (line.trim()) {
                  // Highlight text in backticks
                  const formattedText = line.replace(/`(.*?)`/g, '<span class="px-1 bg-indigo-50 text-indigo-700 rounded font-mono text-sm">$1</span>');
                  
                  return <p key={index} className="my-1.5" dangerouslySetInnerHTML={{ __html: formattedText }}></p>;
                }
                
                return <br key={index} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolContent;