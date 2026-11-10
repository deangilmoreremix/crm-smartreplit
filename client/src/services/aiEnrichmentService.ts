// AI Contact Enrichment Service - server-side OpenAI (Responses API) via POST /api/respond

export interface ContactEnrichmentData {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  avatar?: string;
  bio?: string;
  notes?: string;
  confidence?: number;
  // New Multimodal fields
  inferredPersonalityTraits?: Record<string, string>;
  communicationStyle?: string;
  professionalDemeanor?: string;
  imageAnalysisNotes?: string;
}

export interface AIProvider {
  name: 'openai';
  enabled: boolean;
  apiKey?: string;
}

const ENRICHMENT_SHAPE = `{
  "firstName": string, "lastName": string, "name": string, "email": string, "phone": string,
  "title": string, "company": string, "industry": string,
  "location": { "city": string, "state": string, "country": string },
  "socialProfiles": { "linkedin": string, "twitter": string, "facebook": string, "website": string },
  "bio": string, "notes": string, "confidence": number (0-100),
  "inferredPersonalityTraits": { [trait: string]: string },
  "communicationStyle": string, "professionalDemeanor": string, "imageAnalysisNotes": string
}`;

const ENRICHMENT_RULES =
  'Return ONLY a JSON object using a subset of these keys. Include a field only if you are ' +
  'reasonably confident of it; omit anything you would have to guess. Never invent URLs, phone ' +
  'numbers or email addresses. Set "confidence" (0-100) to reflect how certain you are overall.';

class AIEnrichmentService {
  private providers: AIProvider[] = [
    { name: 'openai', enabled: true }, // Server-side check will determine availability
  ];

  private hasConfiguredProviders(): boolean {
    return this.providers.some((provider) => provider.enabled);
  }

  /**
   * Call the server's Responses API endpoint and parse a JSON object from output_text.
   * Throws on any failure; never returns fabricated data.
   */
  private async requestEnrichment<T = ContactEnrichmentData>(
    prompt: string,
    imageUrl?: string
  ): Promise<T> {
    if (!this.hasConfiguredProviders()) {
      throw new Error('No AI providers configured for enrichment');
    }

    const response = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        prompt,
        imageUrl,
        schema: { type: 'object' },
        temperature: 0.2,
        max_output_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `Enrichment request failed (${response.status})`);
    }

    const data = await response.json();
    const text: string = data.output_text || '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('Enrichment returned no structured data');
    }
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch {
      throw new Error('Enrichment returned invalid data');
    }
  }

  async enrichContactByEmail(
    email: string,
    includeSocialResearch: boolean = false
  ): Promise<ContactEnrichmentData> {
    const prompt =
      `Enrich this CRM contact using the email address${includeSocialResearch ? ' and public social presence' : ''}.\n` +
      `Email: ${email}\n${ENRICHMENT_RULES}\nShape: ${ENRICHMENT_SHAPE}`;
    try {
      return await this.requestEnrichment(prompt);
    } catch (error) {
      console.error('Contact enrichment by email failed', error);
      throw error;
    }
  }

  async enrichContactByName(
    firstName: string,
    lastName: string,
    company?: string
  ): Promise<ContactEnrichmentData> {
    const prompt =
      `Enrich this CRM contact using their name and company.\n` +
      `Name: ${firstName} ${lastName}\nCompany: ${company || ''}\n${ENRICHMENT_RULES}\nShape: ${ENRICHMENT_SHAPE}`;
    try {
      return await this.requestEnrichment(prompt);
    } catch (error) {
      console.error('Contact enrichment by name failed', error);
      throw error;
    }
  }

  async enrichContactMultimodal(contact: any, imageUrl: string): Promise<ContactEnrichmentData> {
    const prompt =
      `Analyze the contact's profile image together with the details below and enrich the record. ` +
      `Fill imageAnalysisNotes, inferredPersonalityTraits, communicationStyle and professionalDemeanor ` +
      `only from what is visible; do not guess sensitive attributes.\n` +
      `Name: ${contact.name || ''}\nTitle: ${contact.title || ''}\nCompany: ${contact.company || ''}\n` +
      `Email: ${contact.email || ''}\n${ENRICHMENT_RULES}\nShape: ${ENRICHMENT_SHAPE}`;
    try {
      return await this.requestEnrichment(prompt, imageUrl);
    } catch (error) {
      console.error('Multimodal enrichment failed', error);
      throw error;
    }
  }

  async findContactImage(_name: string, _company?: string): Promise<string> {
    // The server has no image-search capability; a model would only fabricate URLs.
    throw new Error('Contact image search is not available');
  }

  async enrichContactWithSocialResearch(
    contact: any,
    options: {
      platforms?: string[];
      depth?: 'basic' | 'comprehensive' | 'deep';
      includePersonalityAnalysis?: boolean;
      includeEngagementMetrics?: boolean;
    } = {}
  ): Promise<
    ContactEnrichmentData & {
      socialResearch?: any;
      personalityInsights?: any;
      engagementMetrics?: any;
    }
  > {
    const platforms = options.platforms || ['LinkedIn', 'Twitter', 'GitHub', 'Facebook'];
    const prompt =
      `Research this CRM contact's professional social presence (depth: ${options.depth || 'comprehensive'}). ` +
      `Platforms: ${platforms.join(', ')}. Only include profiles you can state with confidence.\n` +
      `Name: ${contact.name || ''}\nEmail: ${contact.email || ''}\nCompany: ${contact.company || ''}\n` +
      `Title: ${contact.title || ''}\nKnown profiles: ${JSON.stringify(contact.socialProfiles || {})}\n` +
      `${ENRICHMENT_RULES} Additionally you may include "socialResearch" (object)` +
      `${options.includePersonalityAnalysis !== false ? ', "personalityInsights" (object)' : ''}` +
      `${options.includeEngagementMetrics !== false ? ', "engagementMetrics" (object)' : ''}.\n` +
      `Shape: ${ENRICHMENT_SHAPE}`;
    try {
      return await this.requestEnrichment(prompt);
    } catch (error) {
      console.error('Comprehensive social research failed', error);
      throw error;
    }
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter((provider) => provider.enabled);
  }

  isServiceAvailable(): boolean {
    return this.hasConfiguredProviders();
  }

  getSupportedSocialPlatforms(): string[] {
    return [
      'LinkedIn',
      'Twitter',
      'Instagram',
      'TikTok',
      'YouTube',
      'GitHub',
      'Medium',
      'Facebook',
      'Snapchat',
      'Discord',
      'Reddit',
      'Pinterest',
      'Behance',
      'Dribbble',
      'AngelList',
      'Clubhouse',
      'Telegram',
      'WhatsApp',
    ];
  }
}

export const aiEnrichmentService = new AIEnrichmentService();
