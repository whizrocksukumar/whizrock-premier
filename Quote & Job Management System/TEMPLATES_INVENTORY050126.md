# PREMIER INSULATION - TEMPLATES INVENTORY

## All Templates Required & Their Locations

```
TEMPLATES STRUCTURE
════════════════════════════════════════════════════════════════

DATABASE TEMPLATES (Supabase)
├── Email Templates
├── SMS Templates
├── Notification Templates
└── Document Templates (T&Cs)

FILE-BASED TEMPLATES (Next.js/Component Files)
├── PDF Templates
│   ├── Quote Templates (A, B)
│   ├── Invoice Template
│   ├── Assessment Report Template
│   └── Completion Certificate Template
├── Email HTML Templates (for rendering)
└── Document Signatures
```

---

## 1. EMAIL TEMPLATES

### Storage: `email_templates` Table (Supabase)

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL,  -- task_assigned, quote_sent, etc.
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  plain_text_body TEXT,
  variables JSONB,  -- List of variables used: {client_name, quote_number, etc}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Email Templates Needed:

| # | Template Name | Template Key | Used When | Variables |
|---|---------------|--------------|-----------|-----------|
| 1 | Task Assigned | `task_assigned` | Sales rep assigned follow-up task | sales_rep_name, customer_name, due_date, opportunity_id |
| 2 | Task Escalated | `task_escalated` | Task overdue, escalated to admin | admin_name, sales_rep_name, customer_name, task_description |
| 3 | Assessment Scheduled | `assessment_scheduled` | Assessment booked for installer | installer_name, customer_name, assessment_date, assessment_time, site_address |
| 4 | Assessment Reminder | `assessment_reminder` | Day before assessment | installer_name, customer_name, assessment_date, site_address |
| 5 | Assessment Complete | `assessment_complete` | Assessment finished, sent to VA | va_name, customer_name, assessment_date, areas_assessed |
| 6 | Quote Sent to Customer | `quote_sent` | Quote finalized and sent | customer_name, quote_number, quote_total, validity_date, payment_link |
| 7 | Quote Expiry Reminder | `quote_expiry_reminder` | 10 days before quote expires | customer_name, quote_number, expiry_date, sales_rep_name |
| 8 | Quote Expired | `quote_expired` | Quote expired | customer_name, quote_number, sales_rep_name, sales_rep_phone |
| 9 | Quote Accepted | `quote_accepted` | Customer accepts quote, system notification | sales_rep_name, customer_name, quote_number, job_start_date |
| 10 | Quote Rejected | `quote_rejected` | Customer rejects quote | sales_rep_name, customer_name, quote_number |
| 11 | Job Scheduled | `job_scheduled` | Job created and scheduled | installer_names, customer_name, job_date, job_time, site_address |
| 12 | Job Reminder | `job_reminder` | Day before job | installer_names, customer_name, job_date, site_address, materials_list |
| 13 | Job Completed | `job_completed` | Job marked complete | customer_name, job_number, completion_date, follow_up_date |
| 14 | Invoice Sent | `invoice_sent` | Invoice generated and sent | customer_name, invoice_number, invoice_total, due_date, payment_instructions |
| 15 | Payment Reminder 1 | `payment_reminder_1` | 21 days after invoice | customer_name, invoice_number, due_date, overdue_amount |
| 16 | Payment Reminder 2 | `payment_reminder_2` | Invoice due date | customer_name, invoice_number, due_date, payment_link |
| 17 | Payment Overdue Alert | `payment_overdue` | 5+ days past due | admin_name, customer_name, invoice_number, overdue_amount, overdue_days |
| 18 | Payment Received | `payment_received` | Payment confirmed | customer_name, invoice_number, payment_date, receipt_reference |
| 19 | VA Recommendation Received | `va_recommendation_received` | VA submits recommendation | sales_rep_name, customer_name, recommendation_number |
| 20 | Admin Notification (Low Stock) | `low_stock_alert` | Stock below reorder level | admin_name, product_name, current_stock, reorder_level |

### Email Template Examples:

**Template: quote_sent**
```
Subject: Your Premier Insulation Quote - {{quote_number}}

Hello {{customer_name}},

Thank you for choosing Premier Insulation. Your customized quote is ready!

Quote Number: {{quote_number}}
Total Amount (Inc. GST): ${{quote_total}}
Valid Until: {{validity_date}}

[View Quote PDF]({{quote_pdf_link}})
[Accept Quote]({{acceptance_link}})
[View Online]({{online_view_link}})

Payment Terms: {{payment_terms}}
Your assigned rep: {{sales_rep_name}} ({{sales_rep_phone}})

Questions? Reply to this email or call {{sales_rep_phone}}

Best regards,
Premier Insulation Team
```

---

## 2. SMS TEMPLATES

### Storage: `sms_templates` Table (Supabase)

