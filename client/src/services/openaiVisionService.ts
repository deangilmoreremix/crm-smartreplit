import { analyzeImageAI, generateAI, fileToDataUrl } from './aiGenerate';

// Image and document analysis through the OpenAI Responses API (POST /api/ai/generate with image or file
// input) on the user's own OpenAI key. It previously called api.openai.com from the browser with a key
// nothing ever set.
export const useOpenAIVision = () => {
  const analyzeImage = async (imageUrl: string, prompt: string = "What's in this image?") => {
    const analysis = await analyzeImageAI(imageUrl, prompt);
    return analysis || 'Unable to analyze image';
  };

  /** Analyse an uploaded image, or a document such as a PDF (sent as a file input). */
  const analyzeImageFile = async (file: File, prompt: string = "What's in this image?") => {
    const dataUrl = await fileToDataUrl(file);
    if (file.type.startsWith('image/')) return analyzeImage(dataUrl, prompt);
    const { content } = await generateAI({ prompt, files: [{ filename: file.name, data: dataUrl }] });
    return content || 'Unable to analyze document';
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
