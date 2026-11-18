// Contact enrichment with live web research (OpenAI Responses API web_search via POST /api/ai/research),
// on the signed-in user's own OpenAI key. Previously this called a Supabase `ai-enrichment` edge function
// whose source is not in this repository, authenticated only with the public anon key.
import { generateAI, researchAI, type UrlSource } from './aiGenerate';
import { gpt5SocialResearchService } from './gpt5SocialResearchService';

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
  /** Web pages the research cited. */
  sources?: UrlSource[];
}

export interface AIProvider {
  name: 'openai';
  enabled: boolean;
  apiKey?: string;
}

const str = { type: 'string' };
/** Strict JSON Schema for a researched person; unknown values come back as empty strings. */
const PERSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'firstName',
    'lastName',
    'name',
    'email',
    'phone',
    'title',
    'company',
    'industry',
    'location',
    'socialProfiles',
    'avatar',
    'bio',
    'confidence',
  ],
  properties: {
    firstName: str,
    lastName: str,
    name: str,
    email: str,
    phone: str,
    title: str,
    company: str,
    industry: str,
    location: {
      type: 'object',
      additionalProperties: false,
      required: ['city', 'state', 'country'],
      properties: { city: str, state: str, country: str },
    },
    socialProfiles: {
      type: 'object',
      additionalProperties: false,
      required: ['linkedin', 'twitter', 'facebook', 'website'],
      properties: { linkedin: str, twitter: str, facebook: str, website: str },
    },
    avatar: str,
    bio: str,
    confidence: { type: 'number' },
  },
};

const RESEARCH_SYSTEM =
  'You are a B2B contact research assistant with web search. Report only facts you found on the web for this exact person, ' +
  'with URLs taken from search results. Never guess emails or phone numbers; use an empty string for anything you did not find. ' +
  'confidence is 0-100 for how sure you are the results are the right person.';

/** Drop empty strings and empty nested objects from model output. */
function clean(value: any): any {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v);
      if (c === '' || c == null) continue;
      if (typeof c === 'object' && !Array.isArray(c) && Object.keys(c).length === 0) continue;
      out[k] = c;
    }
    return out;
  }
  return value;
}

async function researchPerson(description: string): Promise<ContactEnrichmentData> {
  const { data, sources } = await researchAI({
    system: RESEARCH_SYSTEM,
    schema: PERSON_SCHEMA,
    schemaName: 'contact_enrichment',
    prompt: `Research this professional and fill in their public business profile.\n\n${description}`,
  });
  if (!data) throw new Error('The research returned no usable result');
  return { ...clean(data), sources };
}

class AIEnrichmentService {
  private providers: AIProvider[] = [{ name: 'openai', enabled: true }];

  async enrichContactByEmail(email: string, includeSocialResearch: boolean = false): Promise<ContactEnrichmentData> {
    const result = await researchPerson(`Email address: ${email}`);
    if (!includeSocialResearch) return { ...result, email: result.email || email };

    const social = await gpt5SocialResearchService.researchContactSocialMedia(
      { id: 'enrichment', name: result.name || email, email, company: result.company, title: result.title } as any,
      [],
      'comprehensive'
    );
    return {
      ...result,
      email: result.email || email,
      inferredPersonalityTraits: social.personalityInsights.traits,
      communicationStyle: social.personalityInsights.communicationStyle,
      professionalDemeanor: social.personalityInsights.professionalDemeanor,
      sources: [...(result.sources || []), ...(social.sources || [])],
    };
  }

  async enrichContactByName(firstName: string, lastName: string, company?: string): Promise<ContactEnrichmentData> {
    return researchPerson(`Name: ${firstName} ${lastName}${company ? `\nCompany: ${company}` : ''}`);
  }

  /** Enrich from a photo plus the contact record (image input; no web search needed). */
  async enrichContactMultimodal(contact: any, imageUrl: string): Promise<ContactEnrichmentData> {
    const { data } = await generateAI({
      images: [imageUrl],
      schemaName: 'multimodal_enrichment',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['imageAnalysisNotes', 'communicationStyle', 'professionalDemeanor', 'traits'],
        properties: {
          imageAnalysisNotes: str,
          communicationStyle: str,
          professionalDemeanor: str,
          traits: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'value'],
              properties: { name: str, value: str },
            },
          },
        },
      },
      prompt: `Describe this professional photo for a salesperson (setting, presentation) and infer communication style cautiously. Contact: ${JSON.stringify(
        { name: contact.name, title: contact.title, company: contact.company }
      )}`,
    });
    if (!data) throw new Error('The image analysis returned no usable result');
    return {
      imageAnalysisNotes: data.imageAnalysisNotes,
      communicationStyle: data.communicationStyle,
      professionalDemeanor: data.professionalDemeanor,
      inferredPersonalityTraits: Object.fromEntries((data.traits || []).map((t: any) => [t.name, t.value])),
    };
  }

  /** A public headshot / profile image URL found by web search, or '' when none is found. */
  async findContactImage(name: string, company?: string): Promise<string> {
    const { data } = await researchAI({
      schemaName: 'contact_image',
      schema: { type: 'object', additionalProperties: false, required: ['imageUrl'], properties: { imageUrl: str } },
      system: 'Only return a direct image URL you found on a public page about this exact person; otherwise an empty string.',
      prompt: `Find a public profile photo URL for ${name}${company ? ` at ${company}` : ''}.`,
    });
    return typeof data?.imageUrl === 'string' ? data.imageUrl : '';
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
    const social = await gpt5SocialResearchService.researchContactSocialMedia(
      contact,
      options.platforms || [],
      options.depth || 'comprehensive'
    );
    const byPlatform = (name: string) =>
      social.profiles.find((p) => p.platform.toLowerCase().includes(name))?.url;
    return {
      name: contact.name,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      socialProfiles: {
        linkedin: byPlatform('linkedin') || contact.socialProfiles?.linkedin,
        twitter: byPlatform('twitter') || byPlatform('x') || contact.socialProfiles?.twitter,
        facebook: byPlatform('facebook') || contact.socialProfiles?.facebook,
        website: contact.socialProfiles?.website,
      },
      confidence: social.confidenceScore,
      socialResearch: social,
      ...(options.includePersonalityAnalysis !== false ? { personalityInsights: social.personalityInsights } : {}),
      ...(options.includeEngagementMetrics !== false ? { engagementMetrics: social.engagementMetrics } : {}),
      sources: social.sources,
    };
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter((provider) => provider.enabled);
  }

  /** Availability is decided server-side (the user's own OpenAI key); requests report a missing key. */
  isServiceAvailable(): boolean {
    return true;
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
