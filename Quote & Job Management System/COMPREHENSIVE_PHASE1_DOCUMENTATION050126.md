# PREMIER INSULATION - PHASE 1 COMPREHENSIVE IMPLEMENTATION GUIDE

**Complete Documentation for Phase 1 Delivery**
Last Updated: January 2026
Version: 1.0

---

## TABLE OF CONTENTS

1. [Workflow & Process Overview](#1-workflow--process-overview)
2. [Settings Page Design](#2-settings-page-design)
3. [Templates Inventory & Architecture](#3-templates-inventory--architecture)
4. [Phase 1 Priority Templates - Complete Code](#4-phase-1-priority-templates---complete-code)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Testing & Deployment](#6-testing--deployment)

---

# 1. WORKFLOW & PROCESS OVERVIEW

## Complete End-to-End Workflow: Opportunity to Payment

This section documents the complete business process from opportunity creation through payment receipt, including all automations, escalations, and system touchpoints.

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. OPPORTUNITY CREATED                                              │
│    - Customer contact received (Phone/Email/Website)                │
│    - Opportunity record created with client details                 │
│    - Sales rep assigned                                             │
│    - Status: Open                                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 2. FOLLOW-UP TASK CREATED FOR SALES REP                             │
│    - Task auto-created: "Follow-up call with [Customer]"            │
│    - Due date: Today + 2 days                                       │
│    - Assigned to: Sales rep assigned to opportunity                 │
│    - Customer phone/email visible in task                           │
│    - Status: Open Task                                              │
│                                                                     │
│    ⚠️ ESCALATION AUTOMATION:                                        │
│    - If task NOT marked complete by due date (Day 3)                │
│    - Auto-escalate to Admin                                         │
│    - Admin notified: "[Sales Rep] missed follow-up"                 │
│    - Admin can reassign or escalate to manager                      │
│                                                                     │
│    ✓ Sales rep calls/emails customer                                │
│    ✓ Assess interest, gather initial details                        │
│    ✓ Schedule free assessment                                       │
│    ✓ Mark task complete                                             │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 3. FREE ASSESSMENT SCHEDULED                                        │
│    - Premier user creates assessment booking                        │
│    - Selects date, time, installer from calendar                   │
│    - Customer notified: Date/time confirmation                      │
│    - Status: Assessment Scheduled                                   │
│                                                                     │
│    HOW INSTALLER ACCESSES CALENDAR:                                 │
│    ┌─────────────────────────────────────────────────────────┐     │
│    │ Option A: Mobile App Dashboard                          │     │
│    │  - Installer opens mobile app                           │     │
│    │  - Sees calendar view of scheduled assessments          │     │
│    │  - Can click to view full details                       │     │
│    │  - Can accept/decline/reschedule                        │     │
│    │                                                         │     │
│    │ Option B: Email Notification (Automatic)               │     │
│    │  - "Assessment scheduled for [Date/Time]"              │     │
│    │  - Link to mobile app view                              │     │
│    │  - Contains address, client details                     │     │
│    │                                                         │     │
│    │ Option C: Google Calendar Sync (Future)                │     │
│    │  - Assessment appears in installer's Google Calendar   │     │
│    │  - Read-only access from google_calendar_events table  │     │
│    └─────────────────────────────────────────────────────────┘     │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 4. FREE ASSESSMENT COMPLETED                                        │
│    - Installer visits site (mobile app)                             │
│    - Records: Photos, measurements, area assessments                │
│    - Assessment findings: Pass/Fail/Exempt per area                 │
│    - Status: Assessment Complete                                    │
│    - Assessment report auto-generated                               │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 5. QUOTE INITIATED FOR VA                                           │
│    - Assessment assigned to VA with enquiry                         │
│    - VA receives notification                                       │
│    - Status: Awaiting VA Recommendation                             │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 6. VA RECEIVES ENQUIRY IN VA WORKSPACE                              │
│    - VA logs into VA Workspace                                      │
│    - Sees pending enquiry with assessment data                      │
│    - Can view assessment photos, findings, areas                    │
│    - Status: In VA Workspace                                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 7. VA CREATES PRODUCT RECOMMENDATION                                │
│    - VA creates recommendation (NO pricing visible)                 │
│    - Selects products, areas, quantities based on assessment        │
│    - Calculates packs needed, shows stock status                    │
│    - Can save as Draft or Submit for review                         │
│    - Status: Draft / Submitted                                      │
│    - Recommendation numbered: REC-2025-001.01                       │
│                                                                     │
│    ⚠️ ESCALATION AUTOMATION:                                        │
│    - If recommendation in Draft >3 days → Notify admin              │
│    - Admin: Reassign to another VA or follow up                     │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 8. PREMIER USER REVIEWS & CONVERTS TO QUOTE                         │
│    - Premier user reviews VA recommendation                         │
│    - Adds pricing tier (Retail/Trade/VIP/Custom)                    │
│    - Sets labour rate, custom discounts                             │
│    - System calculates margins & totals                             │
│    - Generates quote number: Q-2025-001.01                          │
│    - Status: Quote Draft                                            │
│    - Recommendation status → "Converted to Quote"                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│ 9. QUOTE FINALIZED & SENT TO CUSTOMER                               │
│    - Premier selects PDF template (A or B)                          │
│    - Quote PDF generated                                            │
│    - Email sent to customer with terms                              │
│    - Validity period: Default 30 days                               │
│    - Status: Quote Sent                                             │
│                                                                     │
│    ⚠️ ESCALATION AUTOMATION:                                        │
│    - Day 20: Reminder email to customer                             │
│    - Day 30: Quote expires, marked as expired                       │
└────────────────────┬────────────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────────┐
        │                              │
┌───────▼──────────────┐     ┌────────▼──────────────┐
│ QUOTE ACCEPTED       │     │ QUOTE REJECTED/EXPIRED│
│ Status: Accepted     │     │ Status: Lost          │
└───────┬──────────────┘     └───────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│ 10. JOB CREATED & SCHEDULED                                         │
│     - Quote converted to Job                                        │
│     - Job number generated: JOB-2025-001                            │
│     - Job scheduled: Date, time, address                            │
│     - Crew assigned (installer team)                                │
│     - Status: Scheduled                                             │
│                                                                     │
│     ⚠️ AUTOMATION:                                                  │
│     - Job added to installer calendar                               │
│     - Installer notified (email + app)                              │
│     - Material requirements checked vs quote                        │
└───────┬────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│ 11. INVENTORY RESERVED & UPDATED                                    │
│     - Materials from quote reserved from stock                      │
│     - Stock levels decremented                                      │
│     - Low stock alerts triggered (if below reorder level)           │
│     - Purchase orders generated for restocking                      │
│     - Status: Materials Ready                                       │
│                                                                     │
│     ⚠️ AUTOMATION:                                                  │
│     - Alert: "Stock low for PIL-006" → Send to admin                │
│     - Auto-generate PO if configured                                │
└───────┬────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│ 12. JOB COMPLETED ON-SITE                                           │
│     - Installer uses mobile app                                     │
│     - Records: Before/after photos                                  │
│     - Actual materials used vs quoted                               │
│     - Customer signature/approval                                   │
│     - Completion notes                                              │
│     - Status: Completed                                             │
│                                                                     │
│     ⚠️ AUTOMATION:                                                  │
│     - Completion certificate auto-generated                         │
│     - Status updates in system                                      │
│     - Triggers invoice generation process                           │
└───────┬────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│ 13. INVOICE RAISED                                                  │
│     - Auto-generated from completed job                             │
│     - Invoice number: INV-2025-001                                  │
│     - Includes actual materials used, labour, GST (15%)             │
│     - Payment terms applied (default: Net 30)                       │
│     - PDF generated with company branding                           │
│     - Email sent to customer with payment instructions              │
│     - Status: Invoice Sent                                          │
│                                                                     │
│     ⚠️ AUTOMATION:                                                  │
│     - Day 21: Payment reminder email                                │
│     - Day 30: Due date notification                                 │
│     - Day 35+: Overdue alert to admin                               │
└───────┬────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│ 14. PAYMENT RECEIVED & RECONCILED                                   │
│     - Payment processed (bank transfer/credit card)                 │
│     - Matched to invoice automatically                              │
│     - Payment recorded in system                                    │
│     - Invoice marked as Paid                                        │
│     - Status: Complete                                              │
│                                                                     │
│     ⚠️ AUTOMATION:                                                  │
│     - Payment confirmation email to customer                        │
│     - Monthly reconciliation report to admin                        │
│     - Revenue recognized in accounting                              │
└───────────────────────────────────────────────────────────────────┘
```

### Workflow Automations Required

#### Task Management Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Follow-up Task Creation** | Opportunity created | Create task due in 2 days | Sales rep |
| **Follow-up Escalation** | Task due date + 1 day, not completed | Escalate to Admin | Admin |
| **Recommendation Timeout** | Recommendation in Draft >3 days | Notify admin to follow up | Admin |

#### Calendar & Notification Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Assessment Schedule Notification** | Assessment scheduled | Notify installer (email + app) | Installer |
| **Assessment Reminder** | Assessment date - 1 day | Reminder to installer | Installer |
| **Job Schedule Notification** | Job created from quote | Add to installer calendar, notify | Installer |
| **Job Reminder** | Job scheduled date - 1 day | Reminder to crew | Installer Team |

#### Quote & Invoice Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Quote Sent Notification** | Quote finalized & sent | Email to customer with terms | Customer |
| **Quote Expiry Reminder** | Quote validity day 20 | Reminder email | Customer |
| **Quote Expiry** | Quote validity date reached | Mark as expired, notify sales rep | Sales rep |
| **Invoice Generation** | Job marked complete | Auto-generate invoice from job | System |
| **Invoice Sent** | Invoice created | Email to customer with payment link | Customer |
| **Payment Reminder 1** | Invoice issued + 21 days | Reminder email | Customer |
| **Payment Reminder 2** | Invoice due date reached | Due date notification | Customer |
| **Overdue Alert** | Invoice past due + 5 days | Alert admin for follow-up | Admin |

#### Inventory Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Stock Reservation** | Job created from quote | Reserve materials from stock | System |
| **Low Stock Alert** | Stock level ≤ reorder level | Alert admin | Admin |
| **Purchase Order Generation** | Low stock alert | Auto-generate PO (if configured) | Admin |
| **Stock Update** | Job completed | Update actual materials used | System |

### Implementation Status Summary

| Step | Component | Status | Priority |
|------|-----------|--------|----------|
| 1 | Opportunity Created | ✅ Done | - |
| 2 | Follow-up Task Creation | ❌ Missing | HIGH |
| 2 | Follow-up Escalation | ❌ Missing | HIGH |
| 3 | Assessment Scheduled | ✅ Done | - |
| 3 | Installer Calendar Access | ⚠️ Partial | HIGH |
| 4 | Assessment Completed | ✅ Done | - |
| 4 | Assessment Report | ⚠️ Partial | MEDIUM |
| 5-6 | Quote Initiated & VA Receives | ✅ Done | - |
| 7 | VA Creates Recommendation | ❌ Missing | HIGH |
| 7 | Recommendation Escalation | ❌ Missing | MEDIUM |
| 8 | Convert to Quote | ❌ Missing | HIGH |
| 9 | Quote Sent to Customer | ⚠️ Partial | HIGH |
| 9 | Quote Expiry Automation | ❌ Missing | MEDIUM |
| 10 | Job Created & Scheduled | ❌ Missing | HIGH |
| 10 | Job Notification | ❌ Missing | HIGH |
| 11 | Inventory Reserved | ❌ Missing | HIGH |
| 11 | Low Stock Alerts | ⚠️ Partial | MEDIUM |
| 12 | Job Completed Mobile | ❌ Missing | HIGH |
| 12 | Completion Certificate | ❌ Missing | MEDIUM |
| 13 | Invoice Generated | ❌ Missing | HIGH |
| 13 | Invoice Emails & Reminders | ❌ Missing | HIGH |
| 13 | Overdue Tracking | ❌ Missing | MEDIUM |
| 14 | Payment Received | ❌ Missing | MEDIUM |

---

# 2. SETTINGS PAGE DESIGN

## Page Layout: Card-Based Dashboard

The Settings page provides admin-only access to all system configuration through a card-based interface. Each card is clickable and opens a modal or drawer for detailed configuration.

### Visual Layout

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                            ⚙️  SETTINGS                                    ║
║                      System Configuration & Management                     ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝


┌──────────────────────────────────────────────────────────────────────────┐
│                         COMPANY & BRANDING                               │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐
│  🏢  COMPANY DETAILS    │  │  🎨  LOGO & BRANDING   │  │  📧  EMAIL SETTINGS      │
│                         │  │                         │  │                          │
│ • Company name          │  │ • Logo upload           │  │ • From address           │
│ • Address               │  │ • Company colours       │  │ • Reply-to address       │
│ • Phone                 │  │ • Website               │  │ • Email signature        │
│ • Website               │  │ • Tax ID / GST          │  │ • Email templates        │
│                         │  │                         │  │                          │
│          [EDIT]         │  │        [UPLOAD]         │  │         [EDIT]           │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                        USERS & PERMISSIONS                               │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐
│  👥  TEAM MEMBERS       │  │  🔐  ROLES              │  │  🔑  PERMISSIONS         │
│                         │  │                         │  │                          │
│ • Add/edit users        │  │ • Admin                 │  │ • Role-based access      │
│ • Assign roles          │  │ • Sales Rep             │  │ • Feature access         │
│ • Enable/disable        │  │ • VA                    │  │ • Module restrictions    │
│ • Password reset        │  │ • Installer             │  │ • Data visibility        │
│                         │  │                         │  │                          │
│        [MANAGE]         │  │      [CONFIGURE]        │  │     [SET PERMISSIONS]    │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                      PRICING & PRODUCTS                                  │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐
│  💰  PRICING TIERS      │  │  📦  PRODUCTS           │  │  ⚙️  INVENTORY SETTINGS  │
│                         │  │                         │  │                          │
│ • Retail markup (60%)   │  │ • Add/edit products     │  │ • Default waste % (10%)  │
│ • Trade markup (40%)    │  │ • SKU, description      │  │ • Reorder levels         │
│ • VIP markup (25%)      │  │ • Pricing               │  │ • Stock alerts           │
│ • Labour rate ($3/m²)   │  │ • R-value, thickness    │  │ • Bale sizes             │
│                         │  │                         │  │                          │
│      [CONFIGURE]        │  │      [MANAGE]           │  │      [SETTINGS]          │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                     QUOTES & INVOICES                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐
│  📋  QUOTE SETTINGS     │  │  🧾  INVOICE SETTINGS   │  │  📄  TERMS & CONDITIONS  │
│                         │  │                         │  │                          │
│ • Validity period (30d) │  │ • Numbering format      │  │ • T&Cs text              │
│ • Numbering format      │  │ • Payment terms (Net 30)│  │ • Version control        │
│ • PDF templates (A/B)   │  │ • Payment methods       │  │ • Activate/deactivate    │
│ • Payment terms         │  │ • Bank details          │  │ • Include in docs        │
│                         │  │                         │  │                          │
│      [CONFIGURE]        │  │      [CONFIGURE]        │  │       [EDITOR]           │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                   BUSINESS SETUP & CONFIGURATION                         │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐
│  🏷️  APPLICATION TYPES  │  │  👔  SALES REPS         │  │  🗺️  REGIONS            │
│                         │  │                         │  │                          │
│ • Add/edit types        │  │ • Add/edit reps         │  │ • Add/edit regions       │
│ • Colour coding         │  │ • Commission rates      │  │ • Postcode mapping       │
│ • External Walls        │  │ • Contact details       │  │ • Territory assignment   │
│ • Masonry, GIW, etc.    │  │ • Active/inactive       │  │ • Region assignment      │
│                         │  │                         │  │                          │
│      [MANAGE]           │  │      [MANAGE]           │  │      [MANAGE]            │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                      SUPPLIERS & PROCUREMENT                             │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│  🤝  SUPPLIERS          │  │  📊  SYSTEM DEFAULTS    │
│                         │  │                         │
│ • Add/edit suppliers    │  │ • GST rate (15%)        │
│ • Contact details       │  │ • Waste % (10%)         │
│ • Payment terms         │  │ • Labour cost ($1.50)   │
│ • Lead time             │  │ • Labour sell ($3.00)   │
│                         │  │ • Currency (NZD)        │
│      [MANAGE]           │  │ • Date format           │
└─────────────────────────┘  └──────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                      ADMIN & ADVANCED                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐
│  📋  ACTIVITY LOG        │  │  🔧  ADVANCED TOOLS     │  │  🆘  SYSTEM TOOLS        │
│                         │  │                         │  │                          │
│ • User action history   │  │ • API keys              │  │ • Database backup        │
│ • Change tracking       │  │ • Webhook settings      │  │ • Import/export data     │
│ • Audit trail           │  │ • Rate limiting         │  │ • Clear cache            │
│ • Data retention        │  │ • Debug mode            │  │ • System health          │
│                         │  │                         │  │                          │
│       [VIEW]            │  │      [SETTINGS]         │  │       [TOOLS]            │
└─────────────────────────┘  └─────────────────────────┘  └──────────────────────────┘

```

### Design Specifications

#### Color Scheme
- **Card Background:** White (#FFFFFF) with subtle shadow
- **Icon Color:** Salesforce Blue (#0066CC)
- **Header Text:** Dark Gray (#1F2937)
- **Subtext:** Light Gray (#6B7280)
- **Button:** Salesforce Blue (#0066CC) hover → darker blue

#### Typography
- **Page Title:** 24px, Bold, Dark Gray
- **Card Title:** 16px, Semibold, Dark Gray
- **Card Description:** 14px, Regular, Light Gray
- **Button:** 14px, Semibold, White on blue

#### Layout
- **Grid:** 3 columns on desktop, 2 on tablet, 1 on mobile
- **Card Spacing:** 24px gap between cards
- **Card Height:** Auto-adjusting based on content (150px min)
- **Icon Size:** 24px, positioned top-left of card
- **Hover State:** Light shadow increase, subtle background tint

#### Icons (Lucide React)
```
🏢 Building
🎨 Palette
📧 Mail
👥 Users
🔐 Lock / Shield
🔑 Key
💰 DollarSign
📦 Package
⚙️ Settings
💵 Coins
📋 ClipboardList
🏷️ Tag
👔 UserCheck
🗺️ Map
🤝 Handshake
📊 BarChart3
📋 FileText
🔧 Wrench
🆘 AlertCircle
```

### Card Click Behavior

Clicking any card opens a modal or drawer with:
1. Full editor/form for that setting
2. Save/Cancel buttons at bottom
3. Confirmation messages for successful updates
4. Validation for required fields

### Mobile Responsive

- **Desktop (3 columns):** Full grid layout
- **Tablet (2 columns):** 2 cards per row
- **Mobile (1 column):** Full width single column, cards stack vertically

### Implementation Notes

- **Admin Only:** All settings require Admin role
- **Confirmation Dialogs:** Destructive actions require confirmation
- **Success Toast:** Green toast notification when settings saved
- **Error Handling:** Display validation errors inline
- **Loading States:** Show spinner while saving
- **Audit Trail:** All settings changes logged to activity_log table

---

# 3. TEMPLATES INVENTORY & ARCHITECTURE

## Overview: All Templates Required

This section documents all templates needed for the system, their locations, storage mechanisms, and implementation priorities.

### Template Architecture

```
TEMPLATES STRUCTURE
════════════════════════════════════════════════════════════════

DATABASE TEMPLATES (Supabase)
├── Email Templates (20 total)
├── SMS Templates (6 total)
├── Notification Templates (8 in-app)
├── Document Templates (Headers, Footers, T&Cs)
└── Email Signatures

FILE-BASED TEMPLATES (Next.js/Component Files)
├── PDF Templates
│   ├── Quote Template A (Detailed Line-Item)
│   ├── Quote Template B (Summary Pricing)
│   ├── Invoice Template
│   └── Assessment Report Template
└── Completion Certificate Template
```

### Template Categories & Locations

#### 1. EMAIL TEMPLATES

**Storage:** `email_templates` Table (Supabase)

| # | Template Name | Key | Used When | Variables |
|---|---------------|-----|-----------|-----------|
| 1 | Task Assigned | `task_assigned` | Sales rep gets follow-up task | sales_rep_name, customer_name, due_date, task_link |
| 2 | Task Escalated | `task_escalated` | Task overdue, escalated to admin | admin_name, sales_rep_name, customer_name, task_description |
| 3 | Assessment Scheduled | `assessment_scheduled` | Assessment booked for installer | installer_name, customer_name, assessment_date, site_address |
| 4 | Assessment Reminder | `assessment_reminder` | Day before assessment | installer_name, customer_name, assessment_date, site_address |
| 5 | Assessment Complete | `assessment_complete` | Assessment finished, sent to VA | va_name, customer_name, assessment_date, areas_assessed |
| 6 | Quote Sent | `quote_sent` | Quote finalized and sent | customer_name, quote_number, quote_total, validity_date, sales_rep_phone |
| 7 | Quote Expiry Reminder | `quote_expiry_reminder` | 10 days before quote expires | customer_name, quote_number, expiry_date |
| 8 | Quote Expired | `quote_expired` | Quote expired | customer_name, quote_number, sales_rep_name |
| 9 | Quote Accepted | `quote_accepted` | Customer accepts quote | sales_rep_name, customer_name, quote_number, job_start_date |
| 10 | Quote Rejected | `quote_rejected` | Customer rejects quote | sales_rep_name, customer_name, quote_number |
| 11 | Job Scheduled | `job_scheduled` | Job created and scheduled | installer_names, customer_name, job_date, site_address |
| 12 | Job Reminder | `job_reminder` | Day before job | installer_names, customer_name, job_date, site_address |
| 13 | Job Completed | `job_completed` | Job marked complete | customer_name, job_number, completion_date |
| 14 | Invoice Sent | `invoice_sent` | Invoice generated and sent | customer_name, invoice_number, invoice_total, due_date |
| 15 | Payment Reminder 1 | `payment_reminder_1` | 21 days after invoice | customer_name, invoice_number, due_date |
| 16 | Payment Reminder 2 | `payment_reminder_2` | Invoice due date | customer_name, invoice_number, due_date |
| 17 | Payment Overdue | `payment_overdue` | 5+ days past due | admin_name, customer_name, invoice_number, overdue_amount |
| 18 | Payment Received | `payment_received` | Payment confirmed | customer_name, invoice_number, payment_date |
| 19 | VA Recommendation Received | `va_recommendation_received` | VA submits recommendation | sales_rep_name, customer_name, recommendation_number |
| 20 | Low Stock Alert | `low_stock_alert` | Stock below reorder level | admin_name, product_name, current_stock, reorder_level |

#### 2. SMS TEMPLATES

**Storage:** `sms_templates` Table (Supabase)

| # | Template Name | Key | Used When | Max Length |
|---|---------------|-----|-----------|------------|
| 1 | Assessment Scheduled | `sms_assessment_scheduled` | Confirm assessment to customer | 160 chars |
| 2 | Assessment Reminder | `sms_assessment_reminder` | Reminder day before assessment | 160 chars |
| 3 | Job Scheduled | `sms_job_scheduled` | Confirm job to customer | 160 chars |
| 4 | Job Reminder | `sms_job_reminder` | Reminder day before job | 160 chars |
| 5 | Quote Sent | `sms_quote_sent` | Quick notification quote ready | 160 chars |
| 6 | Payment Reminder | `sms_payment_reminder` | Invoice due soon | 160 chars |

#### 3. NOTIFICATION TEMPLATES

**Storage:** System-generated (not in DB, auto-triggered)

| # | Type | Trigger | Icon | Color |
|---|------|---------|------|-------|
| 1 | Task Assignment | Task created | 📋 | Blue |
| 2 | Quote Ready | Quote finalized | ✅ | Green |
| 3 | Assessment Complete | Assessment marked done | ✅ | Green |
| 4 | Low Stock | Stock below reorder | ⚠️ | Orange |
| 5 | Task Overdue | Task due date passed | 🔴 | Red |
| 6 | Payment Overdue | Invoice past due | 🔴 | Red |
| 7 | Recommendation Submitted | VA submits recommendation | 📬 | Blue |
| 8 | Job Assigned | Installer assigned to job | 👷 | Blue |

#### 4. PDF TEMPLATES

**Storage:** React Components (File-based)

**Location:** `src/components/pdf/`

| # | Template | File | Used When |
|---|----------|------|-----------|
| 1 | Quote A (Detailed) | `QuoteTemplateA.tsx` | Customer receives quote with full line items |
| 2 | Quote B (Summary) | `QuoteTemplateB.tsx` | Customer receives simplified quote summary |
| 3 | Invoice | `InvoicePDFTemplate.tsx` | Invoice sent after job completion |
| 4 | Assessment Report | `AssessmentReportTemplate.tsx` | After assessment completion, before recommendation |
| 5 | Completion Certificate | `CompletionCertificateTemplate.tsx` | After job completion, with installer signature |

#### 5. DOCUMENT TEMPLATES

**Storage:** Database + HTML Editor

| # | Template | Table | Used Where |
|---|----------|-------|------------|
| 1 | Terms & Conditions | `quote_terms` | Attached to all quotes, selectable by version |
| 2 | Quote Header | `document_templates` | Top of all quote PDFs |
| 3 | Quote Footer | `document_templates` | Bottom of all quote PDFs |
| 4 | Invoice Header | `document_templates` | Top of all invoice PDFs |
| 5 | Invoice Footer | `document_templates` | Bottom of all invoice PDFs |
| 6 | Email Signature | `email_signatures` | End of all outgoing emails (per user) |

### Complete Summary Table

| Template Type | Count | Storage | Location | Editor | Phase |
|---------------|-------|---------|----------|--------|-------|
| **Email** | 20 | Supabase | `email_templates` | Settings → Email | 1B |
| **SMS** | 6 | Supabase | `sms_templates` | Settings → SMS | 1B |
| **In-App Notifications** | 8 | Code/Config | System | Auto-generated | 1A |
| **Quote PDF A** | 1 | React | `src/components/pdf/` | Code | 1A |
| **Quote PDF B** | 1 | React | `src/components/pdf/` | Code | 1A |
| **Invoice PDF** | 1 | React | `src/components/pdf/` | Code | 1A |
| **Assessment Report PDF** | 1 | React | `src/components/pdf/` | Code | 1A |
| **Completion Certificate** | 1 | React | `src/components/pdf/` | Code | 1B |
| **T&Cs** | 1 | Supabase | `quote_terms` | Settings → T&Cs | 1A |
| **Headers/Footers** | 4 | Supabase | `document_templates` | Settings → Docs | 1B |
| **Email Signature** | ∞ | Supabase | `email_signatures` | User Profile | 1B |
| **TOTAL** | 45+ | Mixed | Mixed | Mixed | Mixed |

---

# 4. PHASE 1 PRIORITY TEMPLATES - COMPLETE CODE

## 6 Priority Phase 1 Deliverables

1. ✅ Email Templates (6 critical)
2. ✅ Quote PDF Template A
3. ✅ Quote PDF Template B
4. ✅ Invoice PDF Template
5. ✅ Terms & Conditions
6. ✅ Assessment Report PDF

## PART 1: DATABASE SETUP

### 1.1 Email Templates Table (SQL)

```sql
-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  plain_text_body TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for template_key lookup
CREATE INDEX idx_email_templates_key ON email_templates(template_key);

-- Insert 6 critical email templates
INSERT INTO email_templates (template_name, template_key, subject, html_body, variables, is_active)
VALUES
(
  'Task Assigned',
  'task_assigned',
  'Action Required: Follow-up Task - {{customer_name}}',
  '<html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066CC;">Task Assigned</h2>
      <p>Hi {{sales_rep_name}},</p>
      <p>You have been assigned a follow-up task:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Customer:</td>
          <td style="padding: 8px;">{{customer_name}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Phone:</td>
          <td style="padding: 8px;">{{customer_phone}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email:</td>
          <td style="padding: 8px;">{{customer_email}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Due Date:</td>
          <td style="padding: 8px;">{{due_date}}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;"><strong>Task:</strong> Call/email customer to discuss free assessment</p>
      <p><a href="{{task_link}}" style="display: inline-block; background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task in System</a></p>
      <p>Mark complete once you''ve made contact.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">Regards,<br>Premier Insulation System</p>
    </div>
  </body></html>',
  '["sales_rep_name", "customer_name", "customer_phone", "customer_email", "due_date", "task_link"]'::jsonb,
  true
),
(
  'Assessment Scheduled',
  'assessment_scheduled',
  'Assessment Scheduled - {{customer_name}} - {{assessment_date}}',
  '<html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066CC;">Assessment Scheduled</h2>
      <p>Hi {{installer_name}},</p>
      <p>You have a free assessment scheduled:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Customer:</td>
          <td style="padding: 8px;">{{customer_name}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Date:</td>
          <td style="padding: 8px;">{{assessment_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Time:</td>
          <td style="padding: 8px;">{{assessment_time}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Address:</td>
          <td style="padding: 8px;">{{site_address}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Phone:</td>
          <td style="padding: 8px;">{{customer_phone}}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;"><a href="{{assessment_link}}" style="display: inline-block; background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Assessment Details</a></p>
      <p>Please confirm your availability in the app.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">Regards,<br>Premier Insulation</p>
    </div>
  </body></html>',
  '["installer_name", "customer_name", "assessment_date", "assessment_time", "site_address", "customer_phone", "assessment_link"]'::jsonb,
  true
),
(
  'Quote Sent to Customer',
  'quote_sent',
  'Your Premier Insulation Quote - {{quote_number}}',
  '<html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066CC;">Your Quote is Ready</h2>
      <p>Hi {{customer_name}},</p>
      <p>Thank you for choosing Premier Insulation. Your customized quote is ready!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Quote Number:</td>
          <td style="padding: 8px;">{{quote_number}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Total Amount (Inc. GST):</td>
          <td style="padding: 8px; font-weight: bold; color: #0066CC;">${{quote_total}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Valid Until:</td>
          <td style="padding: 8px;">{{validity_date}}</td>
        </tr>
      </table>
      <p style="text-align: center; margin: 20px 0;"><a href="{{quote_pdf_link}}" style="display: inline-block; background-color: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Download Quote PDF</a></p>
      <p><strong>Payment Terms:</strong> {{payment_terms}}</p>
      <p><strong>Questions?</strong> Contact {{sales_rep_name}} at {{sales_rep_phone}}</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">Regards,<br>Premier Insulation Team</p>
    </div>
  </body></html>',
  '["customer_name", "quote_number", "quote_total", "validity_date", "quote_pdf_link", "payment_terms", "sales_rep_name", "sales_rep_phone"]'::jsonb,
  true
),
(
  'Invoice Sent',
  'invoice_sent',
  'Invoice Ready - {{invoice_number}} - Premier Insulation',
  '<html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066CC;">Your Invoice is Ready</h2>
      <p>Hi {{customer_name}},</p>
      <p>Your invoice is ready for payment:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Invoice Number:</td>
          <td style="padding: 8px;">{{invoice_number}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Invoice Date:</td>
          <td style="padding: 8px;">{{invoice_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Due Date:</td>
          <td style="padding: 8px;">{{due_date}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Total Amount (Inc. GST):</td>
          <td style="padding: 8px; font-weight: bold; color: #0066CC;">${{invoice_total}}</td>
        </tr>
      </table>
      <p style="text-align: center; margin: 20px 0;"><a href="{{invoice_pdf_link}}" style="display: inline-block; background-color: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Download Invoice PDF</a></p>
      <p><strong>Payment Instructions:</strong></p>
      <p>{{payment_instructions}}</p>
      <p>Thank you for your business!</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">Regards,<br>Premier Insulation Team</p>
    </div>
  </body></html>',
  '["customer_name", "invoice_number", "invoice_date", "due_date", "invoice_total", "invoice_pdf_link", "payment_instructions"]'::jsonb,
  true
),
(
  'Payment Reminder',
  'payment_reminder',
  'Payment Due Soon - {{invoice_number}}',
  '<html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066CC;">Payment Reminder</h2>
      <p>Hi {{customer_name}},</p>
      <p>This is a friendly reminder that your invoice is due:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Invoice Number:</td>
          <td style="padding: 8px;">{{invoice_number}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Due Date:</td>
          <td style="padding: 8px;">{{due_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Amount Due:</td>
          <td style="padding: 8px; font-weight: bold; color: #0066CC;">${{amount_due}}</td>
        </tr>
      </table>
      <p style="text-align: center; margin: 20px 0;"><a href="{{payment_link}}" style="display: inline-block; background-color: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Pay Now</a></p>
      <p>{{payment_instructions}}</p>
      <p style="color: #999; font-size: 12px;">If you have already paid, please disregard this email.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">Regards,<br>Premier Insulation</p>
    </div>
  </body></html>',
  '["customer_name", "invoice_number", "due_date", "amount_due", "payment_link", "payment_instructions"]'::jsonb,
  true
),
(
  'Assessment Complete',
  'assessment_complete',
  'Assessment Complete - {{customer_name}} - Ready for Quote',
  '<html><body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0066CC;">Assessment Completed</h2>
      <p>Hi {{va_name}},</p>
      <p>Assessment completed and ready for recommendation:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Customer:</td>
          <td style="padding: 8px;">{{customer_name}}</td>
        </tr>
        <tr style="background-color: #f5f5f5;">
          <td style="padding: 8px; font-weight: bold;">Assessment Date:</td>
          <td style="padding: 8px;">{{assessment_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Areas Assessed:</td>
          <td style="padding: 8px;">{{areas_assessed}}</td>
        </tr>
      </table>
      <p style="text-align: center; margin: 20px 0;"><a href="{{va_workspace_link}}" style="display: inline-block; background-color: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Create Recommendation</a></p>
      <p>Review the assessment report and create your product recommendation.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">Regards,<br>Premier Insulation System</p>
    </div>
  </body></html>',
  '["va_name", "customer_name", "assessment_date", "areas_assessed", "va_workspace_link"]'::jsonb,
  true
);

-- Verify insertion
SELECT template_key, template_name, is_active FROM email_templates ORDER BY template_name;
```

### 1.2 Terms & Conditions Table (SQL)

```sql
-- Create quote_terms table for T&Cs versioning
CREATE TABLE IF NOT EXISTS quote_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'Terms & Conditions',
  content TEXT NOT NULL,
  effective_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(version)
);

-- Create index for active terms lookup
CREATE INDEX idx_quote_terms_active ON quote_terms(is_active, effective_date DESC);

-- Insert default Terms & Conditions (Version 1)
INSERT INTO quote_terms (version, title, content, effective_date, is_active, created_at)
VALUES
(
  1,
  'Terms & Conditions - Premier Insulation',
  '<h1>Terms & Conditions</h1>
   <h2>1. Quote Validity</h2>
   <p>All quotes are valid for 30 days from the issue date unless otherwise specified. Quotes may be subject to revision after this period due to market changes.</p>
   
   <h2>2. Payment Terms</h2>
   <p>Payment is due within 30 days of invoice date (Net 30). Payment methods accepted: Bank transfer, Credit card, Cheque.</p>
   <p>A late payment fee of 1.5% per month may apply to overdue invoices.</p>
   
   <h2>3. Installation Terms</h2>
   <p>Installation dates are subject to availability and weather conditions. We will provide a 24-hour notice if any changes are required.</p>
   
   <h2>4. Warranty</h2>
   <p>All materials are warranted for 10 years from installation. Workmanship is guaranteed for 5 years.</p>
   <p>Warranty does not cover damage due to improper maintenance or third-party interference.</p>
   
   <h2>5. Cancellation Policy</h2>
   <p>Cancellations must be made in writing at least 7 days before the scheduled installation. Cancellations within 7 days may incur a cancellation fee of up to 25% of the quote value.</p>
   
   <h2>6. Liability</h2>
   <p>Premier Insulation''s liability is limited to the value of the contract. We are not liable for any indirect or consequential damages.</p>
   
   <h2>7. GST</h2>
   <p>All prices include GST at 15% (New Zealand).</p>
   
   <h2>8. Disputes</h2>
   <p>Any disputes shall be resolved through mediation or arbitration as agreed by both parties.</p>
   
   <p><strong>Acceptance of these terms is required to proceed with installation.</strong></p>',
  CURRENT_DATE,
  true,
  NOW()
);

-- Verify insertion
SELECT version, is_active, effective_date FROM quote_terms ORDER BY version DESC;
```

## PART 2: REACT PDF COMPONENTS

### 2.1 Quote PDF Template A (Detailed)

**File:** `src/components/pdf/QuoteTemplateA.tsx`

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

interface QuoteTemplateAProps {
  quote_number: string;
  issue_date: string;
  validity_date: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  site_address: string;
  line_items: LineItem[];
  subtotal_ex_gst: number;
  gst_amount: number;
  total_inc_gst: number;
  payment_terms: string;
  sales_rep_name: string;
  sales_rep_phone: string;
  company_logo?: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC',
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 40,
  },
  headerText: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  value: {
    width: '70%',
    fontSize: 10,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#0066CC',
    color: '#FFF',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    padding: 8,
    fontSize: 10,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#0066CC',
  },
  totalRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    width: 150,
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 11,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCC',
    fontSize: 9,
    color: '#666',
  },
});

export const QuoteTemplateA: React.FC<QuoteTemplateAProps> = ({
  quote_number,
  issue_date,
  validity_date,
  client_name,
  client_email,
  client_phone,
  site_address,
  line_items,
  subtotal_ex_gst,
  gst_amount,
  total_inc_gst,
  payment_terms,
  sales_rep_name,
  sales_rep_phone,
  company_logo,
  company_name,
  company_phone,
  company_email,
  company_address,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {company_logo && <Image src={company_logo} style={styles.logo} />}
          <Text style={styles.headerText}>{company_name}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.headerText}>Quote #{quote_number}</Text>
          <Text style={styles.headerText}>Issued: {issue_date}</Text>
          <Text style={styles.headerText}>Valid Until: {validity_date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>QUOTE</Text>

      {/* Client Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{client_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{site_address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{client_phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{client_email}</Text>
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRODUCTS & SERVICES</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Total</Text>
          </View>
          {line_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity} {item.unit}</Text>
              <Text style={styles.col3}>${item.unit_price.toFixed(2)}</Text>
              <Text style={styles.col4}>${item.line_total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal (ex GST):</Text>
          <Text style={styles.totalValue}>${subtotal_ex_gst.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GST (15%):</Text>
          <Text style={styles.totalValue}>${gst_amount.toFixed(2)}</Text>
        </View>
        <View style={{ ...styles.totalRow, borderTopWidth: 1, borderTopColor: '#0066CC', paddingTop: 8, marginTop: 8 }}>
          <Text style={{ ...styles.totalLabel, fontSize: 13, fontWeight: 'bold' }}>TOTAL (inc GST):</Text>
          <Text style={{ ...styles.totalValue, fontSize: 13, fontWeight: 'bold' }}>${total_inc_gst.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment Terms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PAYMENT TERMS</Text>
        <Text style={styles.value}>{payment_terms}</Text>
      </View>

      {/* Sales Rep Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTACT</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Sales Rep:</Text>
          <Text style={styles.value}>{sales_rep_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{sales_rep_phone}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{company_name} | {company_address}</Text>
        <Text>Phone: {company_phone} | Email: {company_email}</Text>
        <Text style={{ marginTop: 10 }}>Terms & Conditions apply. See attached document.</Text>
      </View>
    </Page>
  </Document>
);

export default QuoteTemplateA;
```

### 2.2 Quote PDF Template B (Summary)

**File:** `src/components/pdf/QuoteTemplateB.tsx`

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface QuoteTemplateBProps {
  quote_number: string;
  issue_date: string;
  validity_date: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  site_address: string;
  project_summary: string;
  scope_of_work: string;
  subtotal_ex_gst: number;
  gst_amount: number;
  total_inc_gst: number;
  payment_terms: string;
  sales_rep_name: string;
  sales_rep_phone: string;
  company_logo?: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 50,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerText: {
    fontSize: 11,
    color: '#333',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0066CC',
    paddingBottom: 5,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '35%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    width: '65%',
    fontSize: 11,
    color: '#333',
  },
  summaryBox: {
    backgroundColor: '#F0F8FF',
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#333',
  },
  priceBox: {
    backgroundColor: '#0066CC',
    color: '#FFF',
    padding: 20,
    marginBottom: 20,
  },
  priceRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 12,
  },
  totalPrice: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FFF',
    paddingTopY: 10,
    marginTopY: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCC',
    fontSize: 9,
    color: '#666',
  },
});

export const QuoteTemplateB: React.FC<QuoteTemplateBProps> = ({
  quote_number,
  issue_date,
  validity_date,
  client_name,
  client_email,
  client_phone,
  site_address,
  project_summary,
  scope_of_work,
  subtotal_ex_gst,
  gst_amount,
  total_inc_gst,
  payment_terms,
  sales_rep_name,
  sales_rep_phone,
  company_logo,
  company_name,
  company_phone,
  company_email,
  company_address,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {company_logo && <Image src={company_logo} style={styles.logo} />}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerText}>Quote #{quote_number}</Text>
          <Text style={styles.headerText}>Issued: {issue_date}</Text>
          <Text style={styles.headerText}>Valid Until: {validity_date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Project Quote</Text>

      {/* Client Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{client_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Property Address:</Text>
          <Text style={styles.value}>{site_address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{client_phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{client_email}</Text>
        </View>
      </View>

      {/* Project Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.sectionTitle}>PROJECT SUMMARY</Text>
        <Text style={styles.summaryText}>{project_summary}</Text>
      </View>

      {/* Scope of Work */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SCOPE OF WORK</Text>
        <Text style={{ fontSize: 11, lineHeight: 1.6, color: '#333' }}>{scope_of_work}</Text>
      </View>

      {/* Pricing */}
      <View style={styles.priceBox}>
        <View style={styles.priceRow}>
          <Text>Subtotal (excluding GST):</Text>
          <Text>${subtotal_ex_gst.toFixed(2)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text>GST (15%):</Text>
          <Text>${gst_amount.toFixed(2)}</Text>
        </View>
        <View style={styles.totalPrice}>
          <Text>TOTAL PRICE (inc. GST):</Text>
          <Text>${total_inc_gst.toFixed(2)}</Text>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TERMS & CONDITIONS</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Terms:</Text>
          <Text style={styles.value}>{payment_terms}</Text>
        </View>
        <Text style={{ fontSize: 10, color: '#666', marginTop: 10 }}>
          This quote is valid until {validity_date}. Full terms and conditions are attached.
        </Text>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR CONTACT</Text>
        <Text style={styles.value}>{sales_rep_name}</Text>
        <Text style={styles.value}>{sales_rep_phone}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{company_name} | {company_address}</Text>
        <Text>Phone: {company_phone} | Email: {company_email}</Text>
      </View>
    </Page>
  </Document>
);

export default QuoteTemplateB;
```

### 2.3 Invoice PDF Template

**File:** `src/components/pdf/InvoicePDFTemplate.tsx`

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

interface InvoicePDFProps {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  job_number: string;
  line_items: InvoiceLineItem[];
  subtotal_ex_gst: number;
  gst_amount: number;
  total_inc_gst: number;
  amount_paid?: number;
  balance_due: number;
  payment_instructions: string;
  payment_methods: string;
  company_logo?: string;
  company_name: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  company_bank_account: string;
  is_paid: boolean;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC',
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 40,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0066CC',
    paddingBottom: 5,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '25%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  value: {
    width: '75%',
    fontSize: 10,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#0066CC',
    color: '#FFF',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    padding: 8,
    fontSize: 10,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#0066CC',
  },
  totalRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    width: 150,
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 11,
  },
  paymentBox: {
    backgroundColor: '#F0F8FF',
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCC',
    fontSize: 9,
    color: '#666',
  },
});

export const InvoicePDFTemplate: React.FC<InvoicePDFProps> = ({
  invoice_number,
  invoice_date,
  due_date,
  customer_name,
  customer_email,
  customer_address,
  job_number,
  line_items,
  subtotal_ex_gst,
  gst_amount,
  total_inc_gst,
  amount_paid = 0,
  balance_due,
  payment_instructions,
  payment_methods,
  company_logo,
  company_name,
  company_phone,
  company_email,
  company_address,
  company_bank_account,
  is_paid,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {company_logo && <Image src={company_logo} style={styles.logo} />}
          <Text style={styles.headerText}>{company_name}</Text>
        </View>
        <View style={styles.headerRight}>
          {is_paid && <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0CC000', marginBottom: 5 }}>✓ PAID</Text>}
          <Text style={styles.headerText}>Invoice #{invoice_number}</Text>
          <Text style={styles.headerText}>Date: {invoice_date}</Text>
          <Text style={styles.headerText}>Due: {due_date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>INVOICE</Text>

      {/* Customer & Job Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BILL TO</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{customer_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{customer_address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{customer_email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Job #:</Text>
          <Text style={styles.value}>{job_number}</Text>
        </View>
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Total</Text>
          </View>
          {line_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity} {item.unit}</Text>
              <Text style={styles.col3}>${item.unit_price.toFixed(2)}</Text>
              <Text style={styles.col4}>${item.line_total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal (ex GST):</Text>
          <Text style={styles.totalValue}>${subtotal_ex_gst.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GST (15%):</Text>
          <Text style={styles.totalValue}>${gst_amount.toFixed(2)}</Text>
        </View>
        <View style={{ ...styles.totalRow, borderTopWidth: 1, borderTopColor: '#0066CC', paddingTop: 8, marginTop: 8 }}>
          <Text style={{ ...styles.totalLabel, fontSize: 12, fontWeight: 'bold' }}>TOTAL DUE:</Text>
          <Text style={{ ...styles.totalValue, fontSize: 12, fontWeight: 'bold' }}>${total_inc_gst.toFixed(2)}</Text>
        </View>
        {amount_paid > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid:</Text>
              <Text style={styles.totalValue}>${amount_paid.toFixed(2)}</Text>
            </View>
            <View style={{ ...styles.totalRow, backgroundColor: '#FFE6E6', padding: 8 }}>
              <Text style={{ ...styles.totalLabel, fontWeight: 'bold' }}>BALANCE DUE:</Text>
              <Text style={{ ...styles.totalValue, fontWeight: 'bold' }}>${balance_due.toFixed(2)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Payment Instructions */}
      {!is_paid && (
        <View style={styles.paymentBox}>
          <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
          <Text style={{ fontSize: 10, marginBottom: 10 }}>Please remit payment by {due_date}</Text>
          <Text style={{ fontSize: 10, marginBottom: 8 }}>Accepted Payment Methods: {payment_methods}</Text>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Bank Details:</Text>
          <Text style={{ fontSize: 10 }}>{payment_instructions}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{company_name} | {company_address}</Text>
        <Text>Phone: {company_phone} | Email: {company_email}</Text>
        <Text>Bank: {company_bank_account}</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDFTemplate;
```

### 2.4 Assessment Report PDF Template

**File:** `src/components/pdf/AssessmentReportTemplate.tsx`

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

interface AssessmentArea {
  area_name: string;
  current_insulation: string;
  recommendation: string;
  status: 'PASS' | 'FAIL' | 'EXEMPT';
  photos?: string[];
}

interface AssessmentReportProps {
  assessment_number: string;
  assessment_date: string;
  client_name: string;
  client_address: string;
  property_type: string;
  year_built: number;
  estimated_size_sqm: number;
  site_access: string;
  installer_name: string;
  assessment_areas: AssessmentArea[];
  overall_compliance: 'PASS' | 'FAIL';
  recommendations: string;
  nz_building_code: string;
  warranty: string;
  next_steps: string;
  inspector_signature?: string;
  customer_signature?: string;
  signature_date?: string;
  company_logo?: string;
  company_name: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC',
    paddingBottom: 20,
  },
  logo: {
    width: 80,
    height: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0066CC',
    paddingBottom: 5,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  value: {
    width: '70%',
    fontSize: 10,
  },
  areaBox: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  areaTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusPass: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  statusFail: {
    backgroundColor: '#F8D7DA',
    color: '#721C24',
  },
  statusExempt: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  areaText: {
    fontSize: 9,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  complianceBox: {
    backgroundColor: '#E8F4F8',
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
    borderRadius: 4,
  },
  photo: {
    width: 150,
    height: 100,
    marginBottom: 10,
  },
  signatureSection: {
    marginTop: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCC',
    fontSize: 8,
    color: '#666',
  },
});

export const AssessmentReportTemplate: React.FC<AssessmentReportProps> = ({
  assessment_number,
  assessment_date,
  client_name,
  client_address,
  property_type,
  year_built,
  estimated_size_sqm,
  site_access,
  installer_name,
  assessment_areas,
  overall_compliance,
  recommendations,
  nz_building_code,
  warranty,
  next_steps,
  inspector_signature,
  customer_signature,
  signature_date,
  company_logo,
  company_name,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {company_logo && <Image src={company_logo} style={styles.logo} />}
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 10, color: '#666' }}>Assessment #{assessment_number}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Date: {assessment_date}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>PROPERTY ASSESSMENT REPORT</Text>

      {/* Property Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROPERTY INFORMATION</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Client:</Text>
          <Text style={styles.value}>{client_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{client_address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Property Type:</Text>
          <Text style={styles.value}>{property_type}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Year Built:</Text>
          <Text style={styles.value}>{year_built}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Est. Size:</Text>
          <Text style={styles.value}>{estimated_size_sqm} m²</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Site Access:</Text>
          <Text style={styles.value}>{site_access}</Text>
        </View>
      </View>

      {/* Assessment Areas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ASSESSMENT FINDINGS</Text>
        {assessment_areas.map((area, index) => (
          <View key={index} style={styles.areaBox}>
            <Text style={styles.areaTitle}>{area.area_name}</Text>
            <View style={{
              ...styles.statusBadge,
              ...(area.status === 'PASS' ? styles.statusPass : area.status === 'FAIL' ? styles.statusFail : styles.statusExempt),
            }}>
              <Text>{area.status}</Text>
            </View>
            <Text style={styles.areaText}>
              <Text style={{ fontWeight: 'bold' }}>Current:</Text> {area.current_insulation}
            </Text>
            <Text style={styles.areaText}>
              <Text style={{ fontWeight: 'bold' }}>Recommendation:</Text> {area.recommendation}
            </Text>
            {area.photos && area.photos.map((photo, i) => (
              <Image key={i} src={photo} style={styles.photo} />
            ))}
          </View>
        ))}
      </View>

      {/* Overall Compliance */}
      <View style={styles.complianceBox}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
          OVERALL COMPLIANCE: {overall_compliance === 'PASS' ? '✓ PASS' : '✗ FAIL'}
        </Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{recommendations}</Text>
      </View>

      {/* Additional Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
        <View style={styles.row}>
          <Text style={styles.label}>NZ Building Code:</Text>
          <Text style={styles.value}>{nz_building_code}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Warranty:</Text>
          <Text style={styles.value}>{warranty}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Next Steps:</Text>
          <Text style={styles.value}>{next_steps}</Text>
        </View>
      </View>

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          {inspector_signature && <Image src={inspector_signature} style={{ width: 100, height: 50, marginBottom: 10 }} />}
          <Text style={{ fontSize: 9 }}>Inspector: {installer_name}</Text>
          <Text style={{ fontSize: 9 }}>Date: {signature_date}</Text>
        </View>
        <View style={styles.signatureBox}>
          {customer_signature && <Image src={customer_signature} style={{ width: 100, height: 50, marginBottom: 10 }} />}
          <Text style={{ fontSize: 9 }}>Customer Approval</Text>
          <Text style={{ fontSize: 9 }}>Date: {signature_date}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{company_name} | Assessment performed by: {installer_name}</Text>
        <Text style={{ marginTop: 5 }}>This report is valid for assessment purposes only. See attached Terms & Conditions.</Text>
      </View>
    </Page>
  </Document>
);

export default AssessmentReportTemplate;
```

## PART 3: HELPER FUNCTIONS

### 3.1 Template Helper Service

**File:** `src/lib/templates.ts`

```typescript
import { supabase } from './supabase';

export interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_body: string;
  variables: string[];
  is_active: boolean;
}

/**
 * Fetch email template by key
 */
export async function getEmailTemplate(templateKey: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, template_key, subject, html_body, variables, is_active')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching template ${templateKey}:`, error);
    return null;
  }

  return data;
}

/**
 * Replace variables in template string
 * Example: replaceTemplateVariables('Hi {{name}}', { name: 'John' }) => 'Hi John'
 */
export function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  });

  return result;
}

/**
 * Generate email subject and body with variables
 */
export async function generateEmailContent(
  templateKey: string,
  variables: Record<string, any>
): Promise<{ subject: string; html: string } | null> {
  const template = await getEmailTemplate(templateKey);

  if (!template) {
    console.error(`Template not found: ${templateKey}`);
    return null;
  }

  return {
    subject: replaceTemplateVariables(template.subject, variables),
    html: replaceTemplateVariables(template.html_body, variables),
  };
}

/**
 * Fetch Terms & Conditions (active version)
 */
export async function getTermsAndConditions(): Promise<string | null> {
  const { data, error } = await supabase
    .from('quote_terms')
    .select('content')
    .eq('is_active', true)
    .gte('effective_date', new Date().toISOString().split('T')[0])
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching T&Cs:', error);
    return null;
  }

  return data?.content || null;
}

/**
 * Get all active T&C versions
 */
export async function getAllTermsVersions() {
  const { data, error } = await supabase
    .from('quote_terms')
    .select('id, version, title, is_active, effective_date')
    .order('version', { ascending: false });

  if (error) {
    console.error('Error fetching T&C versions:', error);
    return [];
  }

  return data || [];
}

/**
 * Update T&C to active version
 */
export async function activateTermsVersion(versionId: string) {
  // First, deactivate all versions
  await supabase
    .from('quote_terms')
    .update({ is_active: false })
    .eq('is_active', true);

  // Then activate the selected version
  const { data, error } = await supabase
    .from('quote_terms')
    .update({ is_active: true })
    .eq('id', versionId)
    .select();

  if (error) {
    console.error('Error activating T&C version:', error);
    return null;
  }

  return data;
}

/**
 * Create new T&C version
 */
export async function createTermsVersion(content: string, title: string, createdByUserId: string) {
  // Get latest version number
  const { data: versionData } = await supabase
    .from('quote_terms')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = (versionData?.version || 0) + 1;

  const { data, error } = await supabase
    .from('quote_terms')
    .insert([
      {
        version: newVersion,
        title,
        content,
        effective_date: new Date().toISOString().split('T')[0],
        created_by: createdByUserId,
        is_active: false,
      },
    ])
    .select();

  if (error) {
    console.error('Error creating T&C version:', error);
    return null;
  }

  return data;
}
```

## PART 4: USAGE EXAMPLES

### 4.1 Send Email with Template

```typescript
import { generateEmailContent } from '@/lib/templates';
import { sendEmail } from '@/lib/email-service'; // External service

async function sendQuoteEmail(
  customerEmail: string,
  quoteData: {
    customer_name: string;
    quote_number: string;
    quote_total: number;
    validity_date: string;
    quote_pdf_link: string;
    payment_terms: string;
    sales_rep_name: string;
    sales_rep_phone: string;
  }
) {
  // Generate email content from template
  const emailContent = await generateEmailContent('quote_sent', quoteData);

  if (!emailContent) {
    console.error('Failed to generate email');
    return;
  }

  // Send email
  await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}
```

### 4.2 Generate Quote PDF

```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';
import QuoteTemplateA from '@/components/pdf/QuoteTemplateA';

// In React component
export function QuoteDownloadButton({ quoteData }) {
  return (
    <PDFDownloadLink
      document={<QuoteTemplateA {...quoteData} />}
      fileName={`quote-${quoteData.quote_number}.pdf`}
    >
      {({ blob, url, loading, error }) =>
        loading ? 'Generating PDF...' : 'Download Quote'
      }
    </PDFDownloadLink>
  );
}
```

### 4.3 Get Terms & Conditions

```typescript
import { getTermsAndConditions } from '@/lib/templates';

async function displayTerms() {
  const terms = await getTermsAndConditions();
  return <div dangerouslySetInnerHTML={{ __html: terms }} />;
}
```

---

# 5. IMPLEMENTATION ROADMAP

## Phase 1A - MVP (3 Days)

**Priority:** Database + Core Components

### Day 1
- [ ] Run database migrations (email_templates, quote_terms)
- [ ] Insert 6 email templates
- [ ] Insert default T&Cs
- [ ] Verify all data in Supabase

### Day 2
- [ ] Create QuoteTemplateA.tsx component
- [ ] Create QuoteTemplateB.tsx component
- [ ] Test both with sample data

### Day 3
- [ ] Create InvoicePDFTemplate.tsx
- [ ] Create AssessmentReportTemplate.tsx
- [ ] Verify all PDFs render correctly

## Phase 1B - Integration & Polish

### Week 2
- [ ] Create template helper functions (templates.ts)
- [ ] Wire email generation to backend email service
- [ ] Wire PDF generation to quote finalization
- [ ] Integrate T&Cs display on quote pages
- [ ] Test end-to-end email + PDF delivery

### Week 3
- [ ] Set up Resend API for email sending
- [ ] Implement email scheduling/automation
- [ ] Add SMS template support
- [ ] Create in-app notification system

## Phase 2 - Advanced Features

### Week 4+
- [ ] Email template editor UI (Settings page)
- [ ] SMS template management
- [ ] T&Cs version management
- [ ] Email signature management
- [ ] Document template headers/footers

---

# 6. TESTING & DEPLOYMENT

## Testing Checklist

### Database Testing
- [ ] All 6 email templates inserted
- [ ] T&Cs version 1 active
- [ ] Template keys unique and correct
- [ ] Variables JSON valid format

### Component Testing
- [ ] QuoteTemplateA renders with sample data
- [ ] QuoteTemplateB renders simplified
- [ ] InvoicePDFTemplate shows "PAID" stamp when is_paid=true
- [ ] AssessmentReportTemplate shows status badges (PASS/FAIL/EXEMPT)
- [ ] All PDFs export to file correctly

### Function Testing
- [ ] getEmailTemplate() returns correct template
- [ ] replaceTemplateVariables() replaces all {{variables}}
- [ ] generateEmailContent() returns subject + html
- [ ] getTermsAndConditions() returns active version
- [ ] createTermsVersion() increments version number

### Integration Testing
- [ ] Quote creation triggers PDF generation
- [ ] Email sending uses correct template
- [ ] T&Cs display on quote detail page
- [ ] Invoice shows correct totals and status
- [ ] Assessment report includes all photos

### User Testing
- [ ] Customer receives quote PDF email
- [ ] Customer receives invoice PDF email
- [ ] Customer receives payment reminder email
- [ ] Admin receives task assignment email
- [ ] Installer receives assessment scheduled email

## Deployment Steps

1. Run SQL migrations in Supabase
2. Deploy React components to Next.js
3. Deploy helper functions to src/lib
4. Test on staging environment
5. Verify email delivery (using Resend test API)
6. Deploy to production
7. Monitor email delivery rates
8. Collect user feedback on templates

## Dependencies

- `@react-pdf/renderer` - PDF generation
- Supabase - Database
- Resend (Phase 1B) - Email delivery
- Next.js 14+ - Framework

---

## APPENDIX: QUICK REFERENCE

### SQL Queries

```sql
-- Check template count
SELECT COUNT(*) FROM email_templates WHERE is_active = true;

-- Check T&Cs version
SELECT version, is_active, effective_date FROM quote_terms ORDER BY version DESC;

-- Reset templates (ADMIN ONLY)
DELETE FROM email_templates WHERE template_key LIKE '%';
```

### File Locations Summary

| Item | Location | Type |
|------|----------|------|
| Email Templates | `email_templates` table | Supabase |
| Quote T&Cs | `quote_terms` table | Supabase |
| QuoteA PDF | `src/components/pdf/QuoteTemplateA.tsx` | React Component |
| QuoteB PDF | `src/components/pdf/QuoteTemplateB.tsx` | React Component |
| Invoice PDF | `src/components/pdf/InvoicePDFTemplate.tsx` | React Component |
| Assessment PDF | `src/components/pdf/AssessmentReportTemplate.tsx` | React Component |
| Helpers | `src/lib/templates.ts` | TypeScript |

### Environment Setup

```bash
# Install dependencies
npm install @react-pdf/renderer

# Database setup
# Run all SQL from Part 1 in Supabase SQL Editor

# Component setup
# Create all files from Part 2

# Testing
npm run dev
# Visit http://localhost:3000 to test
```

---

**End of Comprehensive Phase 1 Documentation**

For questions or updates, refer to the original requirement documents and update this guide accordingly.

Version Control: This document should be versioned and updated as templates evolve.
Last Updated: January 2026
