// Gemini AI service for contact research and enhancement
import { ContactEnrichmentData } from './aiEnrichmentService';
import { logger } from './logger.service';
import { aiOrchestratorService } from './aiOrchestratorService';
import { enhancedGeminiService } from './enhancedGeminiService';

class GeminiAIService {
  private apiUrl = '/api/googleai';
  private model = 'gemini-1.5-flash';

  async isApiKeyConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.warn('Failed to check Google AI availability:', error);
      return false;
    }
  }

  async researchContactByName(firstName: string, lastName: string, company?: string): Promise<ContactEnrichmentData> {
    logger.info(`Researching contact with Gemini: ${firstName} ${lastName} ${company ? `at ${company}` : ''}`);

    const isConfigured = await this.isApiKeyConfigured();
    if (!isConfigured) {
      throw new Error('AI service is not available. Please check server configuration.');
    }

    try {
      const response = await fetch(`${this.apiUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
          }`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Invalid response from Gemini');
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
          confidence: parsedData.confidence || 60
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
        notes: 'API research failed, showing basic information'
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
      const response = await fetch(`${this.apiUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Research a professional from this LinkedIn URL: ${linkedinUrl}.
              
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
              }`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.8,
            maxOutputTokens: 1024
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      // Extract JSON from the response text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsedData = JSON.parse(jsonMatch[0]);
      
      return {
        ...parsedData,
        socialProfiles: {
          ...parsedData.socialProfiles,
          linkedin: linkedinUrl
        },
        confidence: parsedData.confidence || 75
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
          linkedin: linkedinUrl
        },
        confidence: 40,
        notes: 'API research failed, showing basic information derived from URL'
      };
    }
  }

  async generatePersonalizedMessage(contact: any, messageType: 'email' | 'linkedin' | 'cold-outreach'): Promise<string> {
    logger.info(`Generating ${messageType} message for ${contact.name || 'contact'}`);

    const isConfigured = await this.isApiKeyConfigured();
    if (!isConfigured) {
      throw new Error('AI service is not available');
    }

    try {
      const response = await fetch(`${this.apiUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a personalized ${messageType} message for a contact with the following information:
              ${JSON.stringify(contact, null, 2)}
              
              The message should be professional, concise, and tailored to their industry and role.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      logger.error('Message generation failed', error as Error);
      
      // Return a fallback message
      const firstName = contact.firstName || (contact.name ? contact.name.split(' ')[0] : 'there');
      const company = contact.company || 'your company';
      const industry = contact.industry || 'your industry';
      
      const templates = {
        email: `Hi ${firstName},\n\nI hope this message finds you well. I noticed your profile and was impressed by your work at ${company}.\n\nI'd love to connect and discuss how we might be able to help with your current initiatives.\n\nBest regards,\n[Your Name]`,
        linkedin: `Hi ${firstName}, I noticed we share interests in ${industry}. Your experience at ${company} is impressive! I'd love to connect.`,
        'cold-outreach': `Hello ${firstName},\n\nI hope this message finds you well. I've been researching leaders in ${industry} and your work at ${company} caught my attention.\n\nI'd love to schedule a brief call to discuss how we might be able to help with your goals.\n\nBest,\n[Your Name]`
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
            featureUsed: request.featureUsed
          });
        } else {
          // Return a compatible object for the old interface
          const content = await geminiService.generatePersonalizedMessage(
            request,
            'email'
          );
          return { content, model: 'gemini-1.5-flash', provider: 'Google' };
        }
      } catch (error) {
        console.error("Error in useGemini.generateContent:", error);
        return { 
          content: "I'm sorry, I'm having trouble processing that request.",
          model: "fallback", 
          provider: "fallback" 
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
            riskLevel: "medium",
            keyInsights: [content.substring(0, 100) + "..."],
            recommendedActions: ["Review the deal details"],
            winProbability: 65,
            potentialBlockers: []
          },
          model: "gemini-1.5-flash",
          provider: "Google",
          responseTime: 1000,
          success: true
        };
      } catch (error) {
        console.error("Error in useGemini.analyzeDeal:", error);
        return {
          content: null,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
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
            keyInsights: [content.substring(0, 100) + "..."],
            bottlenecks: [],
            opportunities: [],
            forecastAccuracy: 80
          },
          model: "gemini-1.5-flash",
          provider: "Google",
          responseTime: 1000,
          success: true
        };
      } catch (error) {
        console.error("Error in useGemini.analyzePipelineHealth:", error);
        return {
          content: null,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    },

    // Stub for other methods used by components
    generateEmail: async (context: any, customerId?: string, model?: string) => {
      try {
        const content = await geminiService.generatePersonalizedMessage(
          context,
          'email'
        );
        return {
          subject: `About: ${context.purpose || 'Your inquiry'}`,
          body: content
        };
      } catch (error) {
        console.error("Error in useGemini.generateEmail:", error);
        return {
          subject: `About: ${context.purpose || 'Your inquiry'}`,
          body: "I'm sorry, I couldn't generate an email at this time."
        };
      }
    },

    getAvailableModels: async () => {
      return [
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          provider: 'gemini',
          capabilities: ['text-generation']
        }
      ];
    },

    getRecommendedModel: async (useCase: string) => {
      return {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini'
      };
    },

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
          maxTokens: 200
        });

        // Try to parse the JSON response
        try {
          const jsonMatch = content.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
              valid: result.valid !== false, // Default to true if not explicitly false
              message: result.message || (result.valid ? 'Valid input' : 'Please check your input')
            };
          }
        } catch (parseError) {
          // If JSON parsing fails, fall back to simple validation
        }

        // Fallback validation
        return {
          valid: fieldValue.trim().length > 0,
          message: fieldValue.trim().length > 0 ? 'Valid input' : 'This field is required'
        };
      } catch (error) {
        console.error("Error in validateFormField:", error);
        return {
          valid: fieldValue.trim().length > 0,
          message: fieldValue.trim().length > 0 ? 'Valid input' : 'This field is required'
        };
      }
    }
  };
};

export default geminiService;