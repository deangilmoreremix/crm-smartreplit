import { useMemo } from 'react';
import { openAIService } from '../services/openAIService';
import { tierModel } from '@shared/aiModels';

const unsupported = (feature: string) => () => {
  console.warn(`Demo agent: "${feature}" is not available in this build.`);
  return Promise.resolve();
};

const toLines = (text: string): string[] =>
  text
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

/**
 * Demo agent for DemoAgentModal. All text generation goes through the server
 * (openAIService -> POST /api/respond). Media features (recording, video export,
 * file extraction) have no backend yet and do not fabricate output.
 */
export const useOpenAIDemoAgent = () =>
  useMemo(() => {
    const ask = async (system: string, user: string, maxTokens = 800): Promise<string> => {
      const res = await openAIService.generateContent({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        model: tierModel('default'),
        featureUsed: 'demo-agent',
        temperature: 0.7,
        maxTokens,
      });
      return res.content;
    };

    return {
      loadPreviousDemo: async (_product: string): Promise<string[] | null> => null,
      extractPDFSummary: async (_file: File): Promise<string> => {
        throw new Error('PDF summarization is not available yet.');
      },
      extractDocxSummary: async (_file: File): Promise<string> => {
        throw new Error('DOCX summarization is not available yet.');
      },
      enrichFromURL: (url: string) =>
        ask(
          'You are a product research assistant. Do not invent facts; say when you are unsure.',
          `Summarize what is publicly known about the product at this URL: ${url}`
        ),
      coAnalyzeContent: (input: string) =>
        ask(
          'You are a sales engineer. Extract key features, benefits and target audience from the input.',
          input
        ),
      runAgent: (input: string) =>
        ask('You are a sales demo agent. Deliver a concise, persuasive product demo script.', input, 1200),
      speakAgent: async (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
        }
      },
      saveDemoToSupabase: async (_input: string, _result: string) => {},
      handleQAFlow: async (input: string) =>
        toLines(
          await ask(
            'Generate 3 likely customer questions about this product, one per line, no commentary.',
            input,
            300
          )
        ),
      suggestNextSteps: async (input: string) =>
        toLines(
          await ask(
            'Suggest 3 next steps for a sales rep after this demo, one per line, no commentary.',
            input,
            300
          )
        ),
      startRecording: async (): Promise<string> => {
        throw new Error('Voice recording is not available yet.');
      },
      detectEmotion: async (text: string) =>
        (
          await ask('Reply with a single word naming the emotion in the text.', text, 10)
        ).trim(),
      handleObjections: (objection: string) =>
        ask('You are a sales rep. Respond to the customer objection helpfully and concisely.', objection, 500),
      detectIntent: async (text: string) =>
        (await ask('Reply with a short phrase (max 3 words) naming the user intent.', text, 10)).trim(),
      continueConversation: (message: string, history: string[]) =>
        ask(
          'You are a sales demo agent continuing a conversation. Reply concisely.',
          `${history.join('\n')}\nUser: ${message}`,
          600
        ),
      exportDemoToVideo: unsupported('exportDemoToVideo') as (h: string[]) => Promise<void>,
      generateTeaserClip: unsupported('generateTeaserClip') as (h: string[]) => Promise<void>,
      generateSlidesWithVoiceOver: unsupported('generateSlidesWithVoiceOver') as (
        h: string[]
      ) => Promise<void>,
      addBrandOverlayToVideo: unsupported('addBrandOverlayToVideo'),
      generateSubtitledVideo: unsupported('generateSubtitledVideo'),
      applyBrandedSceneByIndustry: unsupported('applyBrandedSceneByIndustry'),
      triggerLiveScreenRecordingWithVoice: unsupported('triggerLiveScreenRecordingWithVoice'),
      createTimelineWithSceneEditor: unsupported('createTimelineWithSceneEditor') as (
        h: string[]
      ) => Promise<void>,
      recordLiveWalkthrough: unsupported('recordLiveWalkthrough'),
      autoThemeSwitchByCategory: unsupported('autoThemeSwitchByCategory'),
      openTimelineEditor: unsupported('openTimelineEditor'),
      previewDemoTeaser: unsupported('previewDemoTeaser'),
      scheduleDemoWorkflow: unsupported('scheduleDemoWorkflow'),
    };
  }, []);
