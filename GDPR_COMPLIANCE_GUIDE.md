# GDPR Compliance Guide for SmartCRM White Label Platform

## Overview
This document outlines the GDPR (General Data Protection Regulation) compliance measures implemented in the SmartCRM platform and provides guidance for white label partners.

**Last Updated**: January 25, 2026  
**Compliance Status**: ✅ GDPR Ready

---

## 1. Legal Basis for Data Processing

### 1.1 Lawful Bases
SmartCRM processes personal data under the following lawful bases:

- **Contract Performance** (Art. 6(1)(b)): Processing necessary for service delivery
- **Legitimate Interest** (Art. 6(1)(f)): Analytics and service improvement
- **Consent** (Art. 6(1)(a)): Marketing communications and optional features
- **Legal Obligation** (Art. 6(1)(c)): Tax, accounting, and legal requirements

### 1.2 Special Category Data
The platform does NOT process special category data (Art. 9) by default. If white label partners enable features that collect sensitive data, they must:
- Obtain explicit consent
- Implement additional security measures
- Update their privacy policy accordingly

---

## 2. Data Subject Rights Implementation

### 2.1 Right to Access (Art. 15)
**Implementation**: User profile page with data export functionality

```typescript
// API Endpoint: GET /api/users/data-export
// Returns: Complete user data in JSON format
{
  "profile": { /* user profile data */ },
  "contacts": [ /* user's contacts */ ],
  "deals": [ /* user's deals */ ],
  "tasks": [ /* user's tasks */ ],
  "communications": [ /* communication history */ ]
}
```

**Location**: [`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)

### 2.2 Right to Rectification (Art. 16)
**Implementation**: User profile editing and data correction

- Users can update their profile information
- Contact and deal data can be edited
- Audit trail maintained for data changes

**Location**: [`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)

### 2.3 Right to Erasure (Art. 17)
**Implementation**: Account deletion with data purge

```typescript
// API Endpoint: DELETE /api/users/account
// Actions:
// 1. Soft delete user profile
// 2. Anonymize associated data
// 3. Schedule hard delete after 30 days
// 4. Send confirmation email
```

**Retention Policy**:
- Active data: Retained while account is active
- Deleted accounts: 30-day grace period for recovery
- Backup data: Purged within 90 days
- Legal hold: Retained as required by law

**Location**: [`server/routes/auth.ts`](server/routes/auth.ts)

### 2.4 Right to Data Portability (Art. 20)
**Implementation**: Data export in machine-readable format

- JSON export of all user data
- CSV export for contacts and deals
- API access for programmatic export

**Location**: [`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)

### 2.5 Right to Object (Art. 21)
**Implementation**: Opt-out mechanisms

- Marketing email unsubscribe
- Analytics opt-out
- Third-party data sharing controls

**Location**: [`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)

### 2.6 Right to Restrict Processing (Art. 18)
**Implementation**: Account suspension without deletion

- Users can temporarily suspend their account
- Data processing paused except for storage
- Can be reactivated within 90 days

---

## 3. Data Protection by Design and Default

### 3.1 Privacy by Design Principles

#### Minimization
- Only collect data necessary for service delivery
- No excessive data collection
- Regular data audits to remove unused fields

#### Purpose Limitation
- Data used only for stated purposes
- No secondary use without consent
- Clear purpose documentation

#### Storage Limitation
- Automatic data retention policies
- Scheduled deletion of old data
- Configurable retention periods

### 3.2 Technical Measures

#### Encryption
- **In Transit**: TLS 1.3 for all connections
- **At Rest**: AES-256 encryption for database
- **Backups**: Encrypted backup storage

**Implementation**: Supabase provides encryption by default

#### Access Control
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control (RBAC)**: Application-level permissions
- **Multi-Factor Authentication (MFA)**: Optional for enhanced security

**Location**: [`supabase/migrations/`](supabase/migrations/)

#### Pseudonymization
- User IDs are UUIDs (not sequential)
- Email addresses hashed for analytics
- IP addresses anonymized in logs

**Location**: [`server/index.ts`](server/index.ts:28-35)

---

## 4. Data Processing Records (Art. 30)

### 4.1 Processing Activities Register

| Activity | Purpose | Legal Basis | Data Categories | Recipients | Retention |
|----------|---------|-------------|-----------------|------------|-----------|
| User Registration | Account creation | Contract | Name, email, password | Internal only | Account lifetime |
| Contact Management | CRM functionality | Contract | Contact details | User only | User-defined |
| Deal Tracking | Sales pipeline | Contract | Deal data | User + team | User-defined |
| Analytics | Service improvement | Legitimate interest | Usage data | Internal only | 24 months |
| Email Communications | Service notifications | Contract | Email, name | Email provider | 12 months |
| Payment Processing | Billing | Contract | Payment details | Payment processor | 7 years |

