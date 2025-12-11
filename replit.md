# Overview

This project is a modern CRM (Customer Relationship Management) application designed to streamline sales and marketing operations. It features comprehensive contact management, deal tracking, task organization, and leverages AI for advanced automation. The system uses a monorepo structure, ensuring seamless integration and shared type definitions between its React/TypeScript frontend and Node.js/Express backend. The business vision is to provide a robust, AI-powered platform that significantly enhances sales velocity, win rates, deal sizes, and overall productivity for users. Key capabilities include a 7-tier product system with automated role assignment and feature inheritance, a complete CRUD API infrastructure for core CRM entities, smart automations, and an advanced entitlements system.

# User Preferences

Preferred communication style: Simple, everyday language.
Design Implementation: Always use the exact design, styling, and structure from attached assets rather than creating custom interpretations. Follow the specific component layouts, color schemes, and UI patterns exactly as provided in the attached asset files.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite.
- **Styling**: Tailwind CSS with shadcn/ui for consistent UI components.
- **State Management**: Zustand stores for global state management.
- **Data Fetching**: TanStack Query v5 with custom hooks for all CRM entities.
- **Routing**: React Router for client-side navigation.
- **Component Architecture**: Feature-based organization with shared UI components, contexts, and lazy-loaded pages.
- **UI/UX Decisions**: Exact implementation of design patterns from attached assets, including specific component layouts, color schemes, and UI patterns. Features glass morphism and modern buttons on certain pages. Application defaults to light mode. Navbar features minimize/maximize functionality with state persistence.

## Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Storage Layer**: Modular storage interface supporting in-memory for development and PostgreSQL for production.
- **API Design**: RESTful endpoints with standardized error handling and full CRUD operations for core CRM entities (Contacts, Deals, Tasks, Appointments, Communications, Notes, Documents).
- **Security**: Session-based authentication, user-scoped queries (all data filtered by profileId), Zod validation, and privilege escalation prevention.
- **Dev Bypass**: Development authentication bypass for testing with designated dev emails (dev@smartcrm.local, dean@smartcrm.vip, dean@videoremix.io, samuel@videoremix.io, victor@videoremix.io).

## Data Storage Solutions
- **Database**: PostgreSQL with Supabase hosting for production.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema**: Shared TypeScript schema definitions for core entities, including a comprehensive entitlements system.

## Authentication and Authorization
- **Session Management**: PostgreSQL-backed session storage.
- **Multi-tenancy**: Built-in support for tenant-based access control.
- **Role System**: Three-tier role structure (Super Admin, WL Users, Regular Users) with email-based super admin assignment.
- **Product Tier System**: 7-tier product-based access control (Super Admin, Whitelabel, SmartCRM Bundle, SmartCRM, Sales Maximizer, AI Boost Unlimited, AI Communication) with feature inheritance.
- **Multi-Payment Provider Integration**: Unified product tier provisioning across JVZoo, Stripe, PayPal, and Zaxaa webhooks.
- **Entitlements System**: Product-type based access control (lifetime, monthly, yearly, payment_plan) with automated enforcement.
- **Supabase Authentication**: Full integration with custom email templates and proper redirect URLs for authentication flows.

## Payment Webhooks
- **Stripe**: Uses Replit Stripe Connector for secure credential management. Handles checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted, charge.refunded, charge.dispute.created.
- **PayPal**: Full IPN webhook support for CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, subscription events, refunds, and disputes.
- **JVZoo**: SALE, RFND, CGBK, INSF transaction handling with hash verification.
- **Zaxaa**: Full webhook integration for sales, refunds, and cancellations.
- All payment providers automatically provision product tiers and create/update entitlements.

## AI Integration Architecture
- **GPT-5 Official Integration**: Full implementation using OpenAI's GPT-5 model, utilizing advanced API parameters for strategic business intelligence, advanced coding capabilities, and multimodal analysis.
- **AI Goals System**: Comprehensive goal management with 58+ pre-configured business goals across 6 categories. Employs Composio service managing 7 specialized AI agents for real-time goal execution.

## Automation System Architecture
- **Smart Automations**: 16 pre-configured automation workflows across four categories (Follow-Up, Pipeline, Relationships, Time-Savers). Features individual configuration pages with scheduling and custom rules.

## Remote Modules Integration
- Direct integration of multiple remote modules (e.g., Contacts, Pipeline, White Label Suite, Product Research, AI Analytics Dashboard) via iframes, with a bidirectional PostMessage-based bridge system for data synchronization. Supports external connected apps like FunnelCraft AI, SmartCRM Closer, and ContentAI as remote embedded apps.
- Comprehensive CRM System Pages: Implemented 9 core pages (PhoneSystem, Invoicing, ContentLibrary, FormsAndSurveys, VoiceProfiles, BusinessAnalysis, Appointments, CircleProspecting, CommunicationHub).

# External Dependencies

### Core Infrastructure
- **Database Hosting**: Supabase PostgreSQL
- **Authentication**: Supabase (@supabase/supabase-js)
- **File Storage**: Supabase

### AI Services
- **Google AI**: Gemini models
- **OpenAI**: GPT models

### Communication
- **Video Calling**: Simple-peer (WebRTC) with PeerJS
- **Real-time Features**: WebSockets
- **Email Integration**: SMTP

### UI and Visualization
- **Charts**: Recharts
- **Drag and Drop**: @hello-pangea/dnd
- **Date Handling**: date-fns
- **Search**: Fuse.js

### Utilities
- **HTTP Client**: TanStack Query
- **Form Handling**: React Hook Form with Zod
- **Styling Utilities**: clsx, class-variance-authority
- **Command Interface**: cmdk

# Recent Changes (December 2024)

## JVZoo Webhook Integration Fixes
- Fixed TypeScript errors by replacing `getUserByEmail` (non-existent) with `listUsers` filtering
- Added entitlements creation on SALE using `handleSuccessfulPurchase` with lifetime product type
- Added entitlements revocation on RFND/CGBK with immediate revoke
- Replaced `signInWithOtp` with `admin.generateLink` for production-ready magic link emails
- All transaction handlers (SALE, RFND, CGBK, INSF) now fully production ready

## API Fixes
- Added missing `/api/tenant/info` endpoint for frontend tenant context
- Fixed all 64 TypeScript errors in server/routes.ts
- Fixed array type inference issues across authentication, messaging, and admin endpoints

## Database Status
- All CRM tables populated with sample data (5 records each: contacts, deals, tasks, appointments, communications, notes)
- 115 profile records
- Entitlements table ready for JVZoo provisioning

## Production Readiness Notes
- New signups receive `productTier: null` (ZERO access) until purchasing a paid tier
- Dev bypass emails for testing: dev@smartcrm.local, dean@smartcrm.vip, dean@videoremix.io, samuel@videoremix.io, victor@videoremix.io
- JVZoo hash verification uses sha1(secret:receipt:transaction) - may need adjustment per vendor docs