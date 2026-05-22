/**
 * AI Analysis Hooks
 * React hooks for integrating AI analysis into feature pages.
 * Provides loading states, error handling, and data management.
 */

import { useState, useCallback } from 'react';
import {
  aiSalesTools,
  aiCommunication,
  aiContent,
  aiProductivity,
  aiAdvanced,
  aiAutomation,
} from '../services/aiToolsApiService';

interface UseAIAnalysisOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAIAnalysis(options: UseAIAnalysisOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<any>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiCall();
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Analysis failed';
        setError(errorMsg);
        options.onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options.onSuccess, options.onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, error, data, execute, reset };
}

// Specialized hooks for each feature area

export function useLiveDealAnalysis() {
  const { loading, error, data, execute } = useAIAnalysis();

  const analyze = useCallback(
    (deals: any[]) => execute(() => aiSalesTools.liveDealAnalysis(deals)),
    [execute]
  );

  return { loading, error, analysis: data?.liveAnalysis, analyze };
}

export function usePipelineHealth() {
  const { loading, error, data, execute } = useAIAnalysis();

  const analyze = useCallback(
    (deals: any[]) => execute(() => aiSalesTools.pipelineHealth(deals)),
    [execute]
  );

  return { loading, error, health: data?.health, analyze };
}

export function useWinRateIntelligence() {
  const { loading, error, data, execute } = useAIAnalysis();

  const analyze = useCallback(
    (deals: any[]) => execute(() => aiSalesTools.winRateIntelligence(deals)),
    [execute]
  );

  return { loading, error, winRate: data?.winRate, analyze };
}

export function useDealRiskMonitor() {
  const { loading, error, data, execute } = useAIAnalysis();

  const analyze = useCallback(
    (deals: any[]) => execute(() => aiSalesTools.dealRiskMonitor(deals)),
    [execute]
  );

  return { loading, error, riskAnalysis: data?.riskAnalysis, analyze };
}

export function useSalesForecast() {
  const { loading, error, data, execute } = useAIAnalysis();

  const forecast = useCallback(
    (deals: any[], period?: string) => execute(() => aiSalesTools.salesForecast(deals, period)),
    [execute]
  );

  return { loading, error, forecast: data?.forecast, getForecast: forecast };
}

export function useConversionOptimization() {
  const { loading, error, data, execute } = useAIAnalysis();

  const optimize = useCallback(
    (deals: any[], contacts: any[]) => execute(() => aiSalesTools.conversionOptimization(deals, contacts)),
    [execute]
  );

  return { loading, error, optimization: data?.optimization, optimize };
}

export function useLeadScoring() {
  const { loading, error, data, execute } = useAIAnalysis();

  const score = useCallback(
    (contactData: any) => execute(() => aiSalesTools.leadScore(contactData)),
    [execute]
  );

  return { loading, error, scoring: data?.scoring, score };
}

export function useDealIntelligence() {
  const { loading, error, data, execute } = useAIAnalysis();

  const analyze = useCallback(
    (dealData: any, contactHistory?: any[], marketContext?: any) =>
      execute(() => aiSalesTools.dealIntelligence(dealData, contactHistory, marketContext)),
    [execute]
  );

  return { loading, error, intelligence: data?.intelligence, analyze };
}

export function useEmailComposer() {
  const { loading, error, data, execute } = useAIAnalysis();

  const compose = useCallback(
    (params: Parameters<typeof aiCommunication.composeEmail>[0]) =>
      execute(() => aiCommunication.composeEmail(params)),
    [execute]
  );

  return { loading, error, email: data?.email, compose };
}

export function useObjectionHandler() {
  const { loading, error, data, execute } = useAIAnalysis();

  const handle = useCallback(
    (objection: string, productInfo: string, contactData?: any) =>
      execute(() => aiCommunication.handleObjection(objection, productInfo, contactData)),
    [execute]
  );

  return { loading, error, response: data?.response, handle };
}

export function useMeetingSummarizer() {
  const { loading, error, data, execute } = useAIAnalysis();

  const summarize = useCallback(
    (transcript: string) => execute(() => aiProductivity.summarizeMeeting(transcript)),
    [execute]
  );

  return { loading, error, summary: data?.summary, summarize };
}

export function useContentGenerator() {
  const { loading, error, data, execute } = useAIAnalysis();

  const generate = useCallback(
    (params: Parameters<typeof aiContent.generateContent>[0]) =>
      execute(() => aiContent.generateContent(params)),
    [execute]
  );

  return { loading, error, content: data?.content, generate };
}

export function useBusinessAnalyzer() {
  const { loading, error, data, execute } = useAIAnalysis();

  const analyze = useCallback(
    (businessData: any) => execute(() => aiContent.analyzeBusiness(businessData)),
    [execute]
  );

  return { loading, error, analysis: data?.analysis, analyze };
}

export function useContactSegmentation() {
  const { loading, error, data, execute } = useAIAnalysis();

  const segment = useCallback(
    (contacts: any[], criteria?: string) => execute(() => aiAutomation.segmentContacts(contacts, criteria)),
    [execute]
  );

  return { loading, error, segments: data?.segments, segment };
}

export function useSemanticSearch() {
  const { loading, error, data, execute } = useAIAnalysis();

  const search = useCallback(
    (query: string, items?: any[]) => execute(() => aiAdvanced.semanticSearch(query, items)),
    [execute]
  );

  return { loading, error, results: data?.results, search };
}

export default {
  useLiveDealAnalysis,
  usePipelineHealth,
  useWinRateIntelligence,
  useDealRiskMonitor,
  useSalesForecast,
  useConversionOptimization,
  useLeadScoring,
  useDealIntelligence,
  useEmailComposer,
  useObjectionHandler,
  useMeetingSummarizer,
  useContentGenerator,
  useBusinessAnalyzer,
  useContactSegmentation,
  useSemanticSearch,
  useAIAnalysis,
};
