import React, { useState } from 'react';
import { useOpenAIImage } from '../../services/openaiImageService';
import { DEFAULT_IMAGE_MODEL, SELECTABLE_IMAGE_MODELS, type ImageComplexity, type ImageQuality } from '@shared/aiModels';
import AIToolContent from '../shared/AIToolContent';
import {
  Image,
  Camera,
  RefreshCw,
  Download,
  Lightbulb,
  Grid3X3,
  Layout,
  PenLine,
} from 'lucide-react';

const ImageGeneratorContent: React.FC = () => {
  const imageService = useOpenAIImage();

  const [prompt, setPrompt] = useState('');
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const generatedImageUrl = generatedImageUrls[0] ?? null;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1024x1024' | '1536x1024' | '1024x1536'>('1024x1024');
  const [imageModel, setImageModel] = useState<string>(DEFAULT_IMAGE_MODEL);
  const [imageQuality, setImageQuality] = useState<ImageQuality>('auto');
  const [imageComplexity, setImageComplexity] = useState<ImageComplexity>('medium');
  const [transparent, setTransparent] = useState(false);
  const [outputCount, setOutputCount] = useState(1);
  const [outputFormat, setOutputFormat] = useState<'png' | 'webp' | 'svg' | 'gif'>('png');
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [markupFile, setMarkupFile] = useState<File | null>(null);

  // Transparent backgrounds need png/webp; SVG is generate-only with n=1.
  const supportsTransparent = outputFormat === 'png' || outputFormat === 'webp';
  const markupMode = !!(baseFile && markupFile);

  // Sample prompts for quick selection
  const samplePrompts = [
    'Professional business team collaborating in a modern office setting',
    'Product showcase for a sleek new CRM dashboard',
    'Visual representation of increasing sales and growth',
    'Business person analyzing data with attractive data visualizations',
    'Minimalist product feature comparison chart',
  ];

  const handleGenerateImage = async () => {
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }

    if (markupMode && outputFormat === 'svg') {
      setError('SVG output is not supported for markup edits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const common = {
        size: imageSize,
        quality: imageQuality,
        complexity: imageComplexity,
        model: imageModel,
        n: outputFormat === 'svg' ? 1 : outputCount,
        outputFormat,
      };
      const result = markupMode
        ? await imageService.editWithMarkup(baseFile!, markupFile!, prompt, common)
        : await imageService.generateImage(prompt, {
            ...common,
            background: transparent && supportsTransparent ? 'transparent' : undefined,
          });

      setGeneratedImageUrls(result.images.length ? result.images.map((i) => i.url) : [result.url]);
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
      link.download = `generated-image-${Date.now()}.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            <h3 className="font-medium text-emerald-800">GPT Image 2.6 Generator</h3>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option value="1536x1024">Landscape (3:2)</option>
                <option value="1024x1536">Portrait (2:3)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Layout size={16} className="mr-1 text-gray-500" />
                Model
              </label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                {SELECTABLE_IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {SELECTABLE_IMAGE_MODELS.find((m) => m.id === imageModel)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Camera size={16} className="mr-1 text-gray-500" />
                Quality
              </label>
              <select
                value={imageQuality}
                onChange={(e) => setImageQuality(e.target.value as ImageQuality)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="auto">Auto</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="xhigh">Extra high</option>
                <option value="max">Max</option>
              </select>
              {(imageQuality === 'xhigh' || imageQuality === 'max') && (
                <p className="text-xs text-gray-500 mt-1">Higher quality uses more API credits</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
              <select
                value={imageComplexity}
                onChange={(e) => setImageComplexity(e.target.value as ImageComplexity)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output format</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="svg">SVG (single image)</option>
                <option value="gif">Animated GIF</option>
              </select>
            </div>
            <div>
              <label htmlFor="output-count" className="block text-sm font-medium text-gray-700 mb-1">
                Number of images
              </label>
              <select
                id="output-count"
                value={outputFormat === 'svg' ? 1 : outputCount}
                disabled={outputFormat === 'svg'}
                onChange={(e) => setOutputCount(Number(e.target.value))}
                className="w-full p-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-6">
              <input
                type="checkbox"
                checked={transparent && supportsTransparent}
                disabled={!supportsTransparent || markupMode}
                onChange={(e) => setTransparent(e.target.checked)}
              />
              Transparent background
            </label>
          </div>

          <div className="p-3 border rounded-md bg-gray-50 space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center">
              <PenLine size={16} className="mr-1 text-gray-500" />
              Markup edit (optional)
            </div>
            <p className="text-xs text-gray-500">
              Upload a base image and a transparent PNG annotation layer of the same size, then describe the change
              above. Both files together switch Generate into an edit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">
                Base image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setBaseFile(e.target.files?.[0] ?? null)}
                  className="block w-full mt-1"
                />
              </label>
              <label className="text-xs text-gray-600">
                Annotation layer (PNG)
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => setMarkupFile(e.target.files?.[0] ?? null)}
                  className="block w-full mt-1"
                />
              </label>
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

            <div className={`mb-4 grid gap-3 ${generatedImageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {generatedImageUrls.map((url, i) => (
                <div key={i} className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <img src={url} alt={`Generated image ${i + 1}`} className="w-full h-auto object-contain" />
                </div>
              ))}
            </div>

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