```sql
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL,
  message_body TEXT NOT NULL,  -- Max 160 chars for single SMS
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### SMS Templates Needed:

| # | Template Name | Template Key | Used When |
|---|---------------|--------------|-----------|
| 1 | Assessment Scheduled | `sms_assessment_scheduled` | Confirm assessment booking to customer |
| 2 | Assessment Reminder | `sms_assessment_reminder` | Reminder day before assessment |
| 3 | Job Scheduled | `sms_job_scheduled` | Confirm job booking to customer |
| 4 | Job Reminder | `sms_job_reminder` | Reminder day before job |
| 5 | Quote Sent | `sms_quote_sent` | Quick notification quote is ready |
| 6 | Payment Reminder | `sms_payment_reminder` | Invoice due soon |

### SMS Template Example:

**Template: sms_assessment_scheduled**
```
Hi {{customer_first_name}}, your free assessment is scheduled for {{date}} at {{time}}. 
Our installer will call ahead. Reply CONFIRM or call {{phone}} for details. - Premier
```

---

## 3. NOTIFICATION TEMPLATES

### Storage: `notification_templates` Table (Supabase)

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,  -- Icon name (e.g., 'bell', 'check', 'alert')
  notification_type TEXT,  -- 'info', 'success', 'warning', 'error'
  action_url TEXT,  -- Where to link when clicked
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### In-App Notifications (User Dashboard):

| # | Notification Type | When Triggered | Icon | Colour |
|---|-------------------|----------------|------|--------|
| 1 | Task Assignment | Task created for user | 📋 | Blue |
| 2 | Quote Ready | Quote finalized | ✅ | Green |
| 3 | Assessment Complete | Assessment marked done | ✅ | Green |
| 4 | Low Stock | Stock below reorder | ⚠️ | Orange |
| 5 | Task Overdue | Task due date passed | 🔴 | Red |
| 6 | Payment Overdue | Invoice past due | 🔴 | Red |
| 7 | Recommendation Submitted | VA submits recommendation | 📬 | Blue |
| 8 | Job Assigned | Installer assigned to job | 👷 | Blue |

---

## 4. PDF TEMPLATES

### Storage: File-Based (React Components + Styling)

Location: `src/components/pdf/` or `src/lib/pdf/`

#### 4.1 Quote PDF Templates

**Files:**
- `QuoteTemplateA.tsx` - Detailed line-item pricing
- `QuoteTemplateB.tsx` - Summary bulk pricing
- `QuotePDFGenerator.ts` - Conversion logic (html-to-pdf library)

**Variables Needed:**
```javascript
{
  quote_number: "Q-2025-001.01",
  issue_date: "2025-12-15",
  validity_date: "2025-01-15",
  client_name: "John Smith",
  client_email: "john@email.com",
  client_phone: "021-555-0001",
  site_address: "123 Main Street, Auckland",
  
  line_items: [
    {
      description: "Glasswool R2.4",
      quantity: 5,
      unit: "pack",
      unit_price: 119.20,
      line_total: 596.00
    }
  ],
  
  subtotal_ex_gst: 746.00,
  gst_amount: 111.90,
  total_inc_gst: 857.90,
  
  payment_terms: "Net 30",
  sales_rep_name: "David Garcia",
  sales_rep_phone: "021-555-0201",
  company_logo: "[base64_image]",
  company_name: "Premier Insulation",
  company_phone: "0800-PREMIER",
  company_email: "info@premier.co.nz"
}
```

#### 4.2 Invoice PDF Template

**File:** `InvoicePDFTemplate.tsx`

**Variables Needed:**
```javascript
{
  invoice_number: "INV-2025-001",
  invoice_date: "2025-12-20",
  due_date: "2025-01-20",
  
  customer: {
    name: "John Smith",
    email: "john@email.com",
    address: "123 Main Street, Auckland"
  },
  
  job_number: "JOB-2025-001",
  
  line_items: [
    {
      description: "Glasswool R2.4 installation",
      quantity: 5,
      unit: "pack",
      unit_price: 119.20,
      line_total: 596.00
    }
  ],
  
  subtotal_ex_gst: 1000.00,
  gst_amount: 150.00,
  total_inc_gst: 1150.00,
  
  amount_paid: 0.00,
  balance_due: 1150.00,
  
  payment_instructions: "Bank details: ACC 12-3456-7890123-00",
  payment_methods_accepted: "Bank transfer, Credit card",
  
  company_details: {...},
  is_paid: false,
  paid_date: null
}
```

#### 4.3 Assessment Report PDF Template

**File:** `AssessmentReportTemplate.tsx`

**Variables Needed:**
```javascript
{
  assessment_number: "ASS-20251220-001",
  assessment_date: "2025-12-15",
  
  client: {
    name: "John Smith",
    address: "123 Main Street, Auckland"
  },
  
  installer_name: "James Thompson",
  
  property_details: {
    property_type: "Residential",
    year_built: 1995,
    estimated_size_sqm: 250,
    site_access: "Easy"
  },
  
  assessment_areas: [
    {
      area_name: "Ceiling",
      current_insulation: "R2.0",
      recommendation: "Upgrade to R3.6",
      photos: ["[base64_image]", "[base64_image]"]
    }
  ],
  
  findings: {
    pass: ["Good ventilation"],
    fail: ["Insufficient ceiling insulation"],
    exempt: ["Wall cavity - restricted access"]
  },
  
  overall_compliance: "FAIL",
  recommendations: "Upgrade ceiling insulation to achieve required R-value",
  estimated_cost: "Covered in quote",
  
  inspector_signature: "[signature_image]",
  customer_signature: "[signature_image]",
  signature_date: "2025-12-15"
}
```

#### 4.4 Completion Certificate PDF Template

**File:** `CompletionCertificateTemplate.tsx`

**Variables Needed:**
```javascript
{
  certificate_number: "CERT-2025-001",
  job_number: "JOB-2025-001",
  completion_date: "2025-12-20",
  
  customer: {
    name: "John Smith",
    address: "123 Main Street, Auckland"
  },
  
  work_completed: "Installation of R3.6 polyester insulation - 130 sqm",
  
  contractor_details: {
    name: "Premier Insulation",
    license_number: "[if applicable]",
    contact: "0800-PREMIER"
  },
  
  installers: ["James Thompson", "Mike Chen"],
  
  materials_used: [
    {
      product: "Glasswool R3.6",
      quantity: 15,
      unit: "packs"
    }
  ],
  
  final_photos: ["[base64_image]", "[base64_image]"],
  
  nz_building_code_compliance: "Yes",
  warranty_period: "10 years",
  warranty_details: "Materials and workmanship guaranteed",
  
  next_steps: "Keep this certificate with your home records",
  
  authorized_by: "David Garcia",
  signature: "[signature_image]",
  sign_date: "2025-12-20"
}
```

---

## 5. DOCUMENT TEMPLATES

### Storage: Database + HTML Editor

#### 5.1 Terms & Conditions

**Table:** `quote_terms` (already exists)

**Fields:**
```sql
CREATE TABLE quote_terms (
  id UUID PRIMARY KEY,
  version INTEGER,
  content TEXT,  -- Rich HTML text
  effective_date DATE,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  created_by UUID
);
```

**Content Examples:**
- Payment terms (Net 30, etc.)
- Cancellation policy
- Warranty information
- Liability limitations
- Dispute resolution
- GST statement

#### 5.2 Quote Header/Footer Templates

**Table:** `document_templates`

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY,
  template_name TEXT,  -- 'quote_header', 'quote_footer', 'invoice_header'
  template_type TEXT,
  html_content TEXT,
  variables JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

**Examples:**
- Quote Header (Logo, date, quote number)
- Quote Footer (Terms, payment info, contact details)
- Invoice Header (Logo, company details)
- Invoice Footer (Bank details, payment instructions)

---

## 6. EMAIL SIGNATURE TEMPLATE

### Storage: Database + Settings Page

**Table:** `email_signatures`

```sql
CREATE TABLE email_signatures (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES team_members(id),
  signature_html TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMP
);
```

**Default Signature Structure:**
```html
<p>Best regards,</p>
<p>
  <strong>{{first_name}} {{last_name}}</strong><br>
  {{job_title}}<br>
  Premier Insulation<br>
  Phone: {{phone}}<br>
  Email: {{email}}<br>
  <img src="{{company_logo}}" height="40">
