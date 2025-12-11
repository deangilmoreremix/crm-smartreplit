import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useCommunicationStore } from '../store/communicationStore';
import { Email, EmailTemplate } from '../types/communication';
import { Send, Save, Clock, Paperclip, Sparkles, Eye, Code } from 'lucide-react';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  draft?: Email;
  contactId?: string;
  dealId?: string;
  replyToEmail?: Email;
}

export default function EmailComposer({
  isOpen,
  onClose,
  draft,
  contactId,
  dealId,
  replyToEmail
}: EmailComposerProps) {
  const {
    sendEmail,
    saveDraft,
    scheduleEmail,
    templates,
    useTemplate,
    generateAISuggestions
  } = useCommunicationStore();

  const [formData, setFormData] = useState({
    fromAddress: 'user@company.com',
    fromName: 'Your Name',
    toAddresses: [] as string[],
    ccAddresses: [] as string[],
    bccAddresses: [] as string[],
    subject: '',
    content: '',
    htmlContent: '',
    priority: 'normal' as const,
    tags: [] as string[],
    trackingEnabled: true,
    scheduledAt: null as Date | null
  });

  const [activeTab, setActiveTab] = useState('compose');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    if (draft) {
      setFormData({
        fromAddress: draft.fromAddress,
        fromName: draft.fromName || '',
        toAddresses: draft.toAddresses,
        ccAddresses: draft.ccAddresses || [],
        bccAddresses: draft.bccAddresses || [],
        subject: draft.subject,
        content: draft.content,
        htmlContent: draft.htmlContent || '',
        priority: draft.priority,
        tags: draft.tags,
        trackingEnabled: draft.trackingEnabled,
        scheduledAt: draft.scheduledAt || null
      });
    }

    if (replyToEmail) {
      setFormData(prev => ({
        ...prev,
        toAddresses: [replyToEmail.fromAddress],
        subject: replyToEmail.subject.startsWith('Re:') 
          ? replyToEmail.subject 
          : `Re: ${replyToEmail.subject}`,
        content: `\n\n--- Original Message ---\nFrom: ${replyToEmail.fromAddress}\nDate: ${replyToEmail.createdAt.toLocaleString()}\nSubject: ${replyToEmail.subject}\n\n${replyToEmail.content}`
      }));
    }

    if (contactId) {
      // In a real app, you'd fetch contact details here
    }
  }, [draft, replyToEmail, contactId]);

  const handleSend = async () => {
    try {
      await sendEmail({
        ...formData,
        contactId,
        dealId,
        attachments: [],
        linkTracking: [],
        createdBy: 'current-user'
      });
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSaveDraft = () => {
    saveDraft({
      ...formData,
      contactId,
      dealId,
      attachments: [],
      linkTracking: [],
      createdBy: 'current-user'
    });
    onClose();
  };

  const handleSchedule = () => {
    if (formData.scheduledAt) {
      scheduleEmail({
        ...formData,
        contactId,
        dealId,
        attachments: [],
        linkTracking: [],
        createdBy: 'current-user'
      }, formData.scheduledAt);
      onClose();
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const templateData = useTemplate(templateId, {
      // Add variable substitution here
      contactName: 'Contact Name',
      companyName: 'Company Name'
    });
    
    setFormData(prev => ({
      ...prev,
      ...templateData
    }));
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      // Mock AI suggestions
      const suggestions = [
        {
          type: 'subject',
          suggestion: 'Personalize subject line with recipient name',
          action: () => setFormData(prev => ({ ...prev, subject: `Hi [Name], ${prev.subject}` }))
        },
        {
          type: 'content',
          suggestion: 'Add a clear call-to-action',
          action: () => setFormData(prev => ({ 
            ...prev, 
            content: prev.content + '\n\nWould you like to schedule a quick 15-minute call to discuss this further?' 
          }))
        },
        {
          type: 'timing',
          suggestion: 'Send on Tuesday at 2 PM for better engagement',
          action: () => {
            const tuesday2PM = new Date();
            tuesday2PM.setDate(tuesday2PM.getDate() + (2 - tuesday2PM.getDay() + 7) % 7);
            tuesday2PM.setHours(14, 0, 0, 0);
            setFormData(prev => ({ ...prev, scheduledAt: tuesday2PM }));
          }
        }
      ];
      setAiSuggestions(suggestions);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addEmailAddress = (type: 'to' | 'cc' | 'bcc', email: string) => {
    if (email && email.includes('@')) {
      const field = `${type}Addresses` as keyof typeof formData;
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), email]
      }));
      
      if (type === 'to') setToInput('');
      if (type === 'cc') setCcInput('');
      if (type === 'bcc') setBccInput('');
    }
  };

  const removeEmailAddress = (type: 'to' | 'cc' | 'bcc', index: number) => {
    const field = `${type}Addresses` as keyof typeof formData;
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {draft ? 'Edit Draft' : replyToEmail ? 'Reply' : 'Compose Email'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            {/* From */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromAddress">From Email</Label>
                <Input
                  id="fromAddress"
                  value={formData.fromAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromAddress: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={formData.fromName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
                />
              </div>
            </div>

            {/* To */}
            <div>
              <Label htmlFor="to">To</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.toAddresses.map((email, index) => (
                  <Badge key={index} variant="secondary">
                    {email}
                    <button
                      onClick={() => removeEmailAddress('to', index)}
                      className="ml-1 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id="to"
                placeholder="Enter email address and press Enter"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmailAddress('to', toInput);
                  }
                }}
              />
            </div>

            {/* CC */}
            <div>
              <Label htmlFor="cc">CC</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.ccAddresses.map((email, index) => (
                  <Badge key={index} variant="secondary">
                    {email}
                    <button
                      onClick={() => removeEmailAddress('cc', index)}
                      className="ml-1 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id="cc"
                placeholder="Enter CC email address"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmailAddress('cc', ccInput);
                  }
                }}
              />
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content">Content</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHtmlMode(!isHtmlMode)}
                  >
                    {isHtmlMode ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                    {isHtmlMode ? 'Visual' : 'HTML'}
                  </Button>
                </div>
              </div>
              
              {isHtmlMode ? (
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="HTML content"
                  rows={12}
                  className="font-mono text-sm"
                />
              ) : (
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Email content"
                  rows={12}
                />
              )}
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="ml-1 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id="tags"
                placeholder="Add tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
            </div>

            {/* Options */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.trackingEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, trackingEnabled: e.target.checked }))}
                />
                Enable tracking
              </label>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {templates.filter(t => t.isActive).map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.subject}</p>
                  <Badge variant="outline" className="mt-2">
                    {template.category}
                  </Badge>
                </div>
              ))}
              {templates.filter(t => t.isActive).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No active templates found
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="text-center">
              <Button
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="mb-4"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingAI ? 'Generating...' : 'Get AI Suggestions'}
              </Button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">
                          {suggestion.type}
                        </Badge>
                        <p className="text-sm">{suggestion.suggestion}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={suggestion.action}
                        variant="outline"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div>
              <Label htmlFor="scheduledAt">Schedule for later</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt ? formData.scheduledAt.toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scheduledAt: e.target.value ? new Date(e.target.value) : null 
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Quick Schedule</h3>
                <div className="space-y-2">
                  {[
                    { label: 'In 1 hour', hours: 1 },
                    { label: 'Tomorrow 9 AM', hours: 24, setHour: 9 },
                    { label: 'Next Monday 9 AM', days: 7, setHour: 9 },
                  ].map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const date = new Date();
                        if (option.days) {
                          date.setDate(date.getDate() + option.days);
                        } else if (option.hours) {
                          date.setHours(date.getHours() + option.hours);
                        }
                        if (option.setHour !== undefined) {
                          date.setHours(option.setHour, 0, 0, 0);
                        }
                        setFormData(prev => ({ ...prev, scheduledAt: date }));
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Best Send Times</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Tuesday-Thursday: 2-4 PM</p>
                  <p>• Avoid Mondays and Fridays</p>
                  <p>• Based on recipient's timezone</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4 mr-2" />
              Attach
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            {formData.scheduledAt ? (
              <Button onClick={handleSchedule}>
                <Clock className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            ) : (
              <Button onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
