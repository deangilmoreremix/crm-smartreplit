import { analyzeImageAI } from './aiGenerate';

// Image analysis goes through the server (POST /api/ai/vision/analyze) with the user's own OpenAI key.
// It previously called api.openai.com from the browser with a key nothing ever set.
export const useOpenAIVision = () => {
  const analyzeImage = async (imageUrl: string, prompt: string = "What's in this image?") => {
    const analysis = await analyzeImageAI(imageUrl, prompt);
    return analysis || 'Unable to analyze image';
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

  // Used by VisionAnalyzerContent (it called these, but they never existed)
  const analyzeClientDocument = (imageUrl: string) =>
    analyzeImage(
      imageUrl,
      'This is a client document. Extract the key information (parties, dates, amounts, terms, action items) and summarise it.'
    );

  const analyzeCompetitorVisuals = (imageUrl: string, competitorName?: string) =>
    analyzeImage(
      imageUrl,
      `Analyse this competitor visual${competitorName ? ` from ${competitorName}` : ''}: messaging, positioning, design, ` +
        'target audience, and how we could differentiate.'
    );

  return { analyzeImage, analyzeImageFile, analyzeClientDocument, analyzeCompetitorVisuals };
};
