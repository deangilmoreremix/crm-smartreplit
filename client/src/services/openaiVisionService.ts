import { aiAdvanced } from './aiToolsApiService';

/**
 * Vision analysis via the server (POST /api/ai/vision/analyze).
 * No API keys are handled in the browser.
 */
export const useOpenAIVision = () => {
  const analyzeImage = async (imageUrl: string, prompt: string = "What's in this image?") => {
    const data = await aiAdvanced.analyzeImage(imageUrl, prompt);
    const analysis = data?.analysis;
    const text = typeof analysis === 'string' ? analysis : analysis?.analysis;
    return (text as string) || 'Unable to analyze image';
  };

  const analyzeImageFile = async (file: File, prompt: string = "What's in this image?") => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const result = await analyzeImage(base64, prompt);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return { analyzeImage, analyzeImageFile };
};
