import { supabaseAIService } from './supabaseAIService';
import { generateImageAI, fileToDataUrl } from './aiGenerate';

// Images use the OpenAI Responses API image_generation tool (POST /api/ai/image), which also edits
// existing images. gpt-image sizes: 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait).
const GPT_IMAGE_SIZES: Record<string, string> = {
  '1792x1024': '1536x1024',
  '1024x1792': '1024x1536',
  '256x256': '1024x1024',
  '512x512': '1024x1024',
};
const toGptImageSize = (size?: string) => (size ? GPT_IMAGE_SIZES[size] || size : '1024x1024');

interface ImageGenerationOptions {
  prompt: string;
  model?: 'gpt-image-2.5-flare' | 'dall-e-2' | 'dall-e-3'; // all generate with gpt-image-2.5-flare
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | '1536x1024' | '1024x1536';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
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

  /** Generate an image (image_generation tool on the user's OpenAI key; the server reports a missing key). */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const size = toGptImageSize(options.size);
      const [url] = await generateImageAI({ prompt: options.prompt, size });
      if (!url) throw new Error('No image was generated');

      const result: ImageGenerationResult = {
        url,
        model: 'gpt-image-2.5-flare',
        size,
        quality: options.quality || 'standard',
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

  /** Create a variation of an image (image_generation tool with the image as input). */
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
    return { url, model: 'gpt-image-2.5-flare', size, quality: options?.quality || 'standard' };
  }

  /**
   * Edit an image from a prompt. A mask, if given, is sent as a second image with an instruction
   * to change only the masked (transparent) area.
   */
  async editImage(
    imageFile: File,
    maskFile: File | undefined,
    prompt: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult> {
    const size = toGptImageSize(options?.size);
    const images = [await fileToDataUrl(imageFile)];
    if (maskFile) images.push(await fileToDataUrl(maskFile));
    const [url] = await generateImageAI({
      prompt: maskFile
        ? `${prompt}\n\nThe second image is a mask: change only the transparent area of the first image.`
        : prompt,
      size,
      images,
    });
    if (!url) throw new Error('No image was generated');
    return { url, model: 'gpt-image-2.5-flare', size, quality: options?.quality || 'standard' };
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
    size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
    quality: 'standard' | 'hd' = 'standard',
    style: 'vivid' | 'natural' = 'natural'
  ) => {
    const result = await openaiImageService.generateImage({
      prompt,
      size,
      quality,
      style,
      model: 'gpt-image-2.5-flare',
    });

    return {
      url: result.url,
      revisedPrompt: result.revised_prompt,
    };
  };

  return {
    generateImage,
  };
};
