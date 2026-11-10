import { supabaseAIService } from './supabaseAIService';
import { runAiJob } from './openai-batch-api.service';
import { DEFAULT_IMAGE_MODEL, type ImageComplexity, type ImageQuality } from '@shared/aiModels';

interface ImageGenerationOptions {
  prompt: string;
  /** GPT Image 2.6 model id (Flare / Sunburst). */
  model?: string;
  /** 1024x1024 | 1536x1024 | 1024x1536 | WIDTHxHEIGHT | auto */
  size?: string;
  quality?: ImageQuality;
  complexity?: ImageComplexity;
  background?: 'transparent' | 'opaque' | 'auto';
  n?: number;
  /** svg: generate only, n=1. gif: generate or edit. */
  outputFormat?: 'png' | 'jpeg' | 'webp' | 'svg' | 'gif';
  /** Transparent PNG annotation layer for markup edits (same size as the base image). */
  markup?: File;
  customerId?: string;
}

interface ImageGenerationResult {
  /** Data URL (or storage URL) of the first image. */
  url: string;
  images: Array<{ url: string; b64_json?: string }>;
  model: string;
  size: string;
  quality: string;
}

const DEFAULT_SIZE = '1024x1024';
const DEFAULT_QUALITY: ImageQuality = 'auto';

class OpenAIImageService {

  constructor(apiKey?: string) {
    // API key is now handled server-side only
    // Client no longer needs direct access to sensitive keys
  }

  /**
   * Check if server-side API is available
   */
  private async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.warn('Failed to check server availability:', error);
      return false;
    }
  }

  /**
   * Generate an image with GPT Image 2.6 via server endpoint
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    // xhigh/max renders can exceed Netlify's sync function timeout: run them as a background job.
    if (options.quality === 'xhigh' || options.quality === 'max') {
      const job = await runAiJob<{ images: Array<{ url: string }> }>('image_generate_hq', {
        prompt: options.prompt,
        model: options.model || DEFAULT_IMAGE_MODEL,
        size: options.size || DEFAULT_SIZE,
        quality: options.quality,
        complexity: options.complexity,
        background: options.background,
        outputFormat: options.outputFormat,
        n: options.n || 1,
      });
      return {
        url: job.images[0].url,
        images: job.images,
        model: options.model || DEFAULT_IMAGE_MODEL,
        size: options.size || DEFAULT_SIZE,
        quality: options.quality,
      };
    }

    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      throw new Error(
        'Image generation service is not available. Please check server configuration.'
      );
    }

    try {
      const response = await fetch('/api/openai/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: options.prompt,
          model: options.model || DEFAULT_IMAGE_MODEL,
          size: options.size || DEFAULT_SIZE,
          quality: options.quality || DEFAULT_QUALITY,
          complexity: options.complexity,
          background: options.background,
          output_format: options.outputFormat,
          n: options.n || 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Image generation error: ${response.status} - ${errorData.error || 'Unknown error'}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Image generation failed');
      }

      const result: ImageGenerationResult = {
        url: data.url ?? data.images?.[0]?.url,
        images: data.images ?? [],
        model: data.model || options.model || DEFAULT_IMAGE_MODEL,
        size: options.size || DEFAULT_SIZE,
        quality: options.quality || DEFAULT_QUALITY,
      };

      // Log usage if customer ID is provided
      if (options.customerId) {
        try {
          await supabaseAIService.logUsage({
            customer_id: options.customerId,
            model_id: result.model,
            feature_used: 'image-generation',
            tokens_used: 1, // Count as 1 token for image generation
            cost: this.calculateImageCost(result.model, result.size),
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

  /**
   * Calculate approximate cost for image generation (rough per-image estimate)
   */
  private calculateImageCost(model: string, _size: string): number {
    return model.endsWith('sunburst') ? 0.08 : 0.04;
  }

  /**
   * Create image variation (GPT Image 2.6 edit) via server endpoint
   */
  async createVariation(
    imageFile: File,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult> {
    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      throw new Error(
        'Image variation service is not available. Please check server configuration.'
      );
    }

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('n', String(options?.n || 1));
      formData.append('size', options?.size || DEFAULT_SIZE);
      formData.append('model', options?.model || DEFAULT_IMAGE_MODEL);
      if (options?.quality) formData.append('quality', options.quality);
      if (options?.complexity) formData.append('complexity', options.complexity);

      const response = await fetch('/api/openai/images/variation', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Image variation error: ${response.status} - ${errorData.error || 'Unknown error'}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Image variation failed');
      }

      return {
        url: data.url ?? data.images?.[0]?.url,
        images: data.images ?? [],
        model: data.model || options?.model || DEFAULT_IMAGE_MODEL,
        size: options?.size || DEFAULT_SIZE,
        quality: options?.quality || DEFAULT_QUALITY,
      };
    } catch (error) {
      console.error('Image variation failed:', error);
      throw error;
    }
  }

  /**
   * Edit an image with GPT Image 2.6 via server endpoint
   */
  async editImage(
    imageFile: File,
    maskFile: File | undefined,
    prompt: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult> {
    const serverAvailable = await this.isServerAvailable();
    if (!serverAvailable) {
      throw new Error('Image editing service is not available. Please check server configuration.');
    }

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (maskFile) {
        formData.append('mask', maskFile);
      }
      if (options?.markup) formData.append('markup', options.markup);
      if (options?.outputFormat) formData.append('output_format', options.outputFormat);
      formData.append('prompt', prompt);
      formData.append('n', String(options?.n || 1));
      formData.append('size', options?.size || DEFAULT_SIZE);
      formData.append('model', options?.model || DEFAULT_IMAGE_MODEL);
      if (options?.quality) formData.append('quality', options.quality);
      if (options?.complexity) formData.append('complexity', options.complexity);

      const response = await fetch('/api/openai/images/edit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Image edit error: ${response.status} - ${errorData.error || 'Unknown error'}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Image edit failed');
      }

      return {
        url: data.url ?? data.images?.[0]?.url,
        images: data.images ?? [],
        model: data.model || options?.model || DEFAULT_IMAGE_MODEL,
        size: options?.size || DEFAULT_SIZE,
        quality: options?.quality || DEFAULT_QUALITY,
      };
    } catch (error) {
      console.error('Image edit failed:', error);
      throw error;
    }
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
    opts: {
      size?: string;
      quality?: ImageQuality;
      complexity?: ImageComplexity;
      model?: string;
      background?: 'transparent' | 'opaque' | 'auto';
      n?: number;
      outputFormat?: 'png' | 'jpeg' | 'webp' | 'svg' | 'gif';
    } = {}
  ) => {
    const result = await openaiImageService.generateImage({ prompt, ...opts });
    return { url: result.url, images: result.images };
  };

  const editWithMarkup = async (
    image: File,
    markup: File,
    prompt: string,
    opts: Partial<ImageGenerationOptions> = {}
  ) => {
    const result = await openaiImageService.editImage(image, undefined, prompt, { ...opts, markup });
    return { url: result.url, images: result.images };
  };

  return {
    generateImage,
    editWithMarkup,
  };
};
