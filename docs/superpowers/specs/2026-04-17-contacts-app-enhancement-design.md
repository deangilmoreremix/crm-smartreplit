# Phase 2: Contacts App Enhancement Design

## Overview

Enhance the SmartCRM monorepo's contacts app with Twenty's advanced contact management capabilities, maintaining the existing design system (Tailwind CSS, Lucide icons) and branding.

## Current State Analysis

- Existing contacts functionality: Basic CRUD operations with ContactList and ContactCard components
- Database: Standard contact table in Supabase
- AI: Basic integration via @smartcrm/ai-core package
- UI: Simple list view with basic filtering

## Enhancement Goals

- Implement Twenty's contact enrichment (social profiles, validation)
- Add EAV-based custom fields for dynamic attributes
- Enhance search with semantic filtering and AI insights
- Upgrade UI with bulk operations, scoring, and real-time updates
- Maintain backward compatibility with existing data

## Technical Architecture

### Database Schema Extensions

```sql
-- Extend existing contact table
ALTER TABLE contacts ADD COLUMN score DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE contacts ADD COLUMN enrichment_data JSONB;
ALTER TABLE contacts ADD COLUMN last_enriched_at TIMESTAMPTZ;

-- EAV tables for custom fields
CREATE TABLE contact_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  field_key TEXT NOT NULL,
  field_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Backend Enhancements

- **ContactEnrichmentService**: Netlify function using OpenAI for data enrichment
- **CustomFieldsAPI**: Supabase Edge Functions for EAV operations
- **ContactScoringEngine**: Background job for AI-based scoring

### Frontend Components

- **EnhancedContactList**: Advanced filtering, bulk actions, scoring display
- **ContactEnrichmentModal**: UI for triggering AI enrichment
- **CustomFieldsEditor**: Dynamic form for custom attributes
- **ContactActivityFeed**: Real-time timeline component

### AI Integration

- Extend @smartcrm/ai-core with contact-specific adapters
- Implement semantic search using embeddings
- Add contact prioritization based on interaction patterns

## Implementation Phases

1. Database migrations and schema updates
2. Backend API enhancements
3. UI component upgrades
4. AI integration and testing
5. Real-time features and optimization

## Success Criteria

- All existing contact functionality preserved
- New advanced features working end-to-end
- Performance maintained (<2s load times)
- Responsive design on all breakpoints
- 95% test coverage for new features

## Risk Mitigation

- Backward compatibility testing for existing data
- Feature flags for gradual rollout
- Comprehensive error handling for AI failures
