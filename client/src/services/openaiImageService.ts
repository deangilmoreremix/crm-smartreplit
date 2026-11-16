import { supabaseAIService } from './supabaseAIService';

interface ImageGenerationOptions {
  prompt: string;
  model?: 'gpt-image-2.5-flare' | 'dall-e-2' | 'dall-e-3'; // dall-e IDs are mapped server-side
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
  private baseUrl: string = 'https://api.openai.com/v1';

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
   * Generate an image using DALL-E via server endpoint
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
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
          model: options.model || 'gpt-image-2.5-flare',
          size: options.size || '1024x1024',
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

      const imageData = data.data[0];

      const result: ImageGenerationResult = {
        url: imageData.url,
        revised_prompt: imageData.revised_prompt,
        model: options.model || 'gpt-image-2.5-flare',
        size: options.size || '1024x1024',
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
   * Calculate approximate cost for image generation
   */
  private calculateImageCost(model: string, size: string): number {
    // Approximate costs based on OpenAI pricing (as of 2024)
    const costs: Record<string, Record<string, number>> = {
      'dall-e-2': {
        '256x256': 0.016,
        '512x512': 0.018,
        '1024x1024': 0.02,
      },
      'dall-e-3': {
        '1024x1024': 0.04, // Standard quality
        '1792x1024': 0.08,
        '1024x1792': 0.08,
      },
    };

    return costs[model]?.[size] || 0.04; // Default to DALL-E 3 standard cost
  }

  /**
   * Create image variation using DALL-E 2 via server endpoint
   */
  // Image variations and edits used DALL-E 2 (shut down 2026-05-12) and have no server route.
  async createVariation(
    _imageFile: File,
    _options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult> {
    throw new Error('Image variations are not available. Use image generation with a new prompt instead.');
  }

  /**
   * Image editing is not available (see createVariation).
   */
  async editImage(
    _imageFile: File,
    _maskFile: File | undefined,
    _prompt: string,
    _options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult> {
    throw new Error('Image editing is not available. Use image generation with a new prompt instead.');
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
