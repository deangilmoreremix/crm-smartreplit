import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Email, 
  EmailTemplate, 
  EmailSequence, 
  CommunicationLog, 
  CallLog, 
  EmailAnalytics, 
  EmailFilter, 
  AISuggestion 
} from '../types/communication';

interface CommunicationStore {
  // State
  emails: Email[];
  templates: EmailTemplate[];
  sequences: EmailSequence[];
  communicationLogs: CommunicationLog[];
  callLogs: CallLog[];
  analytics: EmailAnalytics;
  filter: EmailFilter;
  
  // Email actions
  sendEmail: (email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveDraft: (email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>) => void;
  scheduleEmail: (email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>, scheduledAt: Date) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  deleteEmail: (id: string) => void;
  getEmail: (id: string) => Email | undefined;
  markAsRead: (id: string) => void;
  addEmailTracking: (id: string, event: 'opened' | 'clicked' | 'replied') => void;
  
  // Template actions
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => void;
  deleteTemplate: (id: string) => void;
  useTemplate: (templateId: string, variables: Record<string, any>) => Partial<Email>;
  duplicateTemplate: (id: string) => void;
  
  // Sequence actions
  createSequence: (sequence: Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt' | 'contactCount' | 'completionRate'>) => void;
  updateSequence: (id: string, updates: Partial<EmailSequence>) => void;
  deleteSequence: (id: string) => void;
  enrollContactInSequence: (sequenceId: string, contactId: string) => void;
  
  // Communication log actions
  logCommunication: (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => void;
  updateCommunicationLog: (id: string, updates: Partial<CommunicationLog>) => void;
  deleteCommunicationLog: (id: string) => void;
  
  // Call log actions
  logCall: (call: Omit<CallLog, 'id' | 'timestamp'>) => void;
  updateCallLog: (id: string, updates: Partial<CallLog>) => void;
  deleteCallLog: (id: string) => void;
  
  // AI suggestions
  generateAISuggestions: (emailId: string) => Promise<AISuggestion[]>;
  applyAISuggestion: (emailId: string, suggestionId: string) => void;
  
  // Analytics
  updateAnalytics: () => void;
  getEmailAnalytics: (dateRange?: { start: Date; end: Date }) => EmailAnalytics;
  
  // Filtering
  setFilter: (filter: Partial<EmailFilter>) => void;
  getFilteredEmails: () => Email[];
  clearFilters: () => void;
  
  // Computed properties
  getDraftEmails: () => Email[];
  getSentEmails: () => Email[];
  getScheduledEmails: () => Email[];
  getEmailsByContact: (contactId: string) => Email[];
  getEmailsByDeal: (dealId: string) => Email[];
  getCommunicationsByContact: (contactId: string) => CommunicationLog[];
  getCallsByContact: (contactId: string) => CallLog[];
}

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      emails: [],
      templates: [],
      sequences: [],
      communicationLogs: [],
      callLogs: [],
      analytics: {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReplied: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
        unsubscribeRate: 0,
        bounceRate: 0,
        spamRate: 0,
        engagementScore: 0,
        bestSendTimes: [],
        topPerformingSubjects: [],
        templatePerformance: []
      },
      filter: {
        status: 'all',
        priority: 'all',
        dateRange: null,
        contactId: null,
        dealId: null,
        tags: [],
        hasAttachments: null,
        isTracked: null,
        searchQuery: ''
      },
      
      // Email actions
      sendEmail: async (emailData) => {
        const newEmail: Email = {
          ...emailData,
          id: crypto.randomUUID(),
          status: 'sent',
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          trackingPixelId: emailData.trackingEnabled ? crypto.randomUUID() : undefined
        };
        
        set((state) => ({
          emails: [...state.emails, newEmail]
        }));
        
        // Log communication
        get().logCommunication({
          type: 'email',
          direction: 'outbound',
          contactId: newEmail.contactId || '',
          dealId: newEmail.dealId,
          subject: newEmail.subject,
          content: newEmail.content,
          tags: newEmail.tags,
          attachments: newEmail.attachments.map(a => a.fileName),
          createdBy: newEmail.createdBy
        });
        
        get().updateAnalytics();
      },
      
      saveDraft: (emailData) => {
        const draft: Email = {
          ...emailData,
          id: crypto.randomUUID(),
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          emails: [...state.emails, draft]
        }));
      },
      
