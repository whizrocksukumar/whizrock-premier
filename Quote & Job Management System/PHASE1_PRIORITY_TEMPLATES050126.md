# PHASE 1 PRIORITY TEMPLATES - COMPLETE IMPLEMENTATION

## Overview: 6 Priority Templates

1. ✅ Email Templates (6 critical ones)
2. ✅ Quote PDF Template A
3. ✅ Quote PDF Template B
4. ✅ Invoice PDF Template
5. ✅ Terms & Conditions
6. ✅ Assessment Report PDF

---

## PART 1: DATABASE SETUP

### 1.1 Create Email Templates Table (SQL)

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
  '<html><body>
    <p>Hi {{sales_rep_name}},</p>
    <p>You have been assigned a follow-up task:</p>
    <p><strong>Customer:</strong> {{customer_name}}</p>
    <p><strong>Phone:</strong> {{customer_phone}}</p>
    <p><strong>Email:</strong> {{customer_email}}</p>
    <p><strong>Due Date:</strong> {{due_date}}</p>
    <p><strong>Task:</strong> Call/email customer to discuss free assessment</p>
    <p><a href="{{task_link}}">View Task in System</a></p>
    <p>Mark complete once you''ve made contact.</p>
    <p>Regards,<br>Premier Insulation System</p>
  </body></html>',
  '["sales_rep_name", "customer_name", "customer_phone", "customer_email", "due_date", "task_link"]'::jsonb,
  true
),
(
  'Assessment Scheduled',
  'assessment_scheduled',
  'Assessment Scheduled - {{customer_name}} - {{assessment_date}}',
  '<html><body>
    <p>Hi {{installer_name}},</p>
    <p>You have a free assessment scheduled:</p>
    <p><strong>Customer:</strong> {{customer_name}}</p>
    <p><strong>Date:</strong> {{assessment_date}}</p>
    <p><strong>Time:</strong> {{assessment_time}}</p>
    <p><strong>Address:</strong> {{site_address}}</p>
    <p><strong>Phone:</strong> {{customer_phone}}</p>
    <p><a href="{{assessment_link}}">View Assessment Details</a></p>
    <p>Please confirm your availability in the app.</p>
    <p>Regards,<br>Premier Insulation</p>
  </body></html>',
  '["installer_name", "customer_name", "assessment_date", "assessment_time", "site_address", "customer_phone", "assessment_link"]'::jsonb,
  true
),
(
  'Quote Sent to Customer',
  'quote_sent',
  'Your Premier Insulation Quote - {{quote_number}}',
  '<html><body>
    <p>Hi {{customer_name}},</p>
    <p>Thank you for choosing Premier Insulation. Your customized quote is ready!</p>
    <p><strong>Quote Number:</strong> {{quote_number}}</p>
    <p><strong>Total Amount (Inc. GST):</strong> ${{quote_total}}</p>
    <p><strong>Valid Until:</strong> {{validity_date}}</p>
    <p><a href="{{quote_pdf_link}}" style="background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Download Quote PDF</a></p>
    <p><strong>Payment Terms:</strong> {{payment_terms}}</p>
    <p><strong>Questions?</strong> Contact {{sales_rep_name}} at {{sales_rep_phone}}</p>
    <p>Regards,<br>Premier Insulation Team</p>
  </body></html>',
  '["customer_name", "quote_number", "quote_total", "validity_date", "quote_pdf_link", "payment_terms", "sales_rep_name", "sales_rep_phone"]'::jsonb,
  true
),
(
  'Invoice Sent',
  'invoice_sent',
  'Invoice Ready - {{invoice_number}} - Premier Insulation',
  '<html><body>
    <p>Hi {{customer_name}},</p>
    <p>Your invoice is ready for payment:</p>
    <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
    <p><strong>Invoice Date:</strong> {{invoice_date}}</p>
    <p><strong>Due Date:</strong> {{due_date}}</p>
    <p><strong>Total Amount (Inc. GST):</strong> ${{invoice_total}}</p>
    <p><a href="{{invoice_pdf_link}}" style="background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Download Invoice PDF</a></p>
    <p><strong>Payment Instructions:</strong></p>
    <p>{{payment_instructions}}</p>
    <p>Thank you for your business!</p>
    <p>Regards,<br>Premier Insulation Team</p>
  </body></html>',
  '["customer_name", "invoice_number", "invoice_date", "due_date", "invoice_total", "invoice_pdf_link", "payment_instructions"]'::jsonb,
  true
),
(
  'Payment Reminder',
  'payment_reminder',
  'Payment Due Soon - {{invoice_number}}',
  '<html><body>
    <p>Hi {{customer_name}},</p>
    <p>This is a friendly reminder that your invoice is due:</p>
    <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
    <p><strong>Due Date:</strong> {{due_date}}</p>
    <p><strong>Amount Due:</strong> ${{amount_due}}</p>
    <p><a href="{{payment_link}}" style="background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a></p>
    <p>{{payment_instructions}}</p>
    <p>If you have already paid, please disregard this email.</p>
    <p>Regards,<br>Premier Insulation</p>
  </body></html>',
  '["customer_name", "invoice_number", "due_date", "amount_due", "payment_link", "payment_instructions"]'::jsonb,
  true
),
(
  'Assessment Complete',
  'assessment_complete',
  'Assessment Complete - {{customer_name}} - Ready for Quote',
  '<html><body>
    <p>Hi {{va_name}},</p>
    <p>Assessment completed and ready for recommendation:</p>
    <p><strong>Customer:</strong> {{customer_name}}</p>
    <p><strong>Assessment Date:</strong> {{assessment_date}}</p>
    <p><strong>Areas Assessed:</strong> {{areas_assessed}}</p>
    <p><a href="{{va_workspace_link}}" style="background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Create Recommendation</a></p>
    <p>Review the assessment report and create your product recommendation.</p>
    <p>Regards,<br>Premier Insulation System</p>
  </body></html>',
  '["va_name", "customer_name", "assessment_date", "areas_assessed", "va_workspace_link"]'::jsonb,
  true
);

