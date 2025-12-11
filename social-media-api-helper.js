
/**
 * Server-side API helper for GPT-5 Social Media Research
 * Use this for backend integrations
 */

class SocialMediaAPIHelper {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    this.rateLimitDelay = options.rateLimitDelay || 1000;
  }

  async makeGPT5Request(messages, options = {}) {
    const requestBody = {
      model: 'gpt-5',
      messages,
      response_format: { type: "json_object" },
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 3000,
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (error) {
      console.error('GPT-5 request failed:', error);
      throw error;
    }
  }

  async researchContactSocial(contact, platforms = [], depth = 'comprehensive') {
    const systemPrompt = `You are an expert social media researcher with access to web search capabilities. Research the given contact across multiple platforms and provide detailed, accurate insights. Use your web search tools to find real, up-to-date information.

Return comprehensive JSON with:
1. profiles: Array of verified social media profiles with confidence scores
2. personalityInsights: Detailed personality analysis from content
3. engagementMetrics: Posting patterns and engagement data
4. professionalUpdates: Recent job changes, achievements, news
5. monitoringRecommendations: Strategic monitoring suggestions
6. confidenceScore: Overall research confidence (0-100)`;

    const userPrompt = `Research social media presence for:
Name: ${contact.name}
Email: ${contact.email || 'Not provided'}
Company: ${contact.company || 'Not provided'}
Title: ${contact.title || 'Not provided'}

Platforms to research: ${platforms.join(', ') || 'All major platforms'}
Research depth: ${depth}

Focus on:
- Professional networking profiles (LinkedIn priority)
- Business-relevant social media activity
- Communication style and preferences
- Recent professional updates
- Engagement patterns and optimal outreach timing

Provide actionable insights for business relationship building.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for social media profiles and professional information"
        }
      },
      {
        type: "function", 
        function: {
          name: "profile_verification",
          description: "Verify authenticity and accuracy of found social profiles"
        }
      }
    ];

    return await this.makeGPT5Request(messages, { tools });
  }

  async generatePersonalityProfile(contact, socialData) {
    const systemPrompt = `You are an expert behavioral analyst specializing in professional personality assessment from social media data. Analyze the provided social media information to create detailed personality insights for business relationship building.`;

    const userPrompt = `Analyze personality traits for business professional:
Contact: ${contact.name} (${contact.title || 'Unknown'} at ${contact.company || 'Unknown'})

Social Media Data:
${JSON.stringify(socialData, null, 2)}

Provide detailed analysis of:
1. Communication style and preferences
2. Decision-making patterns
3. Professional demeanor and approach
4. Optimal business relationship strategies
5. Potential concerns or risk factors
6. Relationship building opportunities

Focus on actionable insights for B2B sales and relationship management.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.makeGPT5Request(messages);
  }

  async bulkResearchContacts(contacts, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 3;
    const delay = options.delay || this.rateLimitDelay;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (contact) => {
        try {
          const result = await this.researchContactSocial(
            contact,
            options.platforms || [],
            options.depth || 'comprehensive'
          );
          return { contactId: contact.id, success: true, data: result };
        } catch (error) {
          return { 
            contactId: contact.id, 
            success: false, 
            error: error.message 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches to respect rate limits
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  async validateProfile(profileUrl, contactInfo) {
    const systemPrompt = `You are a social media profile validation expert. Analyze the given profile URL and contact information to determine if they match and provide a confidence score.`;

    const userPrompt = `Validate social media profile:
Profile URL: ${profileUrl}
Contact Name: ${contactInfo.name}
Company: ${contactInfo.company || 'Unknown'}
Email: ${contactInfo.email || 'Unknown'}
Title: ${contactInfo.title || 'Unknown'}

Analyze and provide:
1. Match probability (0-100%)
2. Validation reasoning
3. Risk factors if any
4. Recommendation (use/don't use)`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.makeGPT5Request(messages);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialMediaAPIHelper;
}

// Example usage for Node.js/Express
if (typeof require !== 'undefined') {
  // Example Express.js route handler
  const createExpressHandler = (apiKey) => {
    const helper = new SocialMediaAPIHelper(apiKey);
    
    return async (req, res) => {
      try {
        const { contact, platforms, depth } = req.body;
        
        if (!contact || !contact.name) {
          return res.status(400).json({ error: 'Contact name is required' });
        }

        const results = await helper.researchContactSocial(contact, platforms, depth);
        
        res.json({
          success: true,
          data: results,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Social research failed:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    };
  };

  // Export Express handler factory
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.createExpressHandler = createExpressHandler;
  }
}
