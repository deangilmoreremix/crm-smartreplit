export interface GPT5Request {
  type: 'email' | 'message' | 'video-script' | 'meeting-summary' | 'content' | 'analysis' | 'optimization';
  context?: string;
  recipient?: any;
  content?: string;
  goal?: string;
  tone?: string;
  constraints?: string[];
  metadata?: Record<string, any>;
}

export interface GPT5Response {
  content: string;
  confidence: number;
  suggestions: string[];
  metadata: {
    tone: string;
    intent: string;
    urgency: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    complexity?: 'simple' | 'moderate' | 'complex';
  };
}

export interface AnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string;
  keywords: string[];
  urgency: 'low' | 'medium' | 'high';
  suggestions: string[];
  score: number;
}

export interface OptimizationResult {
  optimizedContent: string;
  improvements: string[];
  score: number;
  recommendations: string[];
}

export class GPT5CommunicationService {
  private baseUrl = '/api/gpt5';

  async generateContent(params: GPT5Request): Promise<GPT5Response> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`GPT-5 API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GPT-5 generation error:', error);
      // Return fallback response
      return {
        content: 'AI generation temporarily unavailable. Please try again.',
        confidence: 0,
        suggestions: [],
        metadata: {
          tone: 'neutral',
          intent: 'fallback',
          urgency: 'low',
        },
      };
    }
  }

  async analyzeContent(content: string, type: string): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, type }),
      });

      if (!response.ok) {
        throw new Error(`GPT-5 analysis error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GPT-5 analysis error:', error);
      return {
        sentiment: 'neutral',
        intent: 'unknown',
        keywords: [],
        urgency: 'low',
        suggestions: [],
        score: 0.5,
      };
    }
  }

  async optimizeContent(content: string, goal: string): Promise<OptimizationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, goal }),
      });

      if (!response.ok) {
        throw new Error(`GPT-5 optimization error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GPT-5 optimization error:', error);
      return {
        optimizedContent: content,
        improvements: [],
        score: 0.5,
        recommendations: ['Content optimization temporarily unavailable'],
      };
    }
  }

  async generateVideoScript(params: {
    recipient: any;
    purpose: string;
    tone: string;
    length: number;
  }): Promise<GPT5Response> {
    const prompt = `Generate a compelling video email script for:
Recipient: ${params.recipient?.name || 'Unknown'} (${params.recipient?.company || 'Unknown Company'})
Purpose: ${params.purpose}
Tone: ${params.tone}
Length: ${params.length} seconds

Make it personalized, engaging, and professional.`;

    return this.generateContent({
      type: 'video-script',
      context: prompt,
      recipient: params.recipient,
      goal: params.purpose,
      tone: params.tone,
      metadata: { length: params.length }
    });
  }

  async generateEmailResponse(params: {
    conversation: any[];
    recipient: any;
    tone: string;
  }): Promise<GPT5Response> {
    const context = params.conversation.map(msg =>
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    const prompt = `Generate a professional email response based on this conversation:
${context}

Respond as: Professional responding to ${params.recipient?.name || 'recipient'}
Tone: ${params.tone}`;

    return this.generateContent({
      type: 'email',
      context: prompt,
      recipient: params.recipient,
      tone: params.tone
    });
  }

  async generateSMSReply(params: {
    message: string;
    context: string;
    tone: string;
  }): Promise<GPT5Response> {
    const prompt = `Generate a concise SMS reply to: "${params.message}"
Context: ${params.context}
Keep it under 160 characters. Tone: ${params.tone}`;

    return this.generateContent({
      type: 'message',
      context: prompt,
      tone: params.tone,
      constraints: ['max-160-chars']
    });
  }

  async analyzeSentiment(text: string): Promise<AnalysisResult> {
    return this.analyzeContent(text, 'sentiment');
  }

  async generateMeetingSummary(transcript: string, attendees: string[]): Promise<GPT5Response> {
    const prompt = `Generate a comprehensive meeting summary from this transcript:
${transcript}

Attendees: ${attendees.join(', ')}

Include: Key decisions, action items, and next steps.`;

    return this.generateContent({
      type: 'meeting-summary',
      context: prompt,
      metadata: { attendees }
    });
  }

  async optimizeBusinessContent(content: string, type: 'email' | 'proposal' | 'presentation'): Promise<OptimizationResult> {
    return this.optimizeContent(content, `optimize-${type}`);
  }
}

export const gpt5Communication = new GPT5CommunicationService();