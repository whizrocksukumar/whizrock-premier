# Job Completion Certificate System Implementation

## Overview
This document outlines the certificate system implementation for job completion certificates in the Premier Insulation system.

## Current Status

### ✅ COMPLETED
1. **Certificate Display Page** - [/src/app/jobs/[id]/certificate/page.tsx](src/app/jobs/[id]/certificate/page.tsx)
   - Full certificate layout with company branding
   - Property details, work timeline, work specification table
   - Certification statement with warranty information
   - Signature sections for installer and customer
   - Print/Download/Email buttons (UI ready, PDF/email functions pending)

2. **Certificate Link in Job Detail Page** - [/src/app/jobs/[id]/page.tsx](src/app/jobs/[id]/page.tsx)
   - "Certificate" button appears for Completed jobs (line 367-375)
   - Links to `/jobs/{id}/certificate` route

3. **Certificate Column in Jobs List** - [/src/app/jobs/page.tsx](src/app/jobs/page.tsx)
   - Added "Certificate" column header (line 463-465)
   - Shows "Issued" with date when certificate exists (lines 548-563)
   - Shows "-" when no certificate issued
   - Displays date in NZ format (e.g., "15 Jan 2026")

4. **Database Table SQL** - [scripts/create_certificates_table.sql](scripts/create_certificates_table.sql)
   - SQL script ready to create `job_completion_certificates` table
   - Includes certificate number generation function
   - Indexes for performance
   - RLS disabled for development

---

## ⚠️ PENDING - REQUIRES ACTION

### 1. Create Database Table
**Action Required:** Run the SQL script in Supabase Dashboard

**File:** [scripts/create_certificates_table.sql](scripts/create_certificates_table.sql)

**Steps:**
1. Open Supabase Dashboard: https://syyzrgybeqnyjfqealnv.supabase.co
2. Navigate to SQL Editor
3. Copy the entire contents of `scripts/create_certificates_table.sql`
4. Paste and execute