-- Verify insertion
SELECT template_key, template_name, is_active FROM email_templates ORDER BY template_name;
```

### 1.2 Create Terms & Conditions Table (SQL)

```sql
-- Create quote_terms table for T&Cs versioning
CREATE TABLE IF NOT EXISTS quote_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'Terms & Conditions',
  content TEXT NOT NULL,  -- Rich HTML text
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
  '<html><body>
    <h1>Terms & Conditions</h1>
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
    
    <p><strong>Acceptance of these terms is required to proceed with installation.</strong></p>
  </body></html>',
  CURRENT_DATE,
  true,
  NOW()
);

-- Verify insertion
SELECT version, is_active, effective_date FROM quote_terms ORDER BY version DESC;
```

---

## PART 2: REACT COMPONENTS FOR PDF TEMPLATES

### 2.1 Quote PDF Template A (Detailed Line-Item)

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

### 2.2 Quote PDF Template B (Summary Pricing)

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
  paidStamp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0CC000',
    borderWidth: 2,
    borderColor: '#0CC000',
    padding: 5,
    transform: 'rotate(-15)',
    position: 'absolute',
    top: 20,
    right: 40,
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
      {/* Paid Stamp */}
      {is_paid && <Text style={styles.paidStamp}>PAID</Text>}

      {/* Header */}
      <View style={styles.header}>
        <View>
          {company_logo && <Image src={company_logo} style={styles.logo} />}
          <Text style={styles.headerText}>{company_name}</Text>
        </View>
        <View style={styles.headerRight}>
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

---

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
```

---

## PART 4: USAGE EXAMPLES

### 4.1 Send Email with Template

```typescript
import { generateEmailContent } from '@/lib/templates';
import { sendEmail } from '@/lib/email-service';

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
<PDFDownloadLink
  document={<QuoteTemplateA {...quoteData} />}
  fileName={`quote-${quote_number}.pdf`}
>
  {({ blob, url, loading, error }) =>
    loading ? 'Generating PDF...' : 'Download Quote'
  }
</PDFDownloadLink>
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

## PART 5: DATABASE VERIFICATION

```sql
-- Verify email templates inserted
SELECT template_key, subject, is_active FROM email_templates ORDER BY template_key;

-- Count templates
SELECT COUNT(*) as total_templates FROM email_templates WHERE is_active = true;

-- Verify T&Cs
SELECT version, is_active, effective_date FROM quote_terms ORDER BY version DESC;

-- Sample template usage
SELECT 
  'Task Assigned' as template,
  COUNT(*) as times_used,
  MAX(created_at) as last_used
FROM activities 
WHERE activity_type = 'email_sent' 
  AND metadata->>'template_key' = 'task_assigned'
GROUP BY 1;
```

---

## IMPLEMENTATION CHECKLIST

### Database Setup ✅
- [ ] Run SQL migrations for `email_templates` table
- [ ] Run SQL migrations for `quote_terms` table
- [ ] Insert 6 email templates
- [ ] Insert default T&Cs (Version 1)
- [ ] Verify all data inserted correctly

### React Components ✅
- [ ] Create `QuoteTemplateA.tsx`
- [ ] Create `QuoteTemplateB.tsx`
- [ ] Create `InvoicePDFTemplate.tsx`
- [ ] Create `AssessmentReportTemplate.tsx`
- [ ] Test all PDF components with sample data
- [ ] Ensure images/logos render correctly

### Helper Functions ✅
- [ ] Create `src/lib/templates.ts`
- [ ] Implement `getEmailTemplate()`
- [ ] Implement `replaceTemplateVariables()`
- [ ] Implement `generateEmailContent()`
- [ ] Implement `getTermsAndConditions()`
- [ ] Test all functions

### Integration ✅
- [ ] Wire email templates to task creation
- [ ] Wire quote PDF to quote finalization
- [ ] Wire invoice PDF to job completion
- [ ] Wire assessment PDF to assessment completion
- [ ] Display T&Cs on quote pages

### Testing ✅
- [ ] Generate sample emails with variables replaced
- [ ] Generate sample PDFs visually
- [ ] Test template variable replacement
- [ ] Test T&C versioning
- [ ] Test PDF with missing data (should handle gracefully)

---

## NOTES

- All email templates use `{{variable}}` syntax for variable replacement
- PDF components use `@react-pdf/renderer` library
- Database templates are versioned - new versions don't automatically replace old ones
- All times/dates should use ISO format (YYYY-MM-DD)
- GST is hard-coded to 15% for NZ - make configurable in Phase 1B
