import React, { useState } from 'react';
import { generateAI } from '../../services/aiGenerate';
import StructuredAIResult from '../shared/StructuredAIResult';
import { Target, AlertCircle, ArrowRight, Loader2, Mail } from 'lucide-react';

const SUBJECT_SCHEMA = {
  type: 'object',
  properties: {
    subjects: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, rationale: { type: 'string' } },
        required: ['text', 'rationale'],
        additionalProperties: false,
      },
    },
    bestSendTime: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: ['subjects', 'bestSendTime'],
  additionalProperties: false,
};

const SubjectLineContent: React.FC = () => {
  const [formData, setFormData] = useState({
    purpose: '',
    audience: '',
    keyMessage: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Purpose options for email
  const purposeOptions = [
    { value: 'follow-up', label: 'Follow Up' },
    { value: 'introduction', label: 'Introduction' },
    { value: 'product-announcement', label: 'Product Announcement' },
    { value: 'invitation', label: 'Invitation' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'request', label: 'Request' },
  ];

  // Audience options
  const audienceOptions = [
    { value: 'executives', label: 'Executives (C-Suite)' },
    { value: 'managers', label: 'Middle Management' },
    { value: 'technical', label: 'Technical Staff' },
    { value: 'sales', label: 'Sales Professionals' },
    { value: 'marketing', label: 'Marketing Professionals' },
    { value: 'leads', label: 'New Leads' },
    { value: 'customers', label: 'Existing Customers' },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose || !formData.audience || !formData.keyMessage) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await generateAI({
        system:
          'You are an email marketing copywriter. Write subject lines only from the details given. ' +
          'Do not predict open rates or invent statistics.',
        prompt:
          `Write 5 distinct email subject lines.\nPurpose: ${formData.purpose}\n` +
          `Target audience: ${formData.audience}\nKey message: ${formData.keyMessage}\n` +
          'For each, give a one-sentence rationale. Set bestSendTime to a short send-time suggestion ' +
          'with reasoning, or null if you have no grounded recommendation.',
        schema: SUBJECT_SCHEMA,
        schemaName: 'subject_lines',
        json: true,
      });

      const subjects: { text: string; rationale: string }[] = data?.subjects || [];
      if (subjects.length === 0) throw new Error('The AI returned no subject lines. Please try again.');

      const lines = subjects.map((s, i) => `${i + 1}. "${s.text}"\n   - Why It Works: ${s.rationale}`);
      const sendTime = data?.bestSendTime ? `\n\n## Suggested Send Time\n${data.bestSendTime}` : '';
      setResult(`# Email Subject Line Suggestions\n\n## Subject Line Options:\n\n${lines.join('\n\n')}${sendTime}`);
    } catch (err) {
      console.error('Error generating subject lines:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'An error occurred while generating subject lines'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-lg">
            <Mail className="text-rose-600 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-rose-800 mb-2">
              Email Subject Line Optimizer
            </h3>
            <p className="text-rose-700">
              Generate email subject line options tailored to your purpose, audience and message.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <Target className="h-6 w-6 text-rose-600" />
          Subject Line Generator
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Purpose</label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"
              required
            >
              <option value="" disabled>
                Select email purpose
              </option>
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"
              required
            >
              <option value="" disabled>
                Select target audience
              </option>
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="keyMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Key Message or Offer
            </label>
            <textarea
              id="keyMessage"
              name="keyMessage"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"
              placeholder="What is the main message or value proposition of your email?"
              value={formData.keyMessage}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div />
            <button
              type="submit"
              disabled={
                isLoading || !formData.purpose || !formData.audience || !formData.keyMessage
              }
              className="bg-gradient-to-r from-rose-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Generating subject lines...
                </>
              ) : (
                <>
                  Generate Subject Lines
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Generation Error</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && <StructuredAIResult data={result} title="Email Subject Line Recommendations" />}
    </div>
  );
};

export default SubjectLineContent;
