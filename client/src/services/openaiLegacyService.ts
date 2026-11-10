/**
 * AI helpers for contacts/emails. All calls go through the server (POST /api/respond),
 * which holds the user's API key and uses the Responses API.
 */

interface RespondOptions {
  system: string;
  user: string;
  maxOutputTokens: number;
  temperature: number;
}

const respondText = async ({ system, user, maxOutputTokens, temperature }: RespondOptions) => {
  const response = await fetch('/api/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `${system}\n\n${user}`,
      temperature,
      max_output_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.output_text as string) || '';
};

export const useOpenAI = () => {
  const generateEmailDraft = async (
    contactName: string,
    purpose: string,
    additionalContext?: string
  ) => {
    const result = await respondText({
      system: 'You are an AI assistant helping a sales representative draft professional, highly personalized emails.',
      user: `Draft a professional email to ${contactName} for the following purpose: ${purpose}. ${additionalContext || ''} Keep it concise, friendly, and professional with a clear call-to-action.`,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    return result || 'Unable to generate email';
  };

  const optimizeSubjectLine = async (purpose: string, audience: string, keyMessage: string) => {
    const result = await respondText({
      system: 'You are an AI assistant specializing in crafting high-converting email subject lines.',
      user: `Generate 5 high-converting email subject lines for a ${purpose} email targeted at ${audience} with the key message about "${keyMessage}". 
          
          For each subject line:
          1. Provide the subject line
          2. Explain why it would be effective
          3. Estimate its potential open rate (%)
          4. Suggest the best time to send emails with this subject
          5. Include a brief tip on how to optimize the email body for this subject`,
      maxOutputTokens: 600,
      temperature: 0.8,
    });

    return result || 'Unable to generate subject lines';
  };

  const analyzeSentiment = async (text: string) => {
    const result = await respondText({
      system: 'You are an AI assistant that analyzes the sentiment and key insights of customer messages.',
      user: `Analyze the sentiment, key topics, and actionable insights of the following customer text: "${text}"`,
      maxOutputTokens: 300,
      temperature: 0.3,
    });

    return result || 'Unable to analyze sentiment';
  };

  const analyzeCustomerEmail = async (emailContent: string) => {
    const result = await respondText({
      system: `You are an AI assistant that analyzes customer emails to extract key insights. 
          Identify: 
          1. Key topics and concerns
          2. Sentiment (positive, neutral, negative)
          3. Urgency level
          4. Action items and follow-up needed
          5. Questions that need answers
          6. Decision stage indicators
          7. Recommended response approach`,
      user: `Analyze the following customer email and extract key insights:
          
          "${emailContent}"`,
      maxOutputTokens: 600,
      temperature: 0.3,
    });

    return result || 'Unable to analyze email';
  };

  const generateMeetingSummary = async (transcript: string) => {
    const result = await respondText({
      system: `You are an AI assistant that summarizes sales meetings and calls. 
          For each transcript, extract:
          1. Key discussion points
          2. Customer pain points and needs
          3. Objections raised
          4. Action items for follow-up (be very specific with each task)
          5. Decision makers involved
          6. Next steps agreed upon
          7. Overall sentiment and interest level`,
      user: `Summarize the following meeting transcript. Format the summary with clear headings and bullet points:
          
          "${transcript}"`,
      maxOutputTokens: 800,
      temperature: 0.4,
    });

    return result || 'Unable to generate meeting summary';
  };

  const generateScript = async (prompt: string) => {
    const result = await respondText({
      system: 'You are an expert sales call script generator. Create personalized, effective call scripts.',
      user: prompt,
      maxOutputTokens: 1000,
      temperature: 0.6,
    });

    return result || 'Unable to generate script';
  };

  const generateReasoning = async (prompt: string) => {
    const result = await respondText({
      system: 'You are an AI assistant that provides strategic reasoning and explanations for sales and marketing decisions.',
      user: prompt,
      maxOutputTokens: 500,
      temperature: 0.4,
    });

    return result || 'Unable to generate reasoning';
  };

  const generateEmailTemplate = async (contact: any, purpose: string) => {
    const result = await respondText({
      system: 'You are an AI assistant that generates professional email templates.',
      user: `Generate an email for ${contact.name} at ${contact.company} for purpose: ${purpose}`,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    const content = result;

    return {
      subject: `RE: ${purpose}`,
      body: content,
    };
  };

  const generateVisualContentIdea = async (prompt: string) => {
    const result = await respondText({
      system: 'You are a creative AI assistant that generates visual content ideas and concepts.',
      user: prompt,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    return result || 'Unable to generate visual content idea';
  };

  return {
    generateEmailDraft,
    optimizeSubjectLine,
    analyzeSentiment,
    analyzeCustomerEmail,
    generateMeetingSummary,
    generateScript,
    generateReasoning,
    generateEmailTemplate,
    generateVisualContentIdea,
  };
};
