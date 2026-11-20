// Gemini AI service for contact research and enhancement
import { ContactEnrichmentData, aiEnrichmentService } from './aiEnrichmentService';
import { logger } from './logger.service';
import { aiOrchestratorService } from './aiOrchestratorService';
import { enhancedGeminiService } from './enhancedGeminiService';
import { generateAI, researchAI } from './aiGenerate';

const STR = { type: 'string' };
const LINKEDIN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['firstName', 'lastName', 'name', 'title', 'company', 'industry', 'location', 'socialProfiles', 'bio', 'confidence'],
  properties: {
    firstName: STR,
    lastName: STR,
    name: STR,
    title: STR,
    company: STR,
    industry: STR,
    location: {
      type: 'object',
      additionalProperties: false,
      required: ['city', 'state', 'country'],
      properties: { city: STR, state: STR, country: STR },
    },
    socialProfiles: {
      type: 'object',
      additionalProperties: false,
      required: ['twitter', 'website'],
      properties: { twitter: STR, website: STR },
    },
    bio: STR,
    confidence: { type: 'number' },
  },
};

class GeminiAIService {

  async isApiKeyConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.warn('Failed to check AI availability:', error);
      return false;
    }
  }

  /** Live web research (OpenAI web search) for a contact by name; cited pages are in `sources`. */
  async researchContactByName(
    firstName: string,
    lastName: string,
    company?: string
  ): Promise<ContactEnrichmentData> {
    logger.info(`Researching contact: ${firstName} ${lastName} ${company ? `at ${company}` : ''}`);
    try {
      return await aiEnrichmentService.enrichContactByName(firstName, lastName, company);
    } catch (error) {
      logger.error('Contact research failed', error as Error);
      // Only the data we were given — nothing invented
      return {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        company: company || '',
        notes: `Research failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  /** Live web research (OpenAI web search) for the person behind a LinkedIn URL. */
  async researchContactByLinkedIn(linkedinUrl: string): Promise<ContactEnrichmentData> {
    logger.info(`Researching LinkedIn profile: ${linkedinUrl}`);
    try {
      const { data, sources } = await researchAI({
        schemaName: 'linkedin_research',
        schema: LINKEDIN_SCHEMA,
        system:
          'You are a B2B contact research assistant with web search. Report only facts you found for the person at this LinkedIn URL; use empty strings for anything not found. Never guess emails or phone numbers.',
        prompt: `Research the professional at this LinkedIn profile: ${linkedinUrl}`,
      });
      if (!data) throw new Error('The research returned no usable result');
      const nonEmpty = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));
      return {
        ...nonEmpty(data),
        location: nonEmpty(data.location || {}),
        socialProfiles: { ...nonEmpty(data.socialProfiles || {}), linkedin: linkedinUrl },
        confidence: Number(data.confidence) || undefined,
        sources,
      };
    } catch (error) {
      logger.error('LinkedIn profile research failed', error as Error);
      return {
        socialProfiles: { linkedin: linkedinUrl },
        notes: `Research failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  async generatePersonalizedMessage(
    contact: any,
    messageType: 'email' | 'linkedin' | 'cold-outreach'
  ): Promise<string> {
    logger.info(`Generating ${messageType} message for ${contact.name || 'contact'}`);

    const isConfigured = await this.isApiKeyConfigured();
    if (!isConfigured) {
      throw new Error('AI service is not available');
    }

    try {
      const { content } = await generateAI({
        maxTokens: 1024,
        prompt: `Generate a personalized ${messageType} message for a contact with the following information:
              ${JSON.stringify(contact, null, 2)}
              
              The message should be professional, concise, and tailored to their industry and role.`,
      });
      return content;
    } catch (error) {
      logger.error('Message generation failed', error as Error);
      // No template fallback: report the failure instead of passing off a canned message as AI output
      throw error;
    }
  }
}

// Create singleton instance
export const geminiService = new GeminiAIService();

// Create a useGemini hook that wraps the new services but provides the old interface
export const useGemini = () => {
  return {
    generateContent: async (request: any) => {
      try {
        if (request.prompt) {
          // For backward compatibility, if a prompt is provided, use enhancedGeminiService
          return await enhancedGeminiService.generateContent({
            prompt: request.prompt,
            model: request.model,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            systemInstruction: request.systemInstruction,
            customerId: request.customerId,
            featureUsed: request.featureUsed,
          });
        } else {
          // Return a compatible object for the old interface
          const content = await geminiService.generatePersonalizedMessage(request, 'email');
          return { content, model: 'gpt-6.2-sol', provider: 'OpenAI' };
        }
      } catch (error) {
        console.error('Error in useGemini.generateContent:', error);
        throw error;
      }
    },

    analyzeDeal: async (dealData: any, options: any = {}) => {
      try {
        const started = Date.now();
        const { data, model } = await generateAI({
          json: true,
          maxTokens: 1500,
          prompt: `Analyze this sales deal and return JSON {"riskLevel": "low"|"medium"|"high", "keyInsights": string[], "recommendedActions": string[], "winProbability": number 0-100, "potentialBlockers": string[]}.
Deal: ${JSON.stringify(dealData)}`,
        });
        if (!data) throw new Error('The AI returned an unreadable response');
        return {
          content: {
            riskLevel: data.riskLevel,
            keyInsights: data.keyInsights || [],
            recommendedActions: data.recommendedActions || [],
            winProbability: data.winProbability,
            potentialBlockers: data.potentialBlockers || [],
          },
          model,
          provider: 'OpenAI',
          responseTime: Date.now() - started,
          success: true,
        };
      } catch (error) {
        console.error('Error in useGemini.analyzeDeal:', error);
        return {
          content: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },

    analyzePipelineHealth: async (pipelineData: any, options: any = {}) => {
      try {
        const started = Date.now();
        const { data, model } = await generateAI({
          json: true,
          maxTokens: 1500,
          prompt: `Analyze the health of this sales pipeline and return JSON {"healthScore": number 0-100, "keyInsights": string[], "bottlenecks": string[], "opportunities": string[], "forecastAccuracy": number 0-100}.
Pipeline: ${JSON.stringify(pipelineData)}`,
        });
        if (!data) throw new Error('The AI returned an unreadable response');
        return {
          content: {
            healthScore: data.healthScore,
            keyInsights: data.keyInsights || [],
            bottlenecks: data.bottlenecks || [],
            opportunities: data.opportunities || [],
            forecastAccuracy: data.forecastAccuracy,
          },
          model,
          provider: 'OpenAI',
          responseTime: Date.now() - started,
          success: true,
        };
      } catch (error) {
        console.error('Error in useGemini.analyzePipelineHealth:', error);
        return {
          content: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },

    // Stub for other methods used by components
    generateEmail: async (context: any, customerId?: string, model?: string) => {
      try {
        const content = await geminiService.generatePersonalizedMessage(context, 'email');
        return {
          subject: `About: ${context.purpose || 'Your inquiry'}`,
          body: content,
        };
      } catch (error) {
        console.error('Error in useGemini.generateEmail:', error);
        throw error;
      }
    },

    getAvailableModels: async () => {
      return [
        {
          id: 'gpt-6.2-sol',
          name: 'GPT-6.2 Sol',
          provider: 'openai',
          capabilities: ['text-generation'],
        },
      ];
    },

    getRecommendedModel: async (useCase: string) => {
      return {
        id: 'gpt-6.2-sol',
        name: 'GPT-6.2 Sol',
        provider: 'openai',
      };
    },

    // The methods below are used by the AI Tools components; they previously did not exist,
    // so those tools threw "is not a function". All run on the user's OpenAI key via the server.

    // Gemini-SDK-shaped shim used by AutoFormCompleter and RealTimeEmailComposer
    getGenerativeModel: (_options?: { model?: string }) => ({
      generateContent: async (prompt: string) => {
        const { content } = await generateAI({ prompt, maxTokens: 2000 });
        return { response: { text: () => content } };
      },
    }),

    generateCustomerPersona: async (industry: string, companySize: string, painPoints: string[]) =>
      (
        await generateAI({
          prompt: `Create a detailed B2B customer persona for a company in the ${industry} industry with ${companySize} employees.
Key pain points: ${painPoints.join('; ')}.
Include: role and responsibilities, goals, challenges, buying motivations, objections, preferred channels, and messaging tips.`,
        })
      ).content,

    generateMeetingAgenda: async (meetingPurpose: string, attendees: string[], previousNotes?: string) =>
      (
        await generateAI({
          prompt: `Create a structured meeting agenda.
Purpose: ${meetingPurpose}
Attendees: ${attendees.join(', ')}
${previousNotes ? `Notes from the previous meeting: ${previousNotes}` : ''}
Include timed agenda items, owners, desired outcomes, and follow-up actions.`,
        })
      ).content,

    generateQuickContent: async (contentType: string, prompt: string, length: 'short' | 'medium' | 'long' = 'medium') =>
      (
        await generateAI({
          prompt: `Write a ${length} ${contentType} for the following request. Return only the ${contentType} text.\n\n${prompt}`,
          maxTokens: length === 'short' ? 400 : length === 'medium' ? 800 : 1600,
        })
      ).content,

    generateEmailResponse: async (originalEmail: string, contactInfo: any, dealContext?: string) =>
      (
        await generateAI({
          prompt: `Write a professional reply to this email.
Original email:
${originalEmail}

Contact: ${JSON.stringify(contactInfo)}
${dealContext ? `Deal context: ${dealContext}` : ''}
Return only the reply, including a subject line.`,
        })
      ).content,

    generateObjectionHandler: async (objection: string, productInfo: string) =>
      (
        await generateAI({
          prompt: `A prospect raised this sales objection: "${objection}".
Product information: ${productInfo}
Give an empathetic acknowledgement, 2-3 response strategies with example wording, supporting proof points, and a question to move the conversation forward.`,
        })
      ).content,

    optimizeVoiceTone: async (content: string, targetAudience: string, communicationGoal: string) =>
      (
        await generateAI({
          prompt: `Rewrite the following content for this audience: ${targetAudience}. Goal: ${communicationGoal}.
Keep the meaning, adjust tone, word choice and structure, then briefly list the key changes.

${content}`,
        })
      ).content,

    analyzeSentimentRealTime: async (text: string): Promise<{ sentiment: number; emotions: string[] }> => {
      const { data: parsed } = await generateAI({
        maxTokens: 200,
        schemaName: 'realtime_sentiment',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['sentiment', 'emotions'],
          properties: {
            sentiment: { type: 'number' },
            emotions: { type: 'array', items: { type: 'string' } },
          },
        },
        prompt: `Analyze the sentiment of this text. sentiment is from -1 (very negative) to 1 (very positive); emotions are up to 3 emotion words.\n\n${text}`,
      });
      if (!parsed) throw new Error('Sentiment analysis returned no result');
      return {
        sentiment: Math.max(-1, Math.min(1, Number(parsed.sentiment) || 0)),
        emotions: Array.isArray(parsed.emotions) ? parsed.emotions.map(String) : [],
      };
    },

    suggestPersonalization: async (contact: any, previousInteractions: any[]) =>
      (
        await generateAI({
          prompt: `Suggest how to personalize outreach to this contact.
Contact: ${JSON.stringify(contact)}
Previous interactions: ${JSON.stringify(previousInteractions)}
Give talking points, topics to reference, the best channel and timing, and a sample opening line.`,
        })
      ).content,

    validateFormField: async (fieldLabel: string, fieldValue: string, context: string) => {
      try {
        const content = await enhancedGeminiService.generateContent({
          prompt: `Validate this ${fieldLabel} field value: "${fieldValue}" in the context of a ${context} form. 
          
          Check for:
          - Appropriateness for the field type
          - Professional tone if applicable
          - Completeness and clarity
          - Any suggestions for improvement
          
          Return a JSON object with:
          {
            "valid": boolean,
            "message": "validation message or suggestion"
          }`,
          temperature: 0.3,
          maxTokens: 200,
        });

        // Try to parse the JSON response
        try {
          const jsonMatch = content.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
              valid: result.valid !== false, // Default to true if not explicitly false
              message: result.message || (result.valid ? 'Valid input' : 'Please check your input'),
            };
          }
        } catch (parseError) {
          // If JSON parsing fails, fall back to simple validation
        }

        // Fallback validation
        return {
          valid: fieldValue.trim().length > 0,
          message: fieldValue.trim().length > 0 ? 'Valid input' : 'This field is required',
        };
      } catch (error) {
        console.error('Error in validateFormField:', error);
        return {
          valid: fieldValue.trim().length > 0,
          message: fieldValue.trim().length > 0 ? 'Valid input' : 'This field is required',
        };
      }
    },
  };
};

export default geminiService;
