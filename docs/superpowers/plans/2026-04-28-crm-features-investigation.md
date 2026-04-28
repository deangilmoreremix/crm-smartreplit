# CRM Features Investigation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conduct a very thorough investigation of core CRM features in the repository, classifying each entity as IMPLEMENTED, IN DEVELOPMENT, PLANNED, or NOT FOUND, with evidence including file paths, code snippets, and classifications.

**Architecture:** Systematically search for each CRM entity (Companies, Contacts, Opportunities, and others) across database schemas, API endpoints, frontend components, business logic, services, filters, and search functionality using glob patterns, regex searches, and semantic codebase searches.

**Tech Stack:** Glob, Grep, Read, Codebase_search, Bash

---

### Task 1: Identify All CRM Entities

**Files:**
- Output: List of entities found (Companies, People/Contacts, Opportunities, others)

- [ ] **Step 1: Search for common CRM entities in codebase**

Use codebase_search with query "CRM entities like companies, contacts, opportunities"

- [ ] **Step 2: Compile list from search results**

From the search, extract mentioned entities.

- [ ] **Step 3: Manual check for additional entities**

Use grep for keywords like "lead", "deal", "account", "organization"

---

### Task 2: Investigate Contacts Entity

**Files:**
- Investigation findings documented in final report

- [ ] **Step 1: Search for database schema**

Use grep "contacts" in **/*.sql, **/migrations/**, **/schema/**

Use read on found files to examine table structure, fields, relationships

- [ ] **Step 2: Search for API endpoints**

Use grep "contacts" in **/api/**, **/routes/**

Look for CRUD operations

- [ ] **Step 3: Search for frontend components**

Use glob **/contacts/**, **/*contact*/

Use grep "contact" in **/*.tsx, **/*.vue, **/*.js for React/Vue components

- [ ] **Step 4: Search for business logic and services**

Use grep "contact" in **/services/**, **/lib/**, **/utils/**

- [ ] **Step 5: Search for filters and search**

Use grep "filter.*contact", "search.*contact" in codebase

- [ ] **Step 6: Classify based on evidence**

Determine status: IMPLEMENTED if all parts exist and work, IN DEVELOPMENT if code exists but incomplete, PLANNED if mentioned in docs, NOT FOUND if no evidence

---

### Task 3: Investigate Companies Entity

**Files:**
- Same as Task 2, for companies

- [ ] **Step 1: Search for database schema**

Use grep "companies" or "company" in schema files

- [ ] **Step 2: Search for API endpoints**

Use grep "companies" in routes

- [ ] **Step 3: Search for frontend components**

Glob **/companies/**

- [ ] **Step 4: Search for business logic**

Grep in services

- [ ] **Step 5: Search for filters and search**

- [ ] **Step 6: Classify**

---

### Task 4: Investigate Opportunities Entity

**Files:**
- Similar

- [ ] **Step 1: Search for database schema**

Grep "opportunities" or "opportunity"

- [ ] **Step 2: API**

- [ ] **Step 3: Frontend**

- [ ] **Step 4: Logic**

- [ ] **Step 5: Filters**

- [ ] **Step 6: Classify**

---

### Task 5: Investigate Other Entities

**Files:**
- For each additional entity found in Task 1

- [ ] Repeat steps 1-6 for each

---

### Task 6: Compile Final Report

**Files:**
- Create: investigation-report.md

- [ ] **Step 1: Organize findings by entity**

Group evidence for each entity

- [ ] **Step 2: Provide classifications with specific evidence**

File paths, line numbers, code snippets

- [ ] **Step 3: Write the report**

Use write tool to create the report file

- [ ] **Step 4: Output the report**

Display the final organized findings