import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import { copyToClipboard, saveToFile, generateFilename } from '../../services/openaiStreamService';
import AIToolContent from '../shared/AIToolContent';
import { BarChart3, PieChart, Copy, Check, Save, AlertCircle } from 'lucide-react';

const SalesForecastContent: React.FC = () => {
  const [formData, setFormData] = useState({
    timeframe: 'Q3 2023',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCopy = async () => {
    if (result) {
      const success = await copyToClipboard(result);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleSave = () => {
    if (result) {
      const filename = generateFilename('sales-forecast', 'txt');
      saveToFile(result, filename, 'text/plain');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const deals = [
        { title: 'Enterprise License', value: 75000, stage: 'negotiation', probability: 0.7 },
        { title: 'Support Contract', value: 25000, stage: 'proposal', probability: 0.5 },
        { title: 'Software Renewal', value: 45000, stage: 'closed-won', probability: 1.0 },
        { title: 'Cloud Migration', value: 95000, stage: 'initial', probability: 0.3 },
        { title: 'Consulting Services', value: 50000, stage: 'negotiation', probability: 0.6 },
      ];

      const resultText = await edgeFunctionService.generateSalesForecast(deals, formData.timeframe);
      setResult(resultText);
    } catch (err) {
      console.error('Error generating sales forecast:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while generating the forecast'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <PieChart className="text-blue-600 mt-1 mr-3 h-5 w-5" />
          <div>
            <h3 className="font-medium text-blue-800">Sales Forecasting</h3>
            <p className="text-sm text-blue-700 mt-1">
              Generate AI-powered revenue projections and deal closure probability analysis for your
              sales pipeline.
            </p>
          </div>
        </div>
      </div>

      <AIToolContent
        isLoading={isLoading}
        error={error}
        result={result}
        loadingMessage="Generating sales forecast..."
        resultTitle="Sales Forecast"
      >
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Generate Sales Forecast</h2>
          <p className="text-gray-600 mb-6">
            Use AI to analyze your deals pipeline and generate accurate revenue projections,
            probability-weighted forecasts, and recommendations.
          </p>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h4 className="font-medium text-gray-700 mb-2">
              Sample Pipeline Data (For Demonstration)
            </h4>
            <p className="text-sm text-gray-600 mb-2">This forecast will analyze:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-2">
              <li>Enterprise License: $75,000 (Negotiation, 70% probability)</li>
              <li>Support Contract: $25,000 (Proposal, 50% probability)</li>
              <li>Software Renewal: $45,000 (Closed-won, 100% probability)</li>
              <li>Cloud Migration: $95,000 (Initial, 30% probability)</li>
              <li>Consulting Services: $50,000 (Negotiation, 60% probability)</li>
            </ul>
            <p className="text-sm text-gray-600 italic">
              Total pipeline: $290,000 (Weighted: $164,000)
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
                Forecast Timeframe
              </label>
              <select
                id="timeframe"
                name="timeframe"
                value={formData.timeframe}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="Q3 2023">Q3 2023</option>
                <option value="Q4 2023">Q4 2023</option>
                <option value="Full Year 2023">Full Year 2023</option>
                <option value="First Half 2024">First Half 2024</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors disabled:bg-blue-300"
            >
              {isLoading ? (
                <span className="animate-pulse">Generating forecast...</span>
              ) : (
                <>
                  <BarChart3 size={18} />
                  Generate Sales Forecast
                </>
              )}
            </button>
          </form>
        </div>
      </AIToolContent>

      {result && !isLoading && !error && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleSave}
            className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
              saved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {saved ? <Check size={14} className="mr-1" /> : <Save size={14} className="mr-1" />}
            {saved ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center text-red-600 text-sm">
          <AlertCircle size={14} className="mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default SalesForecastContent;