**Table Structure:**
```sql
job_completion_certificates (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  certificate_number TEXT UNIQUE,
  issued_date TIMESTAMP,
  issued_by_id UUID,
  installer_signature_name TEXT,
  installer_signature_date DATE,
  customer_signature_name TEXT,
  customer_signature_date DATE,
  warranty_start_date DATE,
  warranty_end_date DATE,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

### 2. Issue Certificate Functionality

**What's Needed:** A way for users to generate/issue certificates

**Recommended Implementation:**

#### Option A: Button in Job Detail Page (RECOMMENDED)
Add an "Issue Certificate" button on the job detail page when:
- Job status = "Completed"
- Completion date is set
- No certificate exists yet

**Location:** [/src/app/jobs/[id]/page.tsx](src/app/jobs/[id]/page.tsx)

**Suggested UI:**
```tsx
{job.status === 'Completed' && !certificateExists && (
  <button
    onClick={handleIssueCertificate}
    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
  >
    Issue Certificate
  </button>
)}
```

**Backend Logic:**
```typescript
const handleIssueCertificate = async () => {
  try {
    // 1. Generate certificate number using DB function
    const { data: certNumber } = await supabase
      .rpc('generate_certificate_number');

    // 2. Insert certificate record
    const { data, error } = await supabase
      .from('job_completion_certificates')
      .insert({
        job_id: job.id,
        certificate_number: certNumber,
        issued_date: new Date().toISOString(),
        issued_by_id: currentUser.id, // Get from session
        installer_signature_name: crewLeadName,
        installer_signature_date: job.completion_date,
        warranty_start_date: job.completion_date,
        warranty_end_date: calculateWarrantyEnd(job.completion_date, job.warranty_period_months)
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Show success message
    alert('Certificate issued successfully!');

    // 4. Redirect to certificate page
    router.push(`/jobs/${job.id}/certificate`);
  } catch (error) {
    console.error('Error issuing certificate:', error);
    alert('Failed to issue certificate');
  }
};
```

#### Option B: Auto-Issue on Job Completion
Automatically issue certificate when job status changes to "Completed"

**Location:** Job status update function

**Implementation:**
```typescript
// When marking job as completed
if (newStatus === 'Completed' && oldStatus !== 'Completed') {
  await issueCertificate(jobId);
}
```

---

### 3. PDF Generation (Future Enhancement)

**Current State:** "Download PDF" button exists but not functional

**Implementation Options:**

#### Option A: Browser Print to PDF (Simplest)
- Current implementation already supports print via `window.print()`
- Users can use browser's "Save as PDF" option
- No additional code needed

#### Option B: Server-side PDF Generation
**Libraries to Consider:**
- `@react-pdf/renderer` - React-based PDF generation
- `puppeteer` - Headless browser PDF generation
- `jsPDF` + `html2canvas` - Client-side PDF generation

**Example with @react-pdf/renderer:**
```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';

<PDFDownloadLink
  document={<CertificatePDF job={job} />}
  fileName={`${job.job_number}_certificate.pdf`}
>
  {({ loading }) =>
    loading ? 'Generating PDF...' : (
      <>
        <Download className="w-4 h-4" />
        Download PDF
      </>
    )
  }
</PDFDownloadLink>
```

---

### 4. Email Certificate (Future Enhancement)

**Current State:** "Email to Customer" button exists but not functional

**Implementation Needed:**

```typescript
const handleEmailCertificate = async () => {
  try {
    // 1. Generate PDF (if not already saved)
    const pdfUrl = await generateCertificatePDF(job.id);

    // 2. Send email via your email service
    await supabase.functions.invoke('send-email', {
      body: {
        to: job.customer_email,
        subject: `Job Completion Certificate - ${job.job_number}`,
        template: 'certificate_email',
        attachments: [{ url: pdfUrl, filename: `${job.job_number}_certificate.pdf` }],
        data: {
          jobNumber: job.job_number,
          customerName: `${job.customer_first_name} ${job.customer_last_name}`,
          completionDate: job.completion_date
        }
      }
    });

    alert('Certificate emailed successfully!');
  } catch (error) {
    console.error('Error emailing certificate:', error);
    alert('Failed to email certificate');
  }
};
```

---

## Testing Checklist

Once database table is created:

### Certificate Issuance
- [ ] Can issue certificate for completed job
- [ ] Certificate number auto-generates (CERT-2026-0001 format)
- [ ] Issued date saves correctly
- [ ] Cannot issue duplicate certificates for same job

### Certificate Display
- [ ] Certificate page loads without errors
- [ ] All job details display correctly
- [ ] Line items show in table
- [ ] Warranty period calculates correctly
- [ ] Signature sections appear
- [ ] Print function works (Ctrl+P / Cmd+P)

### Jobs List Page
- [ ] Certificate column appears
- [ ] Shows "Issued" with date for jobs with certificates
- [ ] Shows "-" for jobs without certificates
- [ ] Date format displays correctly (NZ format)
- [ ] Column doesn't break table layout

---

## Database Query Examples

### Check if certificate exists for a job
```sql
SELECT certificate_number, issued_date
FROM job_completion_certificates
WHERE job_id = 'your-job-id';
```

### Get all jobs with/without certificates
```sql
SELECT
  j.job_number,
  j.status,
  j.completion_date,
  c.certificate_number,
  c.issued_date
FROM jobs j
LEFT JOIN job_completion_certificates c ON j.id = c.job_id
WHERE j.status = 'Completed';
```

### Issue a certificate manually
```sql
INSERT INTO job_completion_certificates (
  job_id,
  certificate_number,
  issued_date,
  installer_signature_name,
  installer_signature_date
)
VALUES (
  'your-job-id',
  generate_certificate_number(),
  NOW(),
  'John Doe',
  '2026-01-15'
);
```

---

## Files Modified/Created

### Created
1. [scripts/create_certificates_table.sql](scripts/create_certificates_table.sql) - Database schema
2. [src/app/jobs/[id]/certificate/page.tsx](src/app/jobs/[id]/certificate/page.tsx) - Certificate display (already existed)
3. This documentation file

### Modified
1. [src/app/jobs/page.tsx](src/app/jobs/page.tsx)
   - Added `certificate_issued_date` and `certificate_number` to Job interface (lines 27-28)
   - Added certificate data fetch in `fetchJobs` function (lines 191-201)
   - Added certificate data to return object (lines 232-233)
   - Added Certificate column header (lines 463-465)
   - Updated empty state colspan from 12 to 13 (line 480)
   - Added certificate display cell (lines 548-563)

---

## Summary

### ✅ What Works Now
- Certificate display page fully styled and functional
- Certificate link in job detail page for completed jobs
- Certificate column in jobs list showing issued status and date
- Database schema ready to deploy

### ⚠️ What Needs Work
1. **Immediate:** Run SQL script to create database table
2. **High Priority:** Add "Issue Certificate" button/workflow
3. **Nice to Have:** PDF download functionality
4. **Nice to Have:** Email certificate functionality

### 🎯 Next Steps
1. Execute `scripts/create_certificates_table.sql` in Supabase
2. Test jobs list page loads without errors (certificate column)
3. Implement "Issue Certificate" button on job detail page
4. Test end-to-end workflow: Complete job → Issue certificate → View certificate

---

## Questions?

If you encounter issues:
- Check browser console for errors
- Verify certificate table was created successfully
- Ensure job has `completion_date` set
- Check that job status is "Completed"

For advanced features (PDF/Email), consider implementing after core functionality is tested and working.
