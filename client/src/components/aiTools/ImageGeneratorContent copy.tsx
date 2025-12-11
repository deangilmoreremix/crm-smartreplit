import React, { useState } from 'react';
import { useOpenAIImage } from '../../services/openaiImageService';
import AIToolContent from '../shared/AIToolContent';
import { Image, Camera, RefreshCw, Download, Copy, Check, Lightbulb, Grid3X3, Layout } from 'lucide-react';

const ImageGeneratorContent: React.FC = () => {
  const imageService = useOpenAIImage();
  
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [imageStyle, setImageStyle] = useState<'natural' | 'vivid'>('natural');
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');
  const [promptCopied, setPromptCopied] = useState(false);
  
  // Sample prompts for quick selection
  const samplePrompts = [
    "Professional business team collaborating in a modern office setting",
    "Product showcase for a sleek new CRM dashboard",
    "Visual representation of increasing sales and growth",
    "Business person analyzing data with attractive data visualizations",
    "Minimalist product feature comparison chart"
  ];
  
  const handleGenerateImage = async () => {
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await imageService.generateImage(prompt, imageSize, imageQuality, imageStyle);
      
      setGeneratedImageUrl(result.url);
      setRevisedPrompt(result.revisedPrompt);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadImage = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleCopyPrompt = () => {
    if (revisedPrompt) {
      navigator.clipboard.writeText(revisedPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }
  };
  
  const handleUseSamplePrompt = (sample: string) => {
    setPrompt(sample);
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
        <div className="flex items-start">
          <Image className="text-emerald-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-emerald-800">DALL·E Image Generator</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Create professional images for presentations, proposals, and marketing materials.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={null} // We're not using the standard result display for this component
        loadingMessage="Generating image..."
        resultTitle="Generated Image"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Image Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Lightbulb className="inline h-4 w-4 mr-1 text-amber-500" />
              Need inspiration? Try one of these:
            </label>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => handleUseSamplePrompt(sample)}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 truncate max-w-xs"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Grid3X3 size={16} className="mr-1 text-gray-500" />
                Image Size
              </label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value as any)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="1024x1024">Square (1:1)</option>
                <option value="1792x1024">Landscape (16:9)</option>
                <option value="1024x1792">Portrait (9:16)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Layout size={16} className="mr-1 text-gray-500" />
                Style
              </label>
              <select
                value={imageStyle}
                onChange={(e) => setImageStyle(e.target.value as any)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="natural">Natural</option>
                <option value="vivid">Vivid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Camera size={16} className="mr-1 text-gray-500" />
                Quality
              </label>
              <select
                value={imageQuality}
                onChange={(e) => setImageQuality(e.target.value as any)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD</option>
              </select>
              {imageQuality === 'hd' && (
                <p className="text-xs text-gray-500 mt-1">HD quality uses more API credits</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleGenerateImage}
              disabled={isLoading || !prompt.trim()}
              className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                isLoading || !prompt.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Camera size={18} className="mr-2" />
                  Generate Image
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Generated Image Result */}
        {generatedImageUrl && !isLoading && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Image</h3>
            
            <div className="mb-4 rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <img 
                src={generatedImageUrl} 
                alt="Generated image" 
                className="w-full h-auto object-contain"
              />
            </div>
            
            {revisedPrompt && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Revised Prompt:</h4>
                <div className="relative">
                  <div className="bg-white p-3 rounded-md border border-gray-200 text-sm text-gray-800">
                    {revisedPrompt}
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                    title="Copy revised prompt"
                  >
                    {promptCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleDownloadImage}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Download size={16} className="mr-1.5" />
                Download Image
              </button>
            </div>
          </div>
        )}
      </AIToolContent>
    </div>
  );
};

export default ImageGeneratorContent;