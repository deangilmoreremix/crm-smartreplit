import { useApiStore } from '../store/apiStore';

export const useOpenAIVision = () => {
  const { apiKeys } = useApiStore();
  
  const analyzeImage = async (imageUrl: string, prompt: string = "What's in this image?") => {
    if (!apiKeys.openai) {
      throw new Error('OpenAI API key is not set');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || 'Unable to analyze image';
    } catch (error) {
      throw error;
    }
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