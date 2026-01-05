# PREMIER INSULATION - COMPLETE WORKFLOW DIAGRAM

## End-to-End Process: Opportunity to Payment

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

---

## Workflow Automations Required

### Task Management Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Follow-up Task Creation** | Opportunity created | Create task due in 2 days | Sales rep |
| **Follow-up Escalation** | Task due date + 1 day, not completed | Escalate to Admin | Admin |
| **Recommendation Timeout** | Recommendation in Draft >3 days | Notify admin to follow up | Admin |

### Calendar & Notification Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Assessment Schedule Notification** | Assessment scheduled | Notify installer (email + app) | Installer |
| **Assessment Reminder** | Assessment date - 1 day | Reminder to installer | Installer |
| **Job Schedule Notification** | Job created from quote | Add to installer calendar, notify | Installer |
| **Job Reminder** | Job scheduled date - 1 day | Reminder to crew | Installer Team |

### Quote & Invoice Automations

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

### Inventory Automations

| Automation | Trigger | Action | Recipient |
|-----------|---------|--------|-----------|
| **Stock Reservation** | Job created from quote | Reserve materials from stock | System |
| **Low Stock Alert** | Stock level ≤ reorder level | Alert admin | Admin |
| **Purchase Order Generation** | Low stock alert | Auto-generate PO (if configured) | Admin |
| **Stock Update** | Job completed | Update actual materials used | System |

---

## What's Currently Implemented ✅ vs Missing ❌

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| 1 | Opportunity Created | ✅ Done | Opportunities page exists |
| 2 | Follow-up Task Creation | ❌ Missing | Need: Task table, auto-creation logic, escalation automation |
| 2 | Follow-up Escalation | ❌ Missing | Need: Scheduler, admin notification system |
| 3 | Assessment Scheduled | ✅ Done | Schedule assessment page complete |
| 3 | Installer Calendar Access | ⚠️ Partial | Mobile app notifications work, but calendar view not built |
| 4 | Assessment Completed | ✅ Done | Mobile completion page with photos working |
| 4 | Assessment Report | ⚠️ Partial | Basic report exists, PDF export missing |
| 5-6 | Quote Initiated & VA Receives | ✅ Done | VA Workspace list shows pending enquiries |
| 7 | VA Creates Recommendation | ❌ Missing | Create/edit recommendation pages not built |
| 7 | Recommendation Escalation | ❌ Missing | Need: Timeout monitoring, admin alerts |
| 8 | Convert to Quote | ❌ Missing | `/quotes/from-recommendation/[id]` not implemented |
| 9 | Quote Sent to Customer | ⚠️ Partial | PDF templates exist, email integration missing |
| 9 | Quote Expiry Automation | ❌ Missing | Need: Expiry date tracking, reminder emails |
| 10 | Job Created & Scheduled | ❌ Missing | Jobs module completely missing |
| 10 | Job Notification | ❌ Missing | Need: Calendar sync, email notifications to crew |
| 11 | Inventory Reserved | ❌ Missing | Stock reservation logic not implemented |
| 11 | Low Stock Alerts | ⚠️ Partial | Alerts table exists, automation missing |
| 12 | Job Completed Mobile | ❌ Missing | Mobile job completion page not built |
| 12 | Completion Certificate | ❌ Missing | Auto-generation not implemented |
| 13 | Invoice Generated | ❌ Missing | Invoice creation from jobs not implemented |
| 13 | Invoice Emails & Reminders | ❌ Missing | Email notifications not configured |
| 13 | Overdue Tracking | ❌ Missing | Need: Payment tracking, overdue alerts |
| 14 | Payment Received | ❌ Missing | Payment reconciliation system not built |

---

## Critical Missing Components Summary

### High Priority (Blocks workflow)
1. **Task Management System** - Follow-up task creation & escalation
2. **VA Recommendation Pages** - Create/edit/submit workflow
3. **Quote Conversion** - Convert recommendation to quote with pricing
4. **Jobs Module** - Create, schedule, assign, track jobs
5. **Mobile Job Completion** - On-site completion with photos
6. **Invoice Generation** - Auto-create from completed jobs
7. **Email Notification System** - All customer/staff communications

### Medium Priority (Workflow continuity)
1. **Installer Calendar View** - Mobile app calendar dashboard
2. **Stock Reservation** - Link job creation to inventory
3. **Payment Tracking** - Record & reconcile payments
4. **Assessment Report PDF** - Export assessment findings
5. **Completion Certificate** - Auto-generate from job completion

### Low Priority (Polish)
1. **Quote Expiry Automation** - Reminder emails before expiry
2. **Overdue Invoice Alerts** - Admin notifications for late payments
3. **Google Calendar Sync** - Optional future integration
4. **Advanced Analytics** - Sales, revenue, performance dashboards