</p>
```

---

## SUMMARY: TEMPLATE LOCATIONS

| Template Type | Storage Location | Database Table | Editor Location |
|---------------|------------------|-----------------|-----------------|
| **Email** | Supabase | `email_templates` | Settings → Email Settings |
| **SMS** | Supabase | `sms_templates` | Settings → Email Settings |
| **In-App Notifications** | Supabase | `notification_templates` | System (auto-generated) |
| **Quote PDF (A)** | React Component | None | `src/components/pdf/QuoteTemplateA.tsx` |
| **Quote PDF (B)** | React Component | None | `src/components/pdf/QuoteTemplateB.tsx` |
| **Invoice PDF** | React Component | None | `src/components/pdf/InvoicePDFTemplate.tsx` |
| **Assessment Report PDF** | React Component | None | `src/components/pdf/AssessmentReportTemplate.tsx` |
| **Completion Certificate** | React Component | None | `src/components/pdf/CompletionCertificateTemplate.tsx` |
| **Terms & Conditions** | Supabase + HTML Editor | `quote_terms` | Settings → Terms & Conditions |
| **Quote Header/Footer** | Supabase | `document_templates` | Settings → Quote Settings |
| **Email Signature** | Supabase | `email_signatures` | User Profile / Settings |

---

## IMPLEMENTATION PRIORITY

### Phase 1 (MVP)
1. ✅ Email Templates (18 templates)
2. ✅ Quote PDF Templates (A & B)
3. ✅ Invoice PDF Template
4. ✅ Basic Terms & Conditions

### Phase 1B
5. SMS Templates
6. Assessment Report PDF
7. Completion Certificate PDF
8. Email Signature Management

### Phase 2
9. Advanced Email Template Builder
10. Dynamic signature management
11. Multi-language support
