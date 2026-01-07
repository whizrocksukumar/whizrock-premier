# Workflow Automation Documentation

## Overview

This document describes the complete workflow automation system for Whizrock Premier, from opportunity creation to certificate issuance. The system uses email notifications, automatic data transformations, and task management to streamline operations.

## Complete Workflow

```
1. Opportunity Created (Starting Point)
   ↓
2. Free Assessment Scheduled → Assigned to Installer
   ↓
3. Assessment Completed
   ├── Trigger: POST /api/assessments/[id]/complete
   ├── Action: Email VA with assessment report + building plans
   └── Database: assessments.va_notified_at updated
   ↓
4. VA Creates Product Recommendation (Draft)
   ↓
5. VA Submits for Approval
   ├── Trigger: POST /api/product-recommendations/[id]/submit-for-approval
   ├── Action: Email Premier user (sales rep or admin)
   └── Database: approval_status = 'Pending'
   ↓
6. Premier Reviews and Approves/Rejects
   ├── Trigger: POST /api/product-recommendations/[id]/approve
   ├── Action: Email VA if approved
   └── Database: approval_status = 'Approved' or 'Rejected'
   ↓
7. VA Finalizes Recommendation
   ├── Trigger: POST /api/va-submit-recommendation
   ├── Action: Auto-create draft quote (pricing = 0)
   ├── Helper: createQuoteFromRecommendation()
   └── Database: quotes table + quote_sections + quote_line_items
   ↓
8. Sales Rep Adds Pricing to Quote
   └── Manual step in quote UI
   ↓
9. Sales Rep Sends Quote to Customer
   ├── Trigger: POST /api/send-quote-email
   ├── Action: Email customer with quote details
   └── Database: quotes.sent_at updated
   ↓
10. Customer Accepts (Manual from Premier)
    ├── Trigger: POST /api/quotes/[id]/accept
    ├── Action: Auto-create job, update opportunity to WON
    ├── Helper: createJobFromQuote()
    └── Database: jobs table + job_line_items, quote.status = 'Won'
    ↓
11. Job Scheduled → Reserve Stock + Notify Installer
    └── Manual step in job UI (stock allocation)
    ↓
12. Installer Completes Installation → Submit Report
    └── Manual step in job UI
    ↓
13. Job Marked Complete → Create Certificate
    ├── Trigger: POST /api/jobs/[id]/complete
    ├── Action: Auto-create certificate, email to customer
    └── Database: certificates table, job.status = 'Completed'
```

---

## API Endpoints

### 1. Complete Assessment and Notify VA

**Endpoint:** `POST /api/assessments/[id]/complete`

**Purpose:** Marks assessment as complete and sends email to VA to create product recommendation.

**Request Body:** None required (uses assessment ID from URL)

**Response:**
```json
{
  "ok": true,
  "message": "Assessment marked complete and VA notified",
  "messageId": "resend-message-id"
}
```

**Database Changes:**
- Updates `assessments` table:
  - `assessment_status` = 'Completed'
  - `completed_date` = current timestamp
  - `va_notified_at` = current timestamp
  - `va_notification_email` = VA email
- Creates task in `tasks` table for VA

**Email Sent:**
- Template: `assessment-completed-va`
- To: Active VA user
- Subject: "New Assessment Completed - [reference_number]"
- Includes: Assessment details, customer info, CTA to create recommendation

---

### 2. Submit Recommendation for Approval

**Endpoint:** `POST /api/product-recommendations/[id]/submit-for-approval`

**Purpose:** VA submits recommendation for Premier user approval.

**Request Body:** None required

**Response:**
```json
{
  "ok": true,
  "message": "Recommendation submitted for approval",
  "messageId": "resend-message-id",
  "approver": "premier@example.com"
}
```

**Database Changes:**
- Updates `product_recommendations` table:
  - `approval_status` = 'Pending'
  - `submitted_for_approval_at` = current timestamp
- Creates task in `tasks` table for Premier user

**Email Sent:**
- Template: `recommendation-needs-approval`
- To: Sales rep (or admin if no sales rep)
- Subject: "Recommendation Ready for Approval - [customer_name]"
- Includes: VA name, customer info, review checklist