### 4.2 Third-Party Processors

| Processor | Service | Data Shared | Location | DPA Status |
|-----------|---------|-------------|----------|------------|
| Supabase | Database & Auth | All user data | US (SOC 2) | ✅ Signed |
| Netlify | Hosting | Access logs | US (SOC 2) | ✅ Signed |
| OpenAI | AI Features | User prompts | US | ✅ Signed |
| Stripe | Payments | Payment data | US (PCI DSS) | ✅ Signed |
| SendGrid | Email | Email addresses | US | ✅ Signed |

**Note**: All processors have signed Data Processing Agreements (DPAs) and are GDPR-compliant.

---

## 5. Data Breach Response Plan

### 5.1 Detection and Assessment
**Timeline**: Within 24 hours of discovery

1. **Identify**: Detect potential breach through monitoring
2. **Contain**: Isolate affected systems
3. **Assess**: Determine scope and severity
4. **Document**: Record all details

### 5.2 Notification Requirements

#### Supervisory Authority (Art. 33)
- **Timeline**: Within 72 hours of awareness
- **Method**: Online form to relevant DPA
- **Content**: Nature, categories, approximate numbers, consequences, measures

#### Data Subjects (Art. 34)
- **Trigger**: High risk to rights and freedoms
- **Timeline**: Without undue delay
- **Method**: Email notification
- **Content**: Clear description, contact point, likely consequences, measures

### 5.3 Breach Response Contacts
- **Data Protection Officer**: dpo@smartcrm.vip
- **Security Team**: security@smartcrm.vip
- **Emergency Hotline**: +1-XXX-XXX-XXXX (24/7)

---

## 6. International Data Transfers

### 6.1 Transfer Mechanisms
- **Standard Contractual Clauses (SCCs)**: For US-based processors
- **Adequacy Decisions**: For UK and Switzerland
- **Binding Corporate Rules**: For internal transfers (if applicable)

### 6.2 Data Localization Options
White label partners can choose data residency:
- **EU Region**: Frankfurt, Germany (Supabase EU)
- **US Region**: Oregon, USA (Supabase US)
- **UK Region**: London, UK (Supabase UK)
- **APAC Region**: Singapore (Supabase APAC)

**Configuration**: Set `SUPABASE_REGION` environment variable

---

## 7. Privacy Policy Requirements

### 7.1 Mandatory Disclosures
White label partners must include in their privacy policy:

1. **Identity and Contact Details**
   - Data controller name and contact
   - DPO contact (if applicable)

2. **Processing Purposes and Legal Bases**
   - Clear explanation of why data is collected
   - Legal basis for each purpose

3. **Data Categories**
   - Types of personal data collected
   - Sources of data

4. **Recipients**
   - Third-party processors
   - International transfers

5. **Retention Periods**
   - How long data is kept
   - Criteria for determining retention

6. **Data Subject Rights**
   - How to exercise rights
   - Contact information

7. **Right to Lodge Complaint**
   - Supervisory authority contact
   - Complaint procedure

### 7.2 Privacy Policy Template
A GDPR-compliant privacy policy template is available at:
[`docs/PRIVACY_POLICY_TEMPLATE.md`](docs/PRIVACY_POLICY_TEMPLATE.md)

---

## 8. Consent Management

### 8.1 Consent Requirements (Art. 7)
- **Freely Given**: No forced consent
- **Specific**: Separate consent for different purposes
- **Informed**: Clear explanation of processing
- **Unambiguous**: Affirmative action required
- **Withdrawable**: Easy opt-out mechanism

### 8.2 Implementation

```typescript
// Consent tracking in user profile
interface UserConsent {
  marketing_emails: boolean;
  analytics: boolean;
  third_party_sharing: boolean;
  consent_date: string;
  consent_version: string;
}
```

**Location**: [`shared/schema.ts`](shared/schema.ts)

### 8.3 Cookie Consent
- **Essential Cookies**: No consent required
- **Analytics Cookies**: Opt-in required
- **Marketing Cookies**: Opt-in required

**Implementation**: Cookie banner with granular controls

---

## 9. Data Protection Impact Assessment (DPIA)

### 9.1 When DPIA is Required
- Systematic monitoring of public areas
- Large-scale processing of special category data
- Automated decision-making with legal effects
- Processing of vulnerable individuals' data

### 9.2 DPIA Process
1. **Describe Processing**: Document data flows
2. **Assess Necessity**: Justify processing
3. **Identify Risks**: Privacy and security risks
4. **Mitigation Measures**: Controls and safeguards
5. **Consultation**: DPO and stakeholders
6. **Approval**: Management sign-off

