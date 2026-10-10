import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronDown,
  Briefcase,
  Heart,
  AlertCircle
} from 'lucide-react';

type EmailTone = 'professional' | 'friendly' | 'persuasive' | 'brief';

interface EmailComposerProps {
  contactName?: string;
  contactCompany?: string;
  context?: string;
  onSend?: (email: { subject: string; body: string }) => void;
  onGenerate?: () => Promise<{ subject: string; body: string }>;
}

const toneOptions: { value: EmailTone; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'professional', 
    label: 'Professional', 
    icon: <Briefcase size={16} />, 
    description: 'Formal and business-appropriate' 
  },
  { 
    value: 'friendly', 
    label: 'Friendly', 
    icon: <Heart size={16} />, 
    description: 'Warm and approachable' 
  },
  { 
    value: 'persuasive', 
    label: 'Persuasive', 
    icon: <Sparkles size={16} />, 
    description: 'Compelling call to action' 
  },
  { 
    value: 'brief', 
    label: 'Brief', 
    icon: <AlertCircle size={16} />, 
    description: 'Short and to the point' 
  },
];

const quickReplies = [
  { label: 'Follow up', template: "Hi {{name}},\n\nI wanted to follow up on our previous conversation. Do you have any questions I can help answer?\n\nBest regards" },
  { label: 'Meeting request', template: "Hi {{name}},\n\nI'd love to schedule a quick call to discuss how we can help {{company}}. Would you have 15 minutes this week?\n\nLooking forward to connecting!" },
  { label: 'Thank you', template: "Hi {{name}},\n\nThank you for your time today. I enjoyed our conversation and look forward to next steps.\n\nBest" },
  { label: 'Intro email', template: "Hi {{name}},\n\nI came across {{company}} and was impressed by what you're doing. I'd love to share how we've helped similar companies achieve great results.\n\nWould you be open to a brief chat?\n\nBest regards" },
];

const EmailComposer: React.FC<EmailComposerProps> = ({
  contactName = 'there',
  contactCompany = '',
  context = '',
  onSend,
  onGenerate,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTone, setSelectedTone] = useState<EmailTone>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    if (contactName !== 'there') {
      setBody(body.replace(/\{\{name\}\}/g, contactName).replace(/\{\{company\}\}/g, contactCompany));
    }
  }, [contactName, contactCompany]);

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      if (onGenerate) {
        const result = await onGenerate();
        setSubject(result.subject);
        setBody(result.body);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        const toneTemplates: Record<EmailTone, { subject: string; body: string }> = {
          professional: {
            subject: `Following up on our conversation`,
            body: `Hi ${contactName},\n\nI wanted to follow up regarding our recent discussion about how we can support ${contactCompany || 'your team'}.\n\nPlease let me know if you have any questions or would like to schedule a call to explore next steps.\n\nBest regards`,
          },
          friendly: {
            subject: `Great connecting with you!`,
            body: `Hi ${contactName}!\n\nIt was wonderful chatting with you about ${contactCompany || 'what we're working on'}. I'm excited about the potential collaboration!\n\nWould love to continue our conversation. What does your schedule look like this week?\n\nCheers`,
          },
          persuasive: {
            subject: `Exclusive offer for ${contactCompany || 'you'}`,
            body: `Hi ${contactName},\n\nI've been thinking about how we can help ${contactCompany || 'your company'} achieve remarkable results. Our solution has helped similar organizations increase efficiency by up to 40%.\n\nI'd like to offer you an exclusive demo. Would you have 20 minutes this week?\n\nBest regards`,
          },
          brief: {
            subject: `Quick follow-up`,
            body: `Hi ${contactName},\n\nJust checking in. Let me know if you need anything else from my end.\n\nBest`,
          },
        };
        const template = toneTemplates[selectedTone];
        setSubject(template.subject);
        setBody(template.body.replace('{{company}}', contactCompany || 'your team'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (onSend && subject && body) {
      onSend({ subject, body });
      setSubject('');
      setBody('');
    }
  };

  const applyQuickReply = (template: string) => {
    setBody(template.replace(/\{\{name\}\}/g, contactName).replace(/\{\{company\}\}/g, contactCompany || 'your company'));
    setShowQuickReplies(false);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-md transition-all duration-200">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full p-2">
              <Mail size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Email Composer</h3>
          </div>
          <button
            onClick={generateEmail}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Generate with AI
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tone</label>
            <button
              onClick={() => setShowToneDropdown(!showToneDropdown)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {toneOptions.find(t => t.value === selectedTone)?.icon}
              <span>{toneOptions.find(t => t.value === selectedTone)?.label}</span>
              <ChevronDown size={14} />
            </button>

            {showToneDropdown && (
              <div className="absolute z-10 mt-1 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1">
                {toneOptions.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => {
                      setSelectedTone(tone.value);
                      setShowToneDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                      selectedTone === tone.value ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''
                    }`}
                  >
                    <span className="mt-0.5 text-gray-500 dark:text-gray-400">{tone.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{tone.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{tone.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
          <div className="relative">
            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              Quick replies
              <ChevronDown size={12} />
            </button>
            {showQuickReplies && (
              <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.label}
                    onClick={() => applyQuickReply(reply.template)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email content here..."
          rows={10}
          className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!subject && !body}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {copied ? <Check size={16} className="mr-1.5 text-green-600" /> : <Copy size={16} className="mr-1.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={!subject || !body}
          className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Send size={16} className="mr-2" />
          Send Email
        </button>
      </div>
    </div>
  );
};

export default EmailComposer;