---

### 3. Approve or Reject Recommendation

**Endpoint:** `POST /api/product-recommendations/[id]/approve`

**Purpose:** Premier user approves or rejects VA's recommendation.

**Request Body:**
```json
{
  "action": "approve",  // or "reject"
  "approvedBy": "user@example.com",
  "rejectionReason": "Optional reason if rejecting"
}
```

**Response (Approval):**
```json
{
  "ok": true,
  "message": "Recommendation approved and VA notified",
  "messageId": "resend-message-id"
}
```

**Database Changes:**
- Updates `product_recommendations` table:
  - `approval_status` = 'Approved' or 'Rejected'
  - `approved_by` = approver email
  - `approved_at` = current timestamp
  - `rejection_reason` = reason if rejected
- Creates task in `tasks` table for VA (if approved)

**Email Sent (if approved):**
- Template: `recommendation-approved`
- To: VA user who created recommendation
- Subject: "Recommendation Approved - [customer_name]"
- Includes: Approver name, CTA to finalize

---

### 4. Finalize Recommendation and Create Quote

**Endpoint:** `POST /api/va-submit-recommendation`

**Purpose:** VA finalizes approved recommendation, auto-creates draft quote.

**Request Body:**
```json
{
  "recommendationId": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Recommendation submitted and quote created successfully",
  "quote": { /* quote object */ },
  "quoteNumber": "Q-2025-0001"
}
```

**Database Changes:**
- Updates `product_recommendations` table:
  - `recommendation_status` = 'Finalized'
  - `finalized_at` = current timestamp
- Creates records in:
  - `quotes` table (with `recommendation_id` FK)
  - `quote_sections` table
  - `quote_line_items` table (with pricing = 0)
- Creates task for sales rep to add pricing

**Helper Function Used:** `createQuoteFromRecommendation()`

---

### 5. Send Quote to Customer

**Endpoint:** `POST /api/send-quote-email`

**Purpose:** Sends quote email to customer after sales rep adds pricing.

**Request Body:**
```json
{
  "quoteId": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Quote sent successfully",
  "messageId": "resend-message-id",
  "sentTo": "customer@example.com"
}
```

**Database Changes:**
- Updates `quotes` table:
  - `sent_at` = current timestamp
  - `sent_to_email` = customer email

**Email Sent:**
- Template: `quote-to-customer`
- To: Customer email (from client/company)
- Subject: "Your Insulation Quote [quote_number]"
- Includes: Quote amount, benefits, sales rep contact info

---

### 6. Accept Quote and Create Job

**Endpoint:** `POST /api/quotes/[id]/accept`

**Purpose:** Customer accepts quote (manually triggered by Premier), auto-creates job.

**Request Body:** None required

**Response:**
```json
{
  "ok": true,
  "message": "Quote accepted and job created successfully",
  "job": { /* job object */ },
  "jobNumber": "J-2025-0001"
}
```

**Database Changes:**
- Updates `quotes` table:
  - `status` = 'Accepted' → then 'Won'
  - `accepted_date` = current timestamp
  - `job_id` = new job ID
- Creates records in:
  - `jobs` table
  - `job_line_items` table
- Updates `opportunities` table:
  - `stage` = 'WON'
  - `job_id` = new job ID
- Creates task to assign installer crew

**Helper Function Used:** `createJobFromQuote()`

---

### 7. Complete Job and Issue Certificate

**Endpoint:** `POST /api/jobs/[id]/complete`

**Purpose:** Marks job as complete, creates certificate, emails customer.

**Request Body:**
```json
{
  "completionDate": "2025-01-07T00:00:00Z",  // Optional, defaults to now
  "completionNotes": "Installation completed successfully"  // Optional
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Job completed, certificate created and sent",
  "certificate": { /* certificate object */ },
  "certificateNumber": "CERT-2025-0001",
  "messageId": "resend-message-id"
}
```

**Database Changes:**
- Updates `jobs` table:
  - `status` = 'Completed'
  - `completed_at` = completion date
  - `completion_notes` = notes
