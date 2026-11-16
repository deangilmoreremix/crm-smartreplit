import { generateAI } from './aiGenerate';

// These helpers previously created an OpenAI client in the browser (dangerouslyAllowBrowser) from a key
// nothing ever set. getClient() now returns a small chat.completions shim backed by the server
// (POST /api/ai/generate), which uses the signed-in user's own OpenAI key.
const serverChatClient = {
  chat: {
    completions: {
      create: async (params: {
        model?: string;
        messages: Array<{ role: string; content: string }>;
        max_tokens?: number;
        temperature?: number;
      }) => {
        const system = params.messages
          .filter((m) => m.role === 'system')
          .map((m) => m.content)
          .join('\n\n');
        const prompt = params.messages
          .filter((m) => m.role !== 'system')
          .map((m) => m.content)
          .join('\n\n');
        const { content } = await generateAI({
          prompt,
          system: system || undefined,
          maxTokens: params.max_tokens,
          tier: params.model?.includes('sol') ? 'advanced' : 'default',
        });
        return { choices: [{ message: { content } }] };
      },
    },
  },
};

export const useOpenAI = () => {
  const getClient = () => serverChatClient;

  const generateEmailDraft = async (
    contactName: string,
    purpose: string,
    additionalContext?: string
  ) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant helping a sales representative draft professional, highly personalized emails.',
        },
        {
          role: 'user',
          content: `Draft a professional email to ${contactName} for the following purpose: ${purpose}. ${additionalContext || ''} Keep it concise, friendly, and professional with a clear call-to-action.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Unable to generate email';
  };

  const optimizeSubjectLine = async (purpose: string, audience: string, keyMessage: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant specializing in crafting high-converting email subject lines.',
        },
        {
          role: 'user',
          content: `Generate 5 high-converting email subject lines for a ${purpose} email targeted at ${audience} with the key message about "${keyMessage}". 
          
          For each subject line:
          1. Provide the subject line
          2. Explain why it would be effective
          3. Estimate its potential open rate (%)
          4. Suggest the best time to send emails with this subject
          5. Include a brief tip on how to optimize the email body for this subject`,
        },
      ],
      max_tokens: 600,
      temperature: 0.8,
    });

    return response.choices[0].message.content || 'Unable to generate subject lines';
  };

  const analyzeSentiment = async (text: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6-luna',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that analyzes the sentiment and key insights of customer messages.',
        },
        {
          role: 'user',
          content: `Analyze the sentiment, key topics, and actionable insights of the following customer text: "${text}"`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.choices[0].message.content || 'Unable to analyze sentiment';
  };

  const analyzeCustomerEmail = async (emailContent: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6-luna',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes customer emails to extract key insights. 
          Identify: 
          1. Key topics and concerns
          2. Sentiment (positive, neutral, negative)
          3. Urgency level
          4. Action items and follow-up needed
          5. Questions that need answers
          6. Decision stage indicators
          7. Recommended response approach`,
        },
        {
          role: 'user',
          content: `Analyze the following customer email and extract key insights:
          
          "${emailContent}"`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    return response.choices[0].message.content || 'Unable to analyze email';
  };

  const generateMeetingSummary = async (transcript: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that summarizes sales meetings and calls. 
          For each transcript, extract:
          1. Key discussion points
          2. Customer pain points and needs
          3. Objections raised
          4. Action items for follow-up (be very specific with each task)
          5. Decision makers involved
          6. Next steps agreed upon
          7. Overall sentiment and interest level`,
        },
        {
          role: 'user',
          content: `Summarize the following meeting transcript. Format the summary with clear headings and bullet points:
          
          "${transcript}"`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    return response.choices[0].message.content || 'Unable to generate meeting summary';
  };

  const generateScript = async (prompt: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert sales call script generator. Create personalized, effective call scripts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.6,
    });

    return response.choices[0].message.content || 'Unable to generate script';
  };

  const generateReasoning = async (prompt: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that provides strategic reasoning and explanations for sales and marketing decisions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.4,
    });

    return response.choices[0].message.content || 'Unable to generate reasoning';
  };

  const generateEmailTemplate = async (contact: any, purpose: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that generates professional email templates.',
        },
        {
          role: 'user',
          content: `Generate an email for ${contact.name} at ${contact.company} for purpose: ${purpose}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '';

    return {
      subject: `RE: ${purpose}`,
      body: content,
    };
  };

  const generateVisualContentIdea = async (prompt: string) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6.1-sol',
      messages: [
        {
          role: 'system',
          content:
            'You are a creative AI assistant that generates visual content ideas and concepts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Unable to generate visual content idea';
  };

  const predictLeadScore = async (contact: any) => {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: 'gpt-6-luna',
      messages: [
        {
          role: 'system',
          content: 'You are a B2B sales analyst. Base the assessment only on the data given.',
        },
        {
          role: 'user',
          content: `Give this contact a lead score from 0 to 100, then explain the main factors and the next best action, as short Markdown.

Contact: ${JSON.stringify(contact)}`,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || 'Unable to score lead';
  };

  return {
    predictLeadScore,
    generateEmailDraft,
    optimizeSubjectLine,
    analyzeSentiment,
    analyzeCustomerEmail,
    generateMeetingSummary,
    generateScript,
    generateReasoning,
    generateEmailTemplate,
    generateVisualContentIdea,
    getClient,
  };
};
