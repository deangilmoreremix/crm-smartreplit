import { aiAgentService, AIAgentService } from './agentService';
import {
  LeadQualificationResult,
  EmailAnalysisResult,
  DealAnalysisResult,
  CustomerHealthResult,
  MeetingScheduleResult,
  DashboardData,
  WorkflowTrigger,
  WorkflowResult,
} from '../types';

export class AgentOrchestrator {
  private agentService: AIAgentService;

  constructor(agentService?: AIAgentService) {
    this.agentService = agentService || aiAgentService;
  }

  // ============================================================================
  // COMPLETE WORKFLOWS
  // ============================================================================

  async processNewLead(leadData: {
    email: string;
    first_name?: string;
    last_name?: string;
    job_title?: string;
    company?: string;
  }): Promise<{
    qualification: LeadQualificationResult;
    emailAnalysis?: EmailAnalysisResult;
    meetingSuggestion?: MeetingScheduleResult;
  }> {
    const results: any = {};

    // 1. Qualify the lead
    const qualificationResponse = await this.agentService.qualifyLead({
      lead_data: leadData,
    });
    results.qualification = qualificationResponse.data;

    // 2. If high score, draft welcome email
    if (results.qualification.score >= 70) {
      const emailResponse = await this.agentService.analyzeEmail({
        email_data: {
          from: 'system@smartcrm.com',
          to: leadData.email,
          subject: 'Welcome to SmartCRM',
          body: `Welcome ${leadData.first_name || 'there'}! We're excited to help you.`,
        },
      });
      results.emailAnalysis = emailResponse.data;
    }

    // 3. If very high score, suggest meeting
    if (results.qualification.score >= 80) {
      const meetingResponse = await this.agentService.scheduleMeeting({
        action: 'suggest_times',
        attendees: [leadData.email],
        duration: 30,
        subject: `Intro Call with ${leadData.first_name || 'New Lead'}`,
      });
      results.meetingSuggestion = meetingResponse.data;
    }

    return results;
  }

  async processIncomingEmail(emailData: {
    from: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<{
    analysis: EmailAnalysisResult;
    actions?: string[];
  }> {
    const results: any = {};

    // Analyze the email
    const analysisResponse = await this.agentService.analyzeEmail({
      email_data: emailData,
    });
    results.analysis = analysisResponse.data;

    // Determine actions based on analysis
    const actions: string[] = [];
    if (results.analysis.sentiment.score <= 3) {
      actions.push('escalate_to_customer_success');
    }
    if (results.analysis.priority === 'high') {
      actions.push('flag_for_immediate_attention');
    }
    if (results.analysis.category === 'complaint') {
      actions.push('create_support_ticket');
    }

    if (actions.length > 0) {
      results.actions = actions;
    }

    return results;
  }

  async analyzeDealHealth(dealId: string): Promise<{
    analysis: DealAnalysisResult;
    followUpMeeting?: MeetingScheduleResult;
  }> {
    const results: any = {};

    // Analyze the deal
    const analysisResponse = await this.agentService.analyzeDeal({
      deal_id: dealId,
      action: 'analyze',
    });
    results.analysis = analysisResponse.data;

    // If deal is stalled, schedule follow-up
    if (results.analysis.is_stalled) {
      const meetingResponse = await this.agentService.scheduleMeeting({
        action: 'schedule',
        meeting_type: 'follow_up',
        attendees: [], // Would need to get deal contacts
        duration: 30,
        subject: `Deal Follow-up: ${dealId}`,
      });
      results.followUpMeeting = meetingResponse.data;
    }

    return results;
  }

  async monitorCustomerHealth(customerId: string): Promise<{
    health: CustomerHealthResult;
    alerts?: string[];
  }> {
    const results: any = {};

    // Monitor customer
    const healthResponse = await this.agentService.monitorCustomer({
      customer_id: customerId,
      action: 'monitor',
    });
    results.health = healthResponse.data;

    // Generate alerts if needed
    const alerts: string[] = [];
    if (
      results.health.churn_risk.level === 'high' ||
      results.health.churn_risk.level === 'critical'
    ) {
      alerts.push(`High churn risk detected for customer ${customerId}`);
    }
    if (results.health.upsell_opportunities.length > 0) {
      alerts.push(`Upsell opportunities identified for customer ${customerId}`);
    }

    if (alerts.length > 0) {
      results.alerts = alerts;
    }

    return results;
  }

  async generateSmartDashboard(category: string = 'all'): Promise<DashboardData> {
    return await this.agentService.generateDashboard({ category });
  }

  // ============================================================================
  // AUTOMATED WORKFLOWS
  // ============================================================================

  async runDailyWorkflows(): Promise<{
    dealsAnalyzed: number;
    customersMonitored: number;
    issuesDetected: string[];
  }> {
    const results: {
      dealsAnalyzed: number;
      customersMonitored: number;
      issuesDetected: string[];
    } = {
      dealsAnalyzed: 0,
      customersMonitored: 0,
      issuesDetected: [],
    };

    try {
      // Get all active deals and analyze them
      const deals = await this.agentService.getDeals({ status: 'active' });
      for (const deal of deals) {
        await this.analyzeDealHealth(deal.id);
        results.dealsAnalyzed++;
      }

      // Monitor all customers
      const customers = await this.agentService.getCustomers();
      for (const customer of customers) {
        const health = await this.monitorCustomerHealth(customer.id);
        results.customersMonitored++;

        if (health.alerts) {
          results.issuesDetected.push(...health.alerts);
        }
      }
    } catch (error: any) {
      console.error('Error running daily workflows:', error);
      results.issuesDetected.push('Failed to complete daily workflows');
    }

    return results;
  }

  async runWeeklyWorkflows(): Promise<{
    reportGenerated: boolean;
    insights: string[];
  }> {
    const results: {
      reportGenerated: boolean;
      insights: string[];
    } = {
      reportGenerated: false,
      insights: [],
    };

    try {
      // Generate executive report
      const dashboard = await this.generateSmartDashboard('executive');
      results.reportGenerated = true;
      results.insights = dashboard.insights || [];
    } catch (error: any) {
      console.error('Error running weekly workflows:', error);
      results.insights.push('Failed to generate weekly report');
    }

    return results;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getAgentHealth(): Promise<any> {
    return await this.agentService.getHealth();
  }

  async getAgentStatus(): Promise<any> {
    return await this.agentService.getAgentStatus();
  }

  setAgentServiceURL(url: string): void {
    this.agentService.setBaseURL(url);
  }

  setAuthToken(token: string): void {
    this.agentService.setAuthToken(token);
  }
}

// Default instance
export const agentOrchestrator = new AgentOrchestrator();

// Factory function
export const createAgentOrchestrator = (agentService?: AIAgentService) => {
  return new AgentOrchestrator(agentService);
};