- Creates record in `certificates` table:
  - `certificate_number` = auto-generated
  - `certificate_status` = 'Issued'
  - `issued_date` = current timestamp
  - `warranty_expiry_date` = completion date + warranty months
  - `sent_at` = current timestamp
  - `sent_to_email` = customer email

**Email Sent:**
- Template: `certificate-to-customer`
- To: Customer email
- Subject: "Your Job Completion Certificate [certificate_number]"
- Includes: Completion date, warranty info, care instructions

---

## Helper Functions

### `createQuoteFromRecommendation(recommendationId: string)`

**Location:** `src/lib/utils/create-quote-from-recommendation.ts`

**Purpose:** Converts approved recommendation into draft quote with all line items copied.

**Process:**
1. Fetches recommendation with sections and items
2. Generates sequential quote number (Q-2025-XXXX)
3. Creates quote header with `recommendation_id` foreign key
4. Copies `recommendation_sections` → `quote_sections`
5. Copies `recommendation_items` → `quote_line_items` (pricing = 0)
6. Creates task for sales rep to add pricing

**Returns:**
```typescript
{
  success: boolean;
  quote?: object;
  quoteNumber?: string;
  error?: string;
}
```

---

### `createJobFromQuote(quoteId: string)`

**Location:** `src/lib/utils/create-job-from-quote.ts`

**Purpose:** Converts accepted quote into job with all line items copied.

**Process:**
1. Validates quote is in 'Accepted' status
2. Generates sequential job number (J-2025-XXXX)
3. Creates job header with quote/assessment/opportunity FKs
4. Copies `quote_line_items` → `job_line_items` (excluding labour)
5. Updates quote status to 'Won' and links `job_id`
6. Updates opportunity stage to 'WON' and links `job_id`
7. Creates task to assign installer crew

**Returns:**
```typescript
{
  success: boolean;
  job?: object;
  jobNumber?: string;
  error?: string;
}
```

---

## Email Service

### Configuration

**Location:** `src/lib/email-service.ts`

**Environment Variable:** `Resend_API_KEY` (in `.env.local`)

**From Address:** `Whizrock Premier <noreply@whizrockpremier.co.nz>`

### Email Functions

All email functions use the same pattern:

```typescript
export async function sendExampleEmail(params: {
  recipientEmail: string;
  // ... other params
}) {
  const html = replaceTemplateVars(template.html, {
    variable_name: params.value,
    // ...
  });

  return sendEmail({
    to: params.recipientEmail,
    subject: "Email Subject",
    html,
  });
}
```

### Available Email Functions

1. **sendAssessmentCompletedToVA()** - Notifies VA about completed assessment
2. **sendRecommendationApprovalRequest()** - Asks Premier to approve recommendation
3. **sendRecommendationApprovedToVA()** - Notifies VA of approval
4. **sendQuoteToCustomer()** - Sends quote to customer with pricing
5. **sendCertificateToCustomer()** - Sends completion certificate
6. **sendInstallerNotification()** - Notifies installer of job assignment

### Template Variables

Templates use `{{variable_name}}` syntax. The `replaceTemplateVars()` function replaces all placeholders with actual values.

Example:
```typescript
const html = replaceTemplateVars(template, {
  customer_name: "John Smith",
  quote_amount: "$5,000.00",
  site_address: "123 Main St",
});
```

---

## Email Templates

All templates are located in: `src/lib/email-templates/`

### 1. assessment-completed-va.ts

