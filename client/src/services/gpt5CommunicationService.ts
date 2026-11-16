import { generateAI } from './aiGenerate';

export interface GPT5Request {
  type:
    | 'email'
    | 'message'
    | 'video-script'
    | 'meeting-summary'
    | 'content'
    | 'analysis'
    | 'optimization';
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
  // /api/gpt5/* never existed; these call the server's generation route with the user's OpenAI key.
  // Errors are thrown to the caller instead of returning placeholder results.

  async generateContent(params: GPT5Request): Promise<GPT5Response> {
    const { content } = await generateAI({
      json: true,
      prompt: `Write ${params.type} content. Return JSON {"content": string, "confidence": number 0-1, "suggestions": string[], "metadata": {"tone": string, "intent": string, "urgency": "low"|"medium"|"high", "sentiment": "positive"|"neutral"|"negative", "complexity": "simple"|"moderate"|"complex"}}.
${params.context || ''}
${params.content ? `Content: ${params.content}` : ''}
${params.goal ? `Goal: ${params.goal}` : ''}
${params.tone ? `Tone: ${params.tone}` : ''}
${params.constraints?.length ? `Constraints: ${params.constraints.join(', ')}` : ''}
${params.recipient ? `Recipient: ${JSON.stringify(params.recipient)}` : ''}`,
    });
    const parsed = JSON.parse(content);
    return {
      content: parsed.content || '',
      confidence: Number(parsed.confidence) || 0,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      metadata: {
        tone: parsed.metadata?.tone || params.tone || '',
        intent: parsed.metadata?.intent || params.type,
        urgency: parsed.metadata?.urgency || 'low',
        sentiment: parsed.metadata?.sentiment,
        complexity: parsed.metadata?.complexity,
      },
    };
  }

  async analyzeContent(content: string, type: string): Promise<AnalysisResult> {
    const { content: result } = await generateAI({
      json: true,
      prompt: `Analyze this ${type} content. Return JSON {"sentiment": "positive"|"neutral"|"negative", "intent": string, "keywords": string[], "urgency": "low"|"medium"|"high", "suggestions": string[], "score": number 0-1}.

${content}`,
    });
    return JSON.parse(result);
  }

  async optimizeContent(content: string, goal: string): Promise<OptimizationResult> {
    const { content: result } = await generateAI({
      json: true,
      prompt: `Improve this content for the goal "${goal}". Return JSON {"optimizedContent": string, "improvements": string[], "score": number 0-1, "recommendations": string[]}.

${content}`,
    });
    return JSON.parse(result);
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
      metadata: { length: params.length },
    });
  }

  async generateEmailResponse(params: {
    conversation: any[];
    recipient: any;
    tone: string;
  }): Promise<GPT5Response> {
    const context = params.conversation.map((msg) => `${msg.sender}: ${msg.content}`).join('\n');

    const prompt = `Generate a professional email response based on this conversation:
${context}

Respond as: Professional responding to ${params.recipient?.name || 'recipient'}
Tone: ${params.tone}`;

    return this.generateContent({
      type: 'email',
      context: prompt,
      recipient: params.recipient,
      tone: params.tone,
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
      constraints: ['max-160-chars'],
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
      metadata: { attendees },
    });
  }

  async optimizeBusinessContent(
    content: string,
    type: 'email' | 'proposal' | 'presentation'
  ): Promise<OptimizationResult> {
    return this.optimizeContent(content, `optimize-${type}`);
  }
}

export const gpt5Communication = new GPT5CommunicationService();
