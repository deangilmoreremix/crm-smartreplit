import React, { useState, useCallback } from 'react';
import { useOpenAIVision } from '../../services/openaiVisionService';
import AIToolContent from '../shared/AIToolContent';
import { useDropzone } from 'react-dropzone';
import { File, Image, AlertCircle, RefreshCw, Upload, ExternalLink } from 'lucide-react';

interface VisionAnalyzerContentProps {
  type?: 'competitor' | 'document' | 'general';
}

const VisionAnalyzerContent: React.FC<VisionAnalyzerContentProps> = ({ 
  type = 'general'
}) => {
  const vision = useOpenAIVision();
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  
  let defaultPrompt = 'Please analyze this image and provide insights.';
  let title = 'Image Analyzer';
  let description = 'Analyze images using AI to extract insights and information.';
  
  // Set type-specific defaults
  if (type === 'competitor') {
    defaultPrompt = 'Please analyze this competitor\'s visual material and provide competitive insights.';
    title = 'Competitor Visual Analysis';
    description = 'Analyze competitors\' visual materials to extract strategic insights.';
  } else if (type === 'document') {
    defaultPrompt = 'Please analyze this document and extract key information.';
    title = 'Document Visual Analysis';
    description = 'Extract key information from documents, presentations, or other visual materials.';
  }
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }
      
      setImageFile(file);
      
      // Create a URL for the image
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      
      // Clear previous results and errors
      setResult(null);
      setError(null);
    }
  }, []);
  
  // Set up dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': []
    },
    maxFiles: 1
  });
  
  const handleUrlSubmit = () => {
    if (!imageUrlInput) {
      setError('Please enter an image URL');
      return;
    }
    
    // Simple URL validation
    if (!imageUrlInput.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
      setError('Please enter a valid image URL');
      return;
    }
    
    setImageUrl(imageUrlInput);
    setImageFile(null);
    setResult(null);
    setError(null);
  };
  
  const handleAnalyze = async () => {
    if (!imageUrl) {
      setError('Please upload an image first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let analysisResult;
      const promptToUse = customPrompt || defaultPrompt;
      
      if (type === 'competitor' && !customPrompt) {
        const competitorName = 'Unknown'; // Could be an input in the UI
        analysisResult = await vision.analyzeCompetitorVisuals(imageUrl, competitorName);
      } else if (type === 'document' && !customPrompt) {
        analysisResult = await vision.analyzeClientDocument(imageUrl);
      } else {
        // General analysis or custom prompt
        analysisResult = await vision.analyzeImage(imageUrl, promptToUse);
      }
      
      setResult(analysisResult);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div className="flex items-start">
          <Image className="text-purple-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-purple-800">{title}</h3>
            <p className="text-sm text-purple-700 mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Analyzing image..."
        resultTitle="Image Analysis Results"
      >
        <div className="space-y-4">
          {/* Image Drop Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition ${
                isDragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : imageUrl 
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <input {...getInputProps()} />
              
              {imageUrl ? (
                <div className="text-center">
                  <div className="mx-auto max-h-48 max-w-full overflow-hidden rounded-md mb-4">
                    <img 
                      src={imageUrl} 
                      alt="Uploaded preview" 
                      className="h-full w-full object-contain" 
                    />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Image ready for analysis
                  </p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrl(null);
                      setImageFile(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={36} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">
                      {isDragActive 
                        ? 'Drop image here' 
                        : 'Drag & drop image here or click to browse'
                      }
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* OR Separator */}
          <div className="flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          {/* Image URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <div className="flex">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-l-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <ExternalLink size={18} />
              </button>
            </div>
            {imageUrl && !imageFile && (
              <p className="mt-2 text-xs text-green-600">Image URL loaded: {imageUrl}</p>
            )}
          </div>
          
          {/* Analysis Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Prompt (Optional)
            </label>
            <textarea
              placeholder={`Default: ${defaultPrompt}`}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            ></textarea>
          </div>
          
          {/* Analyze Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!imageUrl || isLoading}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                !imageUrl || isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } transition-colors`}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="inline mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Image'
              )}
            </button>
          </div>
        </div>
      </AIToolContent>
    </div>
  );
};

export default VisionAnalyzerContent;