**Color Theme:** Blue (#0066CC)

**Used By:** Assessment completion workflow

**Variables:**
- `{{va_name}}` - VA's full name
- `{{customer_name}}` - Customer name
- `{{site_address}}` - Job site address
- `{{assessment_reference}}` - Assessment reference number
- `{{assessment_date}}` - Date of assessment
- `{{dashboard_url}}` - Base dashboard URL
- `{{create_recommendation_url}}` - Direct link to create recommendation

**Features:**
- Professional gradient header
- Assessment details in styled info box
- "Create Product Recommendation" CTA button
- Next steps checklist

---

### 2. recommendation-needs-approval.ts

**Color Theme:** Purple (#9333ea)

**Used By:** Recommendation approval workflow

**Variables:**
- `{{premier_name}}` - Premier user's full name
- `{{va_name}}` - VA who created recommendation
- `{{customer_name}}` - Customer name
- `{{site_address}}` - Job site address
- `{{review_url}}` - Direct link to review recommendation

**Features:**
- Purple gradient header
- Review checklist (R-values, pricing, quantities)
- "Review Recommendation" CTA button
- Urgency indicators

---

### 3. recommendation-approved.ts

**Color Theme:** Green (#10b981)

**Used By:** Recommendation approval confirmation workflow

**Variables:**
- `{{va_name}}` - VA's full name
- `{{approver_name}}` - Who approved it
- `{{customer_name}}` - Customer name
- `{{finalize_url}}` - Link to finalize recommendation

**Features:**
- Green success gradient header
- Approval badge
- "Finalize Recommendation" CTA button
- Next steps for VA

---

### 4. quote-to-customer.ts

**Color Theme:** Blue (#0066CC)

**Used By:** Quote sending workflow

**Variables:**
- `{{customer_name}}` - Customer name
- `{{quote_number}}` - Quote reference number
- `{{quote_amount}}` - Formatted NZD amount with GST
- `{{site_address}}` - Job site address
- `{{sales_rep_name}}` - Sales rep full name
- `{{sales_rep_email}}` - Sales rep email
- `{{sales_rep_phone}}` - Sales rep phone
- `{{view_quote_url}}` - Link to view quote

**Features:**
- Professional customer-facing design
- Large prominent quote amount display
- Benefits section with checkmarks
- Sales rep contact information box
- "View Full Quote" CTA button

---

### 5. certificate-to-customer.ts

**Color Theme:** Green (#10b981)

**Used By:** Job completion workflow

**Variables:**
- `{{customer_name}}` - Customer name
- `{{certificate_number}}` - Certificate reference
- `{{job_completion_date}}` - Date job was completed
- `{{site_address}}` - Job site address
- `{{warranty_months}}` - Warranty period (usually 12)
- `{{view_certificate_url}}` - Link to download certificate

**Features:**
- Celebratory design with large checkmark
- "Job Completed!" heading
- Warranty information section
- Care instructions box
- "Download Certificate" CTA button

---

## Database Schema Updates

### Required Fields

These fields were added to support workflow automation:

**assessments table:**
- `va_notified_at` - Timestamp when VA was notified
- `va_notification_email` - Email address VA was notified at
- `completed_date` - When assessment was marked complete

**product_recommendations table:**
- `approval_status` - Enum: 'Draft', 'Pending', 'Approved', 'Rejected'
- `approved_by` - User email who approved
- `approved_at` - Timestamp of approval
- `rejection_reason` - Text reason if rejected
- `submitted_for_approval_at` - When submitted
- `finalized_at` - When VA finalized

**quotes table:**
- `recommendation_id` - FK to product_recommendations table
- `sent_at` - Timestamp when quote emailed
- `sent_to_email` - Customer email address
- `accepted_date` - When customer accepted
- `customer_viewed_at` - When customer opened quote (optional)

**jobs table:**
- `completed_at` - When job marked complete
- `completion_notes` - Text notes from installer

**certificates table:**
- `sent_at` - Timestamp when certificate emailed
- `sent_to_email` - Customer email address

---

## Task Management

The workflow creates tasks automatically to ensure nothing is forgotten:

### Task Creation Points

1. **Assessment Completed** → Task for VA to create recommendation (2 days, High priority)
2. **Recommendation Submitted** → Task for Premier to approve (1 day, High priority)
3. **Recommendation Approved** → Task for VA to finalize (1 day, High priority)
4. **Quote Created** → Task for sales rep to add pricing (varies, High priority)
5. **Job Created** → Task to assign installer crew (1 day, High priority)

### Task Fields

```typescript
{
  task_description: string;
  assigned_to_user_id: string; // User email
  related_entity_type: 'assessment' | 'product_recommendation' | 'quote' | 'job';
  related_entity_id: string; // UUID
  due_date: string; // ISO timestamp
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
}
```

---

## Testing the Workflow

### 1. Test Assessment Completion

```bash
curl -X POST http://localhost:3000/api/assessments/[id]/complete \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Assessment status → 'Completed'
- Email sent to VA
- Task created for VA

---

### 2. Test Recommendation Submission

```bash
curl -X POST http://localhost:3000/api/product-recommendations/[id]/submit-for-approval \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Recommendation approval_status → 'Pending'
- Email sent to Premier user
- Task created for Premier user

---

### 3. Test Recommendation Approval

```bash
curl -X POST http://localhost:3000/api/product-recommendations/[id]/approve \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","approvedBy":"user@example.com"}'
```

**Expected Result:**
- Recommendation approval_status → 'Approved'
- Email sent to VA
- Task created for VA to finalize

---

### 4. Test Quote Auto-Creation

```bash
curl -X POST http://localhost:3000/api/va-submit-recommendation \
  -H "Content-Type: application/json" \
  -d '{"recommendationId":"uuid"}'
```

**Expected Result:**
- Recommendation recommendation_status → 'Finalized'
- New quote created with quote number
- Quote sections and line items copied
- Task created for sales rep

---

### 5. Test Quote Email

```bash
curl -X POST http://localhost:3000/api/send-quote-email \
  -H "Content-Type: application/json" \
  -d '{"quoteId":"uuid"}'
```

**Expected Result:**
- Email sent to customer
- Quote sent_at timestamp updated

---

### 6. Test Job Auto-Creation

```bash
curl -X POST http://localhost:3000/api/quotes/[id]/accept \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Quote status → 'Accepted' → 'Won'
- New job created with job number
- Job line items copied
- Opportunity stage → 'WON'
- Task created to assign installer

---

### 7. Test Certificate Creation

```bash
curl -X POST http://localhost:3000/api/jobs/[id]/complete \
  -H "Content-Type: application/json" \
  -d '{"completionDate":"2025-01-07T00:00:00Z","completionNotes":"All work completed"}'
```

**Expected Result:**
- Job status → 'Completed'
- Certificate created with certificate number
- Email sent to customer with certificate
- Certificate sent_at timestamp updated

---

## Troubleshooting

### Email Not Sending

**Check:**
1. `Resend_API_KEY` is set in `.env.local`
2. API key is valid (test at resend.com)
3. From domain is verified in Resend dashboard
4. Customer email exists in database

**Debug:**
```typescript
console.log('Resend API Key:', process.env.Resend_API_KEY?.substring(0, 10));
```

---

### Quote Not Auto-Created

**Check:**
1. Recommendation approval_status = 'Approved'
2. Recommendation has sections and items
3. Opportunity exists with required fields
4. Foreign key `recommendation_id` is set

**Debug:**
```sql
SELECT r.*, rs.*, ri.*
FROM product_recommendations r
LEFT JOIN recommendation_sections rs ON rs.recommendation_id = r.id
LEFT JOIN recommendation_items ri ON ri.section_id = rs.id
WHERE r.id = 'uuid';
```

---

### Job Not Auto-Created

**Check:**
1. Quote status = 'Accepted'
2. Quote has line items
3. Opportunity exists
4. Assessment linked to opportunity

**Debug:**
```sql
SELECT q.*, qli.*, o.*, a.*
FROM quotes q
LEFT JOIN quote_line_items qli ON qli.quote_id = q.id
LEFT JOIN opportunities o ON o.id = q.opportunity_id
LEFT JOIN assessments a ON a.opportunity_id = o.id
WHERE q.id = 'uuid';
```

---

## Future Enhancements

1. **Customer Portal** - Allow customers to accept quotes online
2. **PDF Generation** - Auto-generate PDF for quotes and certificates
3. **SMS Notifications** - Add SMS for critical updates
4. **Rejection Email** - Email VA when recommendation is rejected
5. **Installer App** - Mobile app for job completion reports
6. **Stock Alerts** - Email when stock levels low for job
7. **Review Requests** - Auto-email customer for review after completion
8. **Analytics Dashboard** - Track conversion rates at each stage

---

## Support

For questions or issues with workflow automation, contact the development team or refer to:
- Email service: `src/lib/email-service.ts`
- Helper functions: `src/lib/utils/`
- API routes: `src/app/api/`