      scheduleEmail: (emailData, scheduledAt) => {
        const scheduledEmail: Email = {
          ...emailData,
          id: crypto.randomUUID(),
          status: 'draft',
          scheduledAt,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          emails: [...state.emails, scheduledEmail]
        }));
      },
      
      updateEmail: (id, updates) => {
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, ...updates, updatedAt: new Date() }
              : email
          )
        }));
      },
      
      deleteEmail: (id) => {
        set((state) => ({
          emails: state.emails.filter((email) => email.id !== id)
        }));
      },
      
      getEmail: (id) => {
        return get().emails.find((email) => email.id === id);
      },
      
      markAsRead: (id) => {
        get().updateEmail(id, { 
          status: 'read', 
          readAt: new Date() 
        });
        get().addEmailTracking(id, 'opened');
      },
      
      addEmailTracking: (id, event) => {
        const email = get().getEmail(id);
        if (!email) return;
        
        const timestamp = new Date();
        const updates: Partial<Email> = {};
        
        switch (event) {
          case 'opened':
            if (!email.readAt) {
              updates.readAt = timestamp;
              updates.status = 'read';
            }
            break;
          case 'clicked':
            // Update link tracking
            break;
          case 'replied':
            updates.status = 'replied';
            break;
        }
        
        get().updateEmail(id, updates);
        get().updateAnalytics();
      },
      
      // Template actions
      createTemplate: (templateData) => {
        const template: EmailTemplate = {
          ...templateData,
          id: crypto.randomUUID(),
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          templates: [...state.templates, template]
        }));
      },
      
      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          )
        }));
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id)
        }));
      },
      
      useTemplate: (templateId, variables) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return {};
        
        // Increment usage count
        get().updateTemplate(templateId, { 
          usageCount: template.usageCount + 1 
        });
        
        // Replace variables in content
        let processedContent = template.content;
        let processedSubject = template.subject;
        
        Object.entries(variables).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value));
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value));
        });
        
        return {
          subject: processedSubject,
          content: processedContent,
          htmlContent: template.htmlContent,
          templateId: templateId
        };
      },
      
      duplicateTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (!template) return;
        
        get().createTemplate({
          ...template,
          name: `${template.name} (Copy)`,
          isActive: false
        });
      },
      
      // Sequence actions
      createSequence: (sequenceData) => {
        const sequence: EmailSequence = {
          ...sequenceData,
          id: crypto.randomUUID(),
          contactCount: 0,
          completionRate: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          sequences: [...state.sequences, sequence]
        }));
      },
      
      updateSequence: (id, updates) => {
        set((state) => ({
          sequences: state.sequences.map((sequence) =>
            sequence.id === id
              ? { ...sequence, ...updates, updatedAt: new Date() }
              : sequence
          )
        }));
      },
      
      deleteSequence: (id) => {
        set((state) => ({
          sequences: state.sequences.filter((sequence) => sequence.id !== id)
        }));
      },
      
      enrollContactInSequence: (sequenceId, contactId) => {
        // This would trigger the sequence for the contact
        // Implementation would involve scheduling emails based on sequence steps
      },
      
      // Communication log actions
      logCommunication: (logData) => {
        const log: CommunicationLog = {
          ...logData,
          id: crypto.randomUUID(),
          timestamp: new Date()
        };
        
        set((state) => ({
          communicationLogs: [log, ...state.communicationLogs]
        }));
      },
      
      updateCommunicationLog: (id, updates) => {
        set((state) => ({
          communicationLogs: state.communicationLogs.map((log) =>
            log.id === id ? { ...log, ...updates } : log
          )
        }));
      },
      
      deleteCommunicationLog: (id) => {
        set((state) => ({
          communicationLogs: state.communicationLogs.filter((log) => log.id !== id)
        }));
      },
      
      // Call log actions
      logCall: (callData) => {
        const call: CallLog = {
          ...callData,
          id: crypto.randomUUID(),
          timestamp: new Date()
        };
        
        set((state) => ({
          callLogs: [call, ...state.callLogs]
        }));
        
        // Also log as communication
        get().logCommunication({
          type: 'call',
          direction: call.direction,
          contactId: call.contactId,
          dealId: call.dealId,
          content: call.notes,
          duration: Math.floor(call.duration / 60), // convert to minutes
          status: 'completed',
          tags: call.tags,
          attachments: [],
          createdBy: call.createdBy
        });
      },
      
      updateCallLog: (id, updates) => {
        set((state) => ({
          callLogs: state.callLogs.map((call) =>
            call.id === id ? { ...call, ...updates } : call
          )
        }));
      },
      
      deleteCallLog: (id) => {
        set((state) => ({
          callLogs: state.callLogs.filter((call) => call.id !== id)
        }));
      },
      
      // AI suggestions
      generateAISuggestions: async (emailId) => {
        // Mock AI suggestions - in real app, this would call an AI service
        const suggestions: AISuggestion[] = [
          {
            id: crypto.randomUUID(),
            type: 'subject',
            suggestion: 'Add personalization to increase open rates',
            confidence: 0.85,
            reasoning: 'Emails with personalized subjects have 26% higher open rates',
            applied: false
          },
          {
            id: crypto.randomUUID(),
            type: 'timing',
            suggestion: 'Send on Tuesday at 2 PM for optimal engagement',
            confidence: 0.92,
            reasoning: 'Based on recipient\'s past engagement patterns',
            applied: false
          }
        ];
        
        const email = get().getEmail(emailId);
        if (email) {
          get().updateEmail(emailId, { aiSuggestions: suggestions });
        }
        
        return suggestions;
      },
      
      applyAISuggestion: (emailId, suggestionId) => {
        const email = get().getEmail(emailId);
        if (!email?.aiSuggestions) return;
        
        const updatedSuggestions = email.aiSuggestions.map((s) =>
          s.id === suggestionId ? { ...s, applied: true } : s
        );
        
        get().updateEmail(emailId, { aiSuggestions: updatedSuggestions });
      },
      
      // Analytics
      updateAnalytics: () => {
        const emails = get().emails;
        const sent = emails.filter((e) => e.status !== 'draft');
        const delivered = emails.filter((e) => ['delivered', 'read', 'replied'].includes(e.status));
        const opened = emails.filter((e) => ['read', 'replied'].includes(e.status));
        const clicked = emails.filter((e) => e.linkTracking.some((l) => l.clickCount > 0));
        const replied = emails.filter((e) => e.status === 'replied');
        
        const analytics: EmailAnalytics = {
          totalSent: sent.length,
          totalDelivered: delivered.length,
          totalOpened: opened.length,
          totalClicked: clicked.length,
          totalReplied: replied.length,
          deliveryRate: sent.length > 0 ? delivered.length / sent.length : 0,
          openRate: delivered.length > 0 ? opened.length / delivered.length : 0,
          clickRate: opened.length > 0 ? clicked.length / opened.length : 0,
          replyRate: opened.length > 0 ? replied.length / opened.length : 0,
          unsubscribeRate: 0,
          bounceRate: 0,
          spamRate: 0,
          engagementScore: 0,
          bestSendTimes: [],
          topPerformingSubjects: [],
          templatePerformance: []
        };
        
        set({ analytics });
      },
      
      getEmailAnalytics: (dateRange) => {
        // Filter emails by date range if provided
        let filteredEmails = get().emails;
        if (dateRange) {
          filteredEmails = filteredEmails.filter((email) =>
            email.createdAt >= dateRange.start && email.createdAt <= dateRange.end
          );
        }
        
        // Calculate analytics for filtered emails
        // ... implementation similar to updateAnalytics
        return get().analytics;
      },
      
      // Filtering
      setFilter: (filterUpdates) => {
        set((state) => ({
          filter: { ...state.filter, ...filterUpdates }
        }));
      },
      
      getFilteredEmails: () => {
        const { emails, filter } = get();
        let filtered = emails;
        
        if (filter.status !== 'all') {
          filtered = filtered.filter((email) => email.status === filter.status);
        }
        
        if (filter.priority !== 'all') {
          filtered = filtered.filter((email) => email.priority === filter.priority);
        }
        
        if (filter.contactId) {
          filtered = filtered.filter((email) => email.contactId === filter.contactId);
        }
        
        if (filter.dealId) {
          filtered = filtered.filter((email) => email.dealId === filter.dealId);
        }
        
        if (filter.tags.length > 0) {
          filtered = filtered.filter((email) =>
            filter.tags.some((tag) => email.tags.includes(tag))
          );
        }
        
        if (filter.hasAttachments !== null) {
          filtered = filtered.filter((email) =>
            filter.hasAttachments ? email.attachments.length > 0 : email.attachments.length === 0
          );
        }
        
        if (filter.isTracked !== null) {
          filtered = filtered.filter((email) => email.trackingEnabled === filter.isTracked);
        }
        
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter((email) =>
            email.subject.toLowerCase().includes(query) ||
            email.content.toLowerCase().includes(query) ||
            email.fromAddress.toLowerCase().includes(query) ||
            email.toAddresses.some((addr) => addr.toLowerCase().includes(query))
          );
        }
        
        if (filter.dateRange) {
          filtered = filtered.filter((email) =>
            email.createdAt >= filter.dateRange!.start &&
            email.createdAt <= filter.dateRange!.end
          );
        }
        
        return filtered;
      },
      
      clearFilters: () => {
        set({
          filter: {
            status: 'all',
            priority: 'all',
            dateRange: null,
            contactId: null,
            dealId: null,
            tags: [],
            hasAttachments: null,
            isTracked: null,
            searchQuery: ''
          }
        });
      },
      
      // Computed properties
      getDraftEmails: () => {
        return get().emails.filter((email) => email.status === 'draft');
      },
      
      getSentEmails: () => {
        return get().emails.filter((email) => email.status !== 'draft');
      },
      
      getScheduledEmails: () => {
        return get().emails.filter((email) => email.scheduledAt && email.status === 'draft');
      },
      
      getEmailsByContact: (contactId) => {
        return get().emails.filter((email) => email.contactId === contactId);
      },
      
      getEmailsByDeal: (dealId) => {
        return get().emails.filter((email) => email.dealId === dealId);
      },
      
      getCommunicationsByContact: (contactId) => {
        return get().communicationLogs.filter((log) => log.contactId === contactId);
      },
      
      getCallsByContact: (contactId) => {
        return get().callLogs.filter((call) => call.contactId === contactId);
      }
    }),
    {
      name: 'communication-store',
      partialize: (state) => ({
        emails: state.emails,
        templates: state.templates,
        sequences: state.sequences,
        communicationLogs: state.communicationLogs,
        callLogs: state.callLogs
      })
    }
  )
);