**Template**: [`docs/DPIA_TEMPLATE.md`](docs/DPIA_TEMPLATE.md)

---

## 10. White Label Partner Responsibilities

### 10.1 As Data Controller
White label partners are data controllers and must:

1. **Appoint DPO** (if required)
   - 250+ employees, OR
   - Core activities involve systematic monitoring, OR
   - Large-scale processing of special category data

2. **Maintain Records** (Art. 30)
   - Processing activities register
   - DPIAs where required
   - Breach records

3. **Implement Security Measures** (Art. 32)
   - Use platform security features
   - Train staff on data protection
   - Regular security audits

4. **Handle Data Subject Requests**
   - Respond within 30 days
   - Use platform tools for data export/deletion
   - Document all requests

5. **Report Breaches**
   - Notify SmartCRM immediately
   - Notify supervisory authority within 72 hours
   - Notify affected users if high risk

### 10.2 Data Processing Agreement
SmartCRM provides a standard DPA for white label partners:
[`docs/DATA_PROCESSING_AGREEMENT.md`](docs/DATA_PROCESSING_AGREEMENT.md)

---

## 11. Compliance Checklist

### For SmartCRM Platform
- [x] Privacy by design implemented
- [x] Data subject rights tools available
- [x] Encryption in transit and at rest
- [x] Row-level security (RLS) enabled
- [x] Audit logging implemented
- [x] Data retention policies configured
- [x] Breach response plan documented
- [x] DPAs signed with processors
- [x] Privacy policy template provided
- [x] DPIA template provided

### For White Label Partners
- [ ] Privacy policy published
- [ ] Cookie consent banner implemented
- [ ] DPO appointed (if required)
- [ ] Processing records maintained
- [ ] Staff trained on GDPR
- [ ] Data subject request process established
- [ ] Breach response plan created
- [ ] DPA signed with SmartCRM
- [ ] Third-party processors reviewed
- [ ] Regular compliance audits scheduled

---

## 12. Audit and Monitoring

### 12.1 Regular Audits
- **Quarterly**: Internal compliance review
- **Annually**: External GDPR audit
- **Ad-hoc**: After significant changes

### 12.2 Monitoring Tools
- **Access Logs**: Track data access patterns
- **Audit Trail**: Record all data modifications
- **Consent Dashboard**: Monitor consent rates
- **Breach Detection**: Automated security monitoring

**Location**: [`server/health/index.ts`](server/health/index.ts)

---

## 13. Training and Awareness

### 13.1 Staff Training
All staff with access to personal data must complete:
- GDPR fundamentals training (annually)
- Role-specific data protection training
- Security awareness training
- Incident response training

### 13.2 Training Resources
- **GDPR Overview**: [`docs/training/GDPR_OVERVIEW.md`](docs/training/GDPR_OVERVIEW.md)
- **Data Handling**: [`docs/training/DATA_HANDLING.md`](docs/training/DATA_HANDLING.md)
- **Security Best Practices**: [`docs/training/SECURITY_PRACTICES.md`](docs/training/SECURITY_PRACTICES.md)

---

## 14. Contact Information

### Data Protection Officer (DPO)
- **Email**: dpo@smartcrm.vip
- **Phone**: +1-XXX-XXX-XXXX
- **Address**: [Company Address]

### Supervisory Authority
For EU users, the lead supervisory authority is:
- **Name**: [Relevant Data Protection Authority]
- **Website**: [DPA Website]
- **Email**: [DPA Email]

### Support
For GDPR-related questions:
- **Email**: privacy@smartcrm.vip
- **Documentation**: https://docs.smartcrm.vip/gdpr
- **Support Portal**: https://support.smartcrm.vip

---

## 15. Updates and Amendments

This compliance guide is reviewed and updated:
- **Quarterly**: Routine review
- **As Needed**: When regulations change
- **After Audits**: Based on findings

**Version History**:
- v1.0 (2026-01-25): Initial GDPR compliance guide

---

## Appendices

### Appendix A: Data Flow Diagrams
[`docs/appendices/DATA_FLOW_DIAGRAMS.md`](docs/appendices/DATA_FLOW_DIAGRAMS.md)

### Appendix B: Security Measures
[`docs/appendices/SECURITY_MEASURES.md`](docs/appendices/SECURITY_MEASURES.md)

### Appendix C: Retention Schedules
[`docs/appendices/RETENTION_SCHEDULES.md`](docs/appendices/RETENTION_SCHEDULES.md)

### Appendix D: Processor List
[`docs/appendices/PROCESSOR_LIST.md`](docs/appendices/PROCESSOR_LIST.md)

---

**Disclaimer**: This guide provides general information about GDPR compliance. It does not constitute legal advice. White label partners should consult with legal counsel to ensure compliance with applicable laws and regulations.
