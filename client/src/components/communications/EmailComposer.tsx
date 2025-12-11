import React, { useState, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  X, 
  Brain, 
  Save, 
  Eye,
  Users,
  Calendar,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../store/contactStore';

interface EmailComposerProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedContact?: Contact | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'proposal' | 'thank_you' | 'custom';
}

interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  attachments?: File[];
  isRead: boolean;
  contactId?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ selectedContact }) => {
  const { contacts } = useContactStore();
  
  const [emailData, setEmailData] = useState({
    to: selectedContact?.email || '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    sendLater: false,
    scheduledTime: '',
    trackOpens: true,
    trackClicks: true
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined email templates
  const emailTemplates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Cold Outreach',
      subject: 'Quick question about {{company}}',
      body: `Hi {{firstName}},

I hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}.

I'd love to learn more about your current challenges with [specific area] and share how we might be able to help.

Would you be open to a brief 15-minute call this week?

Best regards,
[Your Name]`,
      category: 'cold_outreach'
    },
    {
      id: '2',
      name: 'Follow Up',
      subject: 'Following up on our conversation',
      body: `Hi {{firstName}},

I wanted to follow up on our conversation about {{topic}}. 

As discussed, I'm attaching some additional information that might be helpful for your evaluation.

Please let me know if you have any questions or if you'd like to schedule a follow-up call.

Best regards,
[Your Name]`,
      category: 'follow_up'
    },
    {
      id: '3',
      name: 'Meeting Request',
      subject: 'Meeting request - {{topic}}',
      body: `Hi {{firstName}},

I hope you're doing well. I'd like to schedule a meeting to discuss {{topic}} and how we can support {{company}}'s goals.

Would any of the following times work for you?
- Option 1: [Date/Time]
- Option 2: [Date/Time]  
- Option 3: [Date/Time]

Please let me know what works best for your schedule.

Looking forward to our conversation.

Best regards,
[Your Name]`,
      category: 'meeting_request'
    }
  ];

  const generateAIContent = async () => {
    if (!recipient) return;
    
    setIsGeneratingAI(true);
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiSubject = `Personalized outreach for ${recipient.company || 'your business'}`;
      const aiBody = `Hi ${recipient.firstName || recipient.name.split(' ')[0]},

I hope this message finds you well. I've been following ${recipient.company || 'your work'} and I'm impressed by your position as ${recipient.position || 'a leader'} in the ${recipient.industry || 'industry'}.

Based on your background and ${recipient.company || 'your company'}'s focus, I believe there might be some interesting opportunities for collaboration.

Would you be open to a brief conversation to explore potential synergies?

Best regards,
[Your Name]`;

      setEmailData(prev => ({
        ...prev,
        subject: aiSubject,
        body: aiBody
      }));
    } catch (error) {
      console.error('Failed to generate AI content:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    if (!recipient) return;
    
    let subject = template.subject;
    let body = template.body;
    
    // Replace placeholders
    const replacements = {
      '{{firstName}}': recipient.firstName || recipient.name.split(' ')[0] || 'there',
      '{{lastName}}': recipient.lastName || recipient.name.split(' ').slice(1).join(' ') || '',
      '{{company}}': recipient.company || 'your organization',
      '{{industry}}': recipient.industry || 'your field',
      '{{position}}': recipient.position || 'your role',
      '{{topic}}': 'our discussion'
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    });
    
    setEmailData(prev => ({
      ...prev,
      subject,
      body
    }));
    
    setShowTemplates(false);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const saveDraft = async () => {
    try {
      // Simulate saving draft
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const sendEmail = async () => {
    try {
      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.body) {
        alert('Please fill in all required fields');
        return;
      }

      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log email activity to contact
      if (recipient) {
        // This would integrate with the contact store to log the email
        console.log('Email sent to:', recipient.name);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const scheduleEmail = async () => {
    if (!emailData.scheduledTime) {
      alert('Please select a time to schedule the email');
      return;
    }
    
    try {
      // Simulate scheduling email
      await new Promise(resolve => setTimeout(resolve, 500));
      alert(`Email scheduled for ${new Date(emailData.scheduledTime).toLocaleString()}`);
      onClose();
    } catch (error) {
      console.error('Failed to schedule email:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'compose' ? 'Compose Email' : mode === 'reply' ? 'Reply' : 'Forward Email'}
              </h2>
              {recipient && (
                <p className="text-sm text-gray-600">To: {recipient.name} ({recipient.email})</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={saveDraft}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isDraftSaved 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isDraftSaved ? <CheckCircle size={16} className="mr-1" /> : <Save size={16} className="mr-1" />}
              {isDraftSaved ? 'Saved' : 'Save Draft'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Email Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4">
            {/* Recipients */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To *
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="recipient@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CC
                </label>
                <input
                  type="email"
                  value={emailData.cc}
                  onChange={(e) => setEmailData(prev => ({ ...prev, cc: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="cc@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BCC
                </label>
                <input
                  type="email"
                  value={emailData.bcc}
                  onChange={(e) => setEmailData(prev => ({ ...prev, bcc: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject"
                required
              />
            </div>

            {/* AI and Template Actions */}
            <div className="flex items-center space-x-3 py-2">
              <button
                onClick={generateAIContent}
                disabled={isGeneratingAI || !recipient}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors disabled:opacity-50"
              >
                <Brain size={16} className="mr-1" />
                {isGeneratingAI ? 'Generating...' : 'AI Generate'}
              </button>
              
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
              >
                <Eye size={16} className="mr-1" />
                Templates
              </button>
              
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
              >
                <Clock size={16} className="mr-1" />
                Schedule
              </button>
            </div>

            {/* Templates Panel */}
            {showTemplates && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Email Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="text-left p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{template.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{template.subject}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduler Panel */}
            {showScheduler && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Schedule Email</h3>
                <div className="flex items-center space-x-3">
                  <input
                    type="datetime-local"
                    value={emailData.scheduledTime}
                    onChange={(e) => setEmailData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={emailData.sendLater}
                      onChange={(e) => setEmailData(prev => ({ ...prev, sendLater: e.target.checked }))}
                      className="mr-2"
                    />
                    Send at scheduled time
                  </label>
                </div>
              </div>
            )}

            {/* Email Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your message here..."
                required
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Paperclip size={16} className="mr-1" />
                  Add Attachment
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileAttachment}
                  className="hidden"
                />
                
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Email Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Priority</label>
                  <select
                    value={emailData.priority}
                    onChange={(e) => setEmailData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Track email opens</label>
                  <input
                    type="checkbox"
                    checked={emailData.trackOpens}
                    onChange={(e) => setEmailData(prev => ({ ...prev, trackOpens: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Track link clicks</label>
                  <input
                    type="checkbox"
                    checked={emailData.trackClicks}
                    onChange={(e) => setEmailData(prev => ({ ...prev, trackClicks: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users size={16} />
            <span>Sending as: your-email@company.com</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            
            {emailData.sendLater && emailData.scheduledTime && (
              <button
                onClick={scheduleEmail}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                <Calendar size={16} className="inline mr-1" />
                Schedule Email
              </button>
            )}
            
            <button
              onClick={sendEmail}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Send size={16} className="inline mr-1" />
              {emailData.sendLater ? 'Send Later' : 'Send Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
