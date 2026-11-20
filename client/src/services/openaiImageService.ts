import { supabaseAIService } from './supabaseAIService';
import { generateImageAI, fileToDataUrl } from './aiGenerate';

// Images use GPT Image 2.6 on the OpenAI Images API (POST /api/ai/image), which also edits existing
// images. Sizes: auto, 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait).
const GPT_IMAGE_SIZES: Record<string, string> = {
  '1792x1024': '1536x1024',
  '1024x1792': '1024x1536',
  '256x256': '1024x1024',
  '512x512': '1024x1024',
};
const toGptImageSize = (size?: string) => (size ? GPT_IMAGE_SIZES[size] || size : '1024x1024');

interface ImageGenerationOptions {
  prompt: string;
  model?: 'gpt-image-2.6-flare' | 'gpt-image-2.6-sunburst';
  size?: 'auto' | '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | '1536x1024' | '1024x1536';
  /** auto | low | medium | high | xhigh | max (legacy standard/hd are mapped on the server) */
  quality?: string;
  /** Not supported by GPT Image models; ignored. */
  style?: 'vivid' | 'natural';
  n?: number;
  background?: 'auto' | 'opaque' | 'transparent';
  output_format?: 'png' | 'jpeg' | 'webp' | 'gif' | 'svg';
  complexity?: 'low' | 'medium' | 'high';
  frame_count?: number;
  frame_duration_ms?: number;
  customerId?: string;
}

interface ImageGenerationResult {
  url: string;
  revised_prompt?: string;
  model: string;
  size: string;
  quality: string;
  style?: string;
}

class OpenAIImageService {

  /** Generate an image (GPT Image 2.6 on the user's OpenAI key; the server reports a missing key). */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const size = toGptImageSize(options.size);
      const model = options.model || 'gpt-image-2.6-flare';
      const [url] = await generateImageAI({
        prompt: options.prompt,
        size,
        model,
        quality: options.quality,
        n: options.n,
        background: options.background,
        output_format: options.output_format,
        complexity: options.complexity,
        frame_count: options.frame_count,
        frame_duration_ms: options.frame_duration_ms,
      });
      if (!url) throw new Error('No image was generated');

      const result: ImageGenerationResult = {
        url,
        model,
        size,
        quality: options.quality || 'auto',
        style: options.style,
      };

      // Log usage if customer ID is provided
      if (options.customerId) {
        try {
          await supabaseAIService.logUsage({
            customer_id: options.customerId,
            model_id: result.model,
            feature_used: 'image-generation',
            tokens_used: 1, // Count as 1 token for image generation
            cost: 0, // billed to the user's own OpenAI account
            response_time_ms: 0,
            success: true,
          });
        } catch (logError) {
          console.warn('Failed to log AI usage:', logError);
        }
      }

      return result;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw error;
    }
  }

  /** Create a variation of an image (GPT Image 2.6 edit with the image as input). */
  async createVariation(imageFile: File, options?: Partial<ImageGenerationOptions>): Promise<ImageGenerationResult> {
    const size = toGptImageSize(options?.size);
    const [url] = await generateImageAI({
      prompt:
        options?.prompt ||
        'Create a variation of this image: keep the subject, composition and style recognisable but produce a fresh rendition.',
      size,
      images: [await fileToDataUrl(imageFile)],
    });
    if (!url) throw new Error('No image was generated');
    return { url, model: 'gpt-image-2.6-sunburst', size, quality: options?.quality || 'auto' };
  }

  /** Edit an image from a prompt. A mask (PNG; transparent = area to change) is sent as a real edit mask. */
  async editImage(
    imageFile: File,
    maskFile: File | undefined,
    prompt: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult> {
    const size = toGptImageSize(options?.size);
    const [url] = await generateImageAI({
      prompt,
      size,
      images: [await fileToDataUrl(imageFile)],
      ...(maskFile ? { mask: await fileToDataUrl(maskFile) } : {}),
    });
    if (!url) throw new Error('No image was generated');
    return { url, model: 'gpt-image-2.6-sunburst', size, quality: options?.quality || 'auto' };
  }
}

// Export singleton instance
export const openaiImageService = new OpenAIImageService();

// Export hook for React components
export const useOpenAIImageGeneration = () => {
  const generateImage = async (options: ImageGenerationOptions) => {
    return openaiImageService.generateImage(options);
  };

  const createVariation = async (imageFile: File, options?: Partial<ImageGenerationOptions>) => {
    return openaiImageService.createVariation(imageFile, options);
  };

  const editImage = async (
    imageFile: File,
    maskFile: File | undefined,
    prompt: string,
    options?: Partial<ImageGenerationOptions>
  ) => {
    return openaiImageService.editImage(imageFile, maskFile, prompt, options);
  };

  return {
    generateImage,
    createVariation,
    editImage,
  };
};

export type { ImageGenerationOptions, ImageGenerationResult };

// Alias for compatibility with existing components
export const useOpenAIImage = () => {
  const generateImage = async (
    prompt: string,
    size: ImageGenerationOptions['size'] = '1024x1024',
    quality: string = 'auto',
    options: Omit<ImageGenerationOptions, 'prompt' | 'size' | 'quality'> = {}
  ) => {
    const result = await openaiImageService.generateImage({ prompt, size, quality, ...options });

    return {
      url: result.url,
      revisedPrompt: result.revised_prompt,
    };
  };

  return {
    generateImage,
  };
};
