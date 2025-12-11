import React, { useState } from 'react';
import { useOpenAI } from '../../services/openaiLegacyService';
import AIToolContent from '../shared/AIToolContent';
import { Image, PlusCircle, Minus, RefreshCw, Download, Check, Copy, Palette, FileText, BarChart2 } from 'lucide-react';

const VisualContentGeneratorContent: React.FC = () => {
  const [formData, setFormData] = useState({
    contentType: 'infographic',
    industry: '',
    keyPoints: ['', '', ''],
    primaryColor: '#3b82f6',
    secondaryColor: '#6366f1',
    targetAudience: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const openai = useOpenAI();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleKeyPointChange = (index: number, value: string) => {
    const newKeyPoints = [...formData.keyPoints];
    newKeyPoints[index] = value;
    setFormData({
      ...formData,
      keyPoints: newKeyPoints
    });
  };

  const addKeyPoint = () => {
    setFormData({
      ...formData,
      keyPoints: [...formData.keyPoints, '']
    });
  };

  const removeKeyPoint = (index: number) => {
    const newKeyPoints = [...formData.keyPoints];
    newKeyPoints.splice(index, 1);
    setFormData({
      ...formData,
      keyPoints: newKeyPoints
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty key points
    const validKeyPoints = formData.keyPoints.filter(point => point.trim() !== '');
    if (validKeyPoints.length === 0) {
      setError("Please add at least one key point");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Add color scheme and audience to the content type for better results
      const enhancedType = `${formData.contentType} with a ${formData.primaryColor}/${formData.secondaryColor} color scheme for ${formData.targetAudience || 'a general business audience'}`;
      
      const visualContent = await openai.generateVisualContentIdea(
        enhancedType,
        formData.industry || 'general business',
        validKeyPoints
      );
      
      setResult(visualContent);
      setCopied(false);
    } catch (err) {
      console.error('Error generating visual content idea:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the visual content idea');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Content type options
  const contentTypes = [
    { value: 'infographic', label: 'Infographic' },
    { value: 'comparison_chart', label: 'Product Comparison Chart' },
    { value: 'process_diagram', label: 'Process Diagram/Flowchart' },
    { value: 'data_visualization', label: 'Data Visualization' },
    { value: 'social_media_graphic', label: 'Social Media Graphic' },
    { value: 'presentation_slide', label: 'Presentation Slide' },
    { value: 'one_pager', label: 'One-Page Sales Sheet' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
        <div className="flex items-start">
          <Image className="text-rose-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-rose-800">Visual Content Generator</h3>
            <p className="text-sm text-rose-700 mt-1">
              Generate professional visual content ideas for sales presentations, marketing materials, and client communications.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Creating visual content idea..."
        resultTitle="Visual Content Design"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visual Content Type
            </label>
            <select
              name="contentType"
              value={formData.contentType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
            >
              {contentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 mr-1 text-gray-500" />
                Industry (Optional)
              </label>
              <input
                name="industry"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                placeholder="e.g. Technology, Healthcare, Finance"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <BarChart2 className="h-4 w-4 mr-1 text-gray-500" />
                Target Audience (Optional)
              </label>
              <input
                name="targetAudience"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                placeholder="e.g. C-level executives, IT managers"
                value={formData.targetAudience}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Key Points to Include
              </label>
              <button
                type="button"
                onClick={addKeyPoint}
                className="text-xs flex items-center text-rose-600 hover:text-rose-800"
              >
                <PlusCircle size={14} className="mr-1" />
                Add Key Point
              </button>
            </div>
            
            {formData.keyPoints.map((keyPoint, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={keyPoint}
                  onChange={(e) => handleKeyPointChange(index, e.target.value)}
                  placeholder={`Key point ${index + 1} (e.g., "Our solution increases ROI by 30%")`}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                />
                {formData.keyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyPoint(index)}
                    className="ml-2 p-2 text-red-600 hover:text-red-800 rounded"
                  >
                    <Minus size={18} />
                  </button>
                )}
              </div>
            ))}
            {error && formData.keyPoints.every(p => !p.trim()) && (
              <p className="text-red-600 text-sm mt-1">Please add at least one key point</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Palette className="h-4 w-4 mr-1 text-gray-500" />
              Color Scheme
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Primary Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded overflow-hidden p-0 border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    name="primaryColor"
                    className="ml-2 flex-1 p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Secondary Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-10 h-10 rounded overflow-hidden p-0 border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    name="secondaryColor"
                    className="ml-2 flex-1 p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>
            
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || formData.keyPoints.every(p => !p.trim())}
              className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Image size={18} className="mr-2" />
                  Generate Visual Idea
                </>
              )}
            </button>
          </div>
        </form>
      </AIToolContent>

      {result && !isLoading && !error && (
        <div className="mt-6">
          <div className="flex justify-end space-x-2 mb-2">
            <button 
              onClick={handleCopy}
              className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
                copied 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} className="mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-1" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-rose-600 text-white rounded text-sm hover:bg-rose-700">
              <Download size={16} className="mr-1" />
              Download Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualContentGeneratorContent;