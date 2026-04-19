export interface EnrichContactInput {
  contactId: string;
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
  linkedInUrl?: string;
}

export interface CompanyInfo {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  founded?: number;
  linkedIn?: string;
  twitter?: string;
  funding?: string;
}

export interface SocialProfiles {
  linkedIn?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  github?: string;
  website?: string;
}

export interface EnrichmentReport {
  contactId: string;
  company: CompanyInfo | null;
  social: SocialProfiles | null;
  summary: string;
  confidence: number;
  enrichmentDate: Date;
  dataSources: string[];
}

export interface EnrichmentResult {
  success: boolean;
  report?: EnrichmentReport;
  error?: string;
  cached?: boolean;
}

export class EnrichmentService {
  static async enrichContact(input: EnrichmentInput): Promise<EnrichmentResult> {
    const { contactId, name, email, company, jobTitle, linkedInUrl } = input;

    try {
      const [companyInfo, socialProfiles] = await Promise.all([
        company ? this.fetchCompanyInfo(company) : Promise.resolve(null),
        linkedInUrl ? this.fetchSocialProfiles(linkedInUrl) : Promise.resolve(null),
      ]);

      const summary = await this.generateEnrichmentReport(
        name,
        company,
        jobTitle,
        companyInfo,
        socialProfiles
      );

      const report: EnrichmentReport = {
        contactId,
        company: companyInfo,
        social: socialProfiles,
        summary,
        confidence: this.calculateConfidence(companyInfo, socialProfiles),
        enrichmentDate: new Date(),
        dataSources: this.getDataSources(companyInfo, socialProfiles),
      };

      return { success: true, report };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  static async fetchCompanyInfo(companyName: string): Promise<CompanyInfo | null> {
    const mockCompanyData: Record<string, CompanyInfo> = {
      'Acme Corp': {
        name: 'Acme Corp',
        domain: 'acme.com',
        industry: 'Technology',
        size: '500-1000',
        location: 'San Francisco, CA',
        description: 'Leading provider of enterprise software solutions',
        founded: 2010,
        linkedIn: 'https://linkedin.com/company/acme-corp',
        twitter: '@acme',
        funding: 'Series C - $50M',
      },
      default: {
        name: companyName,
        industry: 'Unknown',
        size: 'Unknown',
        location: 'Unknown',
      },
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockCompanyData[companyName] || { ...mockCompanyData.default, name: companyName });
      }, 100);
    });
  }

  static async fetchSocialProfiles(linkedInUrl: string): Promise<SocialProfiles | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profiles: SocialProfiles = {
          linkedIn: linkedInUrl,
          twitter: undefined,
          github: undefined,
          website: undefined,
        };
        resolve(profiles);
      }, 50);
    });
  }

  static async generateEnrichmentReport(
    name: string,
    company?: string,
    jobTitle?: string,
    companyInfo?: CompanyInfo | null,
    socialProfiles?: SocialProfiles | null
  ): Promise<string> {
    const parts: string[] = [];

    if (jobTitle) {
      parts.push(`${name} works as ${jobTitle}`);
    }

    if (company && companyInfo) {
      parts.push(`at ${company}`);
      if (companyInfo.industry) {
        parts.push(`in the ${companyInfo.industry} industry`);
      }
      if (companyInfo.size) {
        parts.push(`(${companyInfo.size} employees)`);
      }
    }

    if (companyInfo?.description) {
      parts.push(`${company} ${companyInfo.description.toLowerCase()}`);
    }

    return parts.join(' ');
  }

  private static calculateConfidence(
    companyInfo: CompanyInfo | null,
    socialProfiles: SocialProfiles | null
  ): number {
    let confidence = 0.3;

    if (companyInfo) confidence += 0.3;
    if (socialProfiles?.linkedIn) confidence += 0.2;
    if (socialProfiles?.twitter) confidence += 0.1;
    if (companyInfo?.industry) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  private static getDataSources(
    companyInfo: CompanyInfo | null,
    socialProfiles: SocialProfiles | null
  ): string[] {
    const sources: string[] = [];

    if (companyInfo) {
      sources.push('Company Database');
      if (companyInfo.linkedIn) sources.push('LinkedIn Company API');
      if (companyInfo.twitter) sources.push('Twitter');
    }

    if (socialProfiles?.linkedIn) sources.push('LinkedIn Profile');
    if (socialProfiles?.twitter) sources.push('Twitter');
    if (socialProfiles?.github) sources.push('GitHub');

    return sources.length > 0 ? sources : ['Manual Entry'];
  }
}

type EnrichmentInput = EnrichContactInput;
