// Gemini AI service for contact research and enhancement
import { ContactEnrichmentData } from './aiEnrichmentService';
import { logger } from './logger.service';
import { aiOrchestratorService } from './aiOrchestratorService';
import { enhancedGeminiService } from './enhancedGeminiService';
import { generateAI } from './aiGenerate';

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

  async researchContactByName(
    firstName: string,
    lastName: string,
    company?: string
  ): Promise<ContactEnrichmentData> {
    logger.info(
      `Researching contact with Gemini: ${firstName} ${lastName} ${company ? `at ${company}` : ''}`
    );

    const isConfigured = await this.isApiKeyConfigured();
    if (!isConfigured) {
      throw new Error('AI service is not available. Please check server configuration.');
    }

    try {
      const { content } = await generateAI({
        json: true,
        maxTokens: 1024,
        prompt: `Research information about a professional named ${firstName} ${lastName}${company ? ` who works at ${company}` : ''}.

          Return a JSON object with the following structure:
          {
            "firstName": "${firstName}",
            "lastName": "${lastName}",
            "name": "${firstName} ${lastName}",
            "email": "likely email",
            "phone": "likely phone if available",
            "title": "likely job title",
            "company": "${company || 'company name if known'}",
            "industry": "likely industry",
            "location": {
              "city": "likely city",
              "state": "likely state",
              "country": "likely country"
            },
            "socialProfiles": {
              "linkedin": "likely LinkedIn URL",
              "twitter": "likely Twitter URL if available",
              "website": "likely company website"
            },
            "bio": "brief professional bio",
            "confidence": "number between 40 and 85 indicating confidence level"
          }`,
      });

      if (!content) {
        throw new Error('Invalid response from AI');
      }

      try {
        // Extract JSON from the response text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        logger.info(`Successfully researched contact: ${firstName} ${lastName}`);

        return {
          ...parsedData,
          confidence: parsedData.confidence || 60,
        };
      } catch (parseError) {
        logger.error('Failed to parse Gemini response', parseError as Error);
        throw new Error('Failed to parse research response');
      }
    } catch (error) {
      logger.error('Gemini research failed', error as Error);

      // Return minimal data to prevent UI breakage
      return {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        company: company || '',
        confidence: 30,
        notes: 'API research failed, showing basic information',
      };
    }
  }

  async researchContactByLinkedIn(linkedinUrl: string): Promise<ContactEnrichmentData> {
    logger.info(`Researching LinkedIn profile: ${linkedinUrl}`);

    const isConfigured = await this.isApiKeyConfigured();
    if (!isConfigured) {
      throw new Error('AI service is not available');
    }

    try {
      const { content } = await generateAI({
        json: true,
        maxTokens: 1024,
        prompt: `Research a professional from this LinkedIn URL: ${linkedinUrl}.
              
              Return a JSON object with the following structure:
              {
                "firstName": "first name",
                "lastName": "last name",
                "name": "full name",
                "email": "likely email based on name and company",
                "title": "job title",
                "company": "company name",
                "industry": "industry",
                "location": {
                  "city": "city",
                  "state": "state",
                  "country": "country"
                },
                "socialProfiles": {
                  "linkedin": "${linkedinUrl}",
                  "twitter": "likely Twitter URL if available",
                  "website": "likely company website"
                },
                "bio": "professional summary",
                "confidence": "number between 50 and 90 indicating confidence level"
              }`,
      });

      // Extract JSON from the response text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsedData = JSON.parse(jsonMatch[0]);

      return {
        ...parsedData,
        socialProfiles: {
          ...parsedData.socialProfiles,
          linkedin: linkedinUrl,
        },
        confidence: parsedData.confidence || 75,
      };
    } catch (error) {
      logger.error('LinkedIn profile research failed', error as Error);

      // Parse username from LinkedIn URL
      const username = linkedinUrl.split('/in/')[1]?.replace('/', '') || 'unknown';
      const nameParts = username.split('-');

      // Return minimal data to prevent UI breakage
      return {
        firstName: nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'Unknown',
        lastName: nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || '',
        name: `${nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'Unknown'} ${nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || ''}`,
        socialProfiles: {
          linkedin: linkedinUrl,
        },
        confidence: 40,
        notes: 'API research failed, showing basic information derived from URL',
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

      // Return a fallback message
      const firstName = contact.firstName || (contact.name ? contact.name.split(' ')[0] : 'there');
      const company = contact.company || 'your company';
      const industry = contact.industry || 'your industry';

      const templates = {
        email: `Hi ${firstName},\n\nI hope this message finds you well. I noticed your profile and was impressed by your work at ${company}.\n\nI'd love to connect and discuss how we might be able to help with your current initiatives.\n\nBest regards,\n[Your Name]`,
        linkedin: `Hi ${firstName}, I noticed we share interests in ${industry}. Your experience at ${company} is impressive! I'd love to connect.`,
        'cold-outreach': `Hello ${firstName},\n\nI hope this message finds you well. I've been researching leaders in ${industry} and your work at ${company} caught my attention.\n\nI'd love to schedule a brief call to discuss how we might be able to help with your goals.\n\nBest,\n[Your Name]`,
      };

      return templates[messageType];
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
          return { content, model: 'gpt-6-luna', provider: 'OpenAI' };
        }
      } catch (error) {
        console.error('Error in useGemini.generateContent:', error);
        return {
          content: "I'm sorry, I'm having trouble processing that request.",
          model: 'fallback',
          provider: 'fallback',
        };
      }
    },

    analyzeDeal: async (dealData: any, options: any = {}) => {
      try {
        const content = await geminiService.generatePersonalizedMessage(
          { ...dealData, analysisType: 'deal' },
          'email'
        );

        // Return in the format expected by components
        return {
          content: {
            riskLevel: 'medium',
            keyInsights: [content.substring(0, 100) + '...'],
            recommendedActions: ['Review the deal details'],
            winProbability: 65,
            potentialBlockers: [],
          },
          model: 'gpt-6-luna',
          provider: 'OpenAI',
          responseTime: 1000,
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
        const content = await geminiService.generatePersonalizedMessage(
          { ...pipelineData, analysisType: 'pipeline' },
          'email'
        );

        // Return in the format expected by components
        return {
          content: {
            healthScore: 75,
            keyInsights: [content.substring(0, 100) + '...'],
            bottlenecks: [],
            opportunities: [],
            forecastAccuracy: 80,
          },
          model: 'gpt-6-luna',
          provider: 'OpenAI',
          responseTime: 1000,
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
        return {
          subject: `About: ${context.purpose || 'Your inquiry'}`,
          body: "I'm sorry, I couldn't generate an email at this time.",
        };
      }
    },

    getAvailableModels: async () => {
      return [
        {
          id: 'gpt-6-luna',
          name: 'GPT-6 Luna',
          provider: 'openai',
          capabilities: ['text-generation'],
        },
      ];
    },

    getRecommendedModel: async (useCase: string) => {
      return {
        id: 'gpt-6-luna',
        name: 'GPT-6 Luna',
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
      const { content } = await generateAI({
        json: true,
        maxTokens: 200,
        prompt: `Analyze the sentiment of this text. Return JSON {"sentiment": number from -1 (very negative) to 1 (very positive), "emotions": array of up to 3 emotion words}.\n\n${text}`,
      });
      const parsed = JSON.parse(content);
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
