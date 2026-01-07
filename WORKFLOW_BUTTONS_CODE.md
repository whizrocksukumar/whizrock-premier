# Workflow Buttons - Complete Implementation Guide

## ⚠️ Important: Button Hover States Fixed

All buttons now use proper hover states that work on colored backgrounds:
- **Blue buttons**: `hover:bg-[#0052a3]` (darker blue, not text color change)
- **Green buttons**: `hover:bg-green-700` (darker green)
- **Red buttons**: `hover:bg-red-700` (darker red)
- **Purple buttons**: `hover:bg-purple-700` (darker purple)

**Never use** `hover:text-[#0066CC]` on colored button backgrounds!

---

## 1. Assessment Detail Page - Mark Complete Button

**File:** `src/app/assessments/[id]/page.tsx`

**Add these imports at the top:**
```tsx
import { CheckCircle } from 'lucide-react'
```

**Add this state with other useState declarations:**
```tsx
const [completing, setCompleting] = useState(false)
```

**Add this function before the return statement:**
```tsx
const handleMarkComplete = async () => {
  if (!confirm('Mark this assessment as complete and notify VA to create product recommendation?')) {
    return
  }

  setCompleting(true)
  try {
    const response = await fetch(`/api/assessments/${assessmentId}/complete`, {
      method: 'POST',
    })

    const result = await response.json()

    if (result.ok) {
      alert(`✓ Assessment marked complete!\n✉ VA has been notified via email to create product recommendation.`)
      fetchAssessmentDetails() // Refresh the page
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to mark assessment complete')
    console.error(error)
  }
  setCompleting(false)
}
```

**Add this button in the action buttons area (find where Edit/Delete buttons are):**
```tsx
{assessment?.assessment_status !== 'Completed' && (
  <button
    onClick={handleMarkComplete}
    disabled={completing}
    className="px-4 py-2 bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <CheckCircle className="w-4 h-4" />
    {completing ? 'Completing...' : 'Mark Complete & Notify VA'}
  </button>
)}
```

---

## 2. Product Recommendation Detail Page

**File:** `src/app/product-recommendations/[id]/page.tsx`

**Add these imports:**
```tsx
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
```

**Add these states:**
```tsx
const [submitting, setSubmitting] = useState(false)
const [processing, setProcessing] = useState(false)
const [finalizing, setFinalizing] = useState(false)
const [currentUserEmail, setCurrentUserEmail] = useState('') // Get from your auth system
```

**Add these three functions:**

### A. Submit for Approval (VA button)
```tsx
const handleSubmitForApproval = async () => {
  if (!confirm('Submit this recommendation to Premier for approval?')) {
    return
  }

  setSubmitting(true)
  try {
    const response = await fetch(`/api/product-recommendations/${recommendationId}/submit-for-approval`, {
      method: 'POST',
    })

    const result = await response.json()

    if (result.ok) {
      alert(`✓ Recommendation submitted!\n✉ Premier user (${result.approver}) has been notified.`)
      fetchRecommendationDetails() // Refresh
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to submit recommendation')
    console.error(error)
  }
  setSubmitting(false)
}
```

### B. Approve/Reject (Premier button)
```tsx
const handleApprove = async () => {
  if (!confirm('Approve this recommendation?')) {
    return
  }

  setProcessing(true)
  try {
    const response = await fetch(`/api/product-recommendations/${recommendationId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        approvedBy: currentUserEmail || 'user@example.com', // TODO: Get from your auth
      }),
    })

    const result = await response.json()

    if (result.ok) {
      alert('✓ Recommendation approved!\n✉ VA has been notified to finalize.')
      fetchRecommendationDetails()
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to approve recommendation')
    console.error(error)
  }
  setProcessing(false)
}

const handleReject = async () => {
  const reason = prompt('Enter rejection reason:')
  if (!reason) return

  setProcessing(true)
  try {
    const response = await fetch(`/api/product-recommendations/${recommendationId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        approvedBy: currentUserEmail || 'user@example.com',
        rejectionReason: reason,
      }),
    })

    const result = await response.json()

    if (result.ok) {
      alert('Recommendation rejected.')
      fetchRecommendationDetails()
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to reject recommendation')
    console.error(error)
  }
  setProcessing(false)
}
```

### C. Finalize & Create Quote (VA button after approval)
```tsx
const handleFinalize = async () => {
  if (!confirm('Finalize this recommendation and automatically create a draft quote?')) {
    return
  }

  setFinalizing(true)
  try {
    const response = await fetch(`/api/va-submit-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId }),
    })

    const result = await response.json()

    if (result.ok) {
      alert(`✓ Quote created successfully!\n\nQuote Number: ${result.quoteNumber}\n\nRedirecting to quote page...`)
      // Redirect to the new quote
      window.location.href = `/quotes/${result.quote.id}`
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to create quote')
    console.error(error)
  }
  setFinalizing(false)
}
```

**Add these buttons in the action area (conditional rendering based on status):**

```tsx
{/* Show "Submit for Approval" when status is Draft */}
{recommendation?.approval_status === 'Draft' && (
  <button
    onClick={handleSubmitForApproval}
    disabled={submitting}
    className="px-4 py-2 bg-purple-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Mail className="w-4 h-4" />
    {submitting ? 'Submitting...' : 'Submit for Approval'}
  </button>
)}

{/* Show "Approve/Reject" when status is Pending (Premier users only) */}
{recommendation?.approval_status === 'Pending' && (
  <div className="flex gap-2">
    <button
      onClick={handleApprove}
      disabled={processing}
      className="px-4 py-2 bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <CheckCircle className="w-4 h-4" />
      {processing ? 'Processing...' : 'Approve'}
    </button>
    <button
      onClick={handleReject}
      disabled={processing}
      className="px-4 py-2 bg-red-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <AlertCircle className="w-4 h-4" />
      {processing ? 'Processing...' : 'Reject'}
    </button>
  </div>
)}

{/* Show "Finalize & Create Quote" when approved but not finalized */}
{recommendation?.approval_status === 'Approved' &&
 recommendation?.recommendation_status !== 'Finalized' && (
  <button
    onClick={handleFinalize}
    disabled={finalizing}
    className="px-4 py-2 bg-blue-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <CheckCircle className="w-4 h-4" />
    {finalizing ? 'Creating Quote...' : 'Finalize & Create Quote'}
  </button>
)}
```

---

## 3. Quote Detail Page

**File:** `src/app/quotes/[id]/page.tsx`

**Add these imports:**
```tsx
import { Mail, CheckCircle } from 'lucide-react'
```

**Add these states:**
```tsx
const [sending, setSending] = useState(false)
const [accepting, setAccepting] = useState(false)
```

**Add these functions:**

### A. Send Quote to Customer
```tsx
const handleSendToCustomer = async () => {
  if (!confirm('Send this quote to the customer via email?')) {
    return
  }

  setSending(true)
  try {
    const response = await fetch(`/api/send-quote-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId }),
    })

    const result = await response.json()

    if (result.ok) {
      alert(`✓ Quote sent successfully!\n✉ Email sent to: ${result.sentTo}`)
      fetchQuoteDetails() // Refresh
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to send quote')
    console.error(error)
  }
  setSending(false)
}
```

### B. Accept Quote & Create Job
```tsx
const handleAcceptQuote = async () => {
  if (!confirm('Customer has accepted this quote. Create a job now?')) {
    return
  }

  setAccepting(true)
  try {
    const response = await fetch(`/api/quotes/${quoteId}/accept`, {
      method: 'POST',
    })

    const result = await response.json()

    if (result.ok) {
      alert(`✓ Job created successfully!\n\nJob Number: ${result.jobNumber}\n\nRedirecting to job page...`)
      // Redirect to the new job
      window.location.href = `/jobs/${result.job.id}`
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to accept quote and create job')
    console.error(error)
  }
  setAccepting(false)
}
```

**Add these buttons:**

```tsx
{/* Show "Send to Customer" when quote has pricing and is in Draft status */}
{quote?.status === 'Draft' && quote?.total_inc_gst > 0 && (
  <button
    onClick={handleSendToCustomer}
    disabled={sending}
    className="px-4 py-2 bg-blue-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Mail className="w-4 h-4" />
    {sending ? 'Sending...' : 'Send to Customer'}
  </button>
)}

{/* Show "Accept Quote" when quote has been sent */}
{quote?.sent_at && (quote?.status === 'Sent' || quote?.status === 'Draft') && quote?.status !== 'Accepted' && quote?.status !== 'Won' && (
  <button
    onClick={handleAcceptQuote}
    disabled={accepting}
    className="px-4 py-2 bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <CheckCircle className="w-4 h-4" />
    {accepting ? 'Creating Job...' : 'Customer Accepted - Create Job'}
  </button>
)}
```

---

## 4. Job Detail Page

**File:** `src/app/jobs/[id]/page.tsx`

**Add import:**
```tsx
import { CheckCircle } from 'lucide-react'
```

**Add state:**
```tsx
const [completing, setCompleting] = useState(false)
```

**Add function:**
```tsx
const handleMarkComplete = async () => {
  if (!confirm('Mark this job as complete and issue certificate to customer?')) {
    return
  }

  const completionNotes = prompt('Enter completion notes (optional):')

  setCompleting(true)
  try {
    const response = await fetch(`/api/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completionDate: new Date().toISOString(),
        completionNotes: completionNotes || '',
      }),
    })

    const result = await response.json()

    if (result.ok) {
      alert(`✓ Job completed successfully!\n\nCertificate Number: ${result.certificateNumber}\n✉ Certificate has been emailed to customer.`)
      fetchJobDetails() // Refresh
    } else {
      alert(`Error: ${result.error}`)
    }
  } catch (error) {
    alert('Failed to complete job')
    console.error(error)
  }
  setCompleting(false)
}
```

**Add button:**
```tsx
{/* Show "Mark Complete" when job is not yet completed */}
{job?.status !== 'Completed' && job?.status !== 'Cancelled' && (
  <button
    onClick={handleMarkComplete}
    disabled={completing}
    className="px-4 py-2 bg-green-600 text-white rounded transition-colors flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <CheckCircle className="w-4 h-4" />
    {completing ? 'Completing...' : 'Mark Complete & Issue Certificate'}
  </button>
)}
```

---

## Button Style Guide

### ✅ Correct Button Styles:

**Blue Primary Button:**
```tsx
className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-[#0052a3]"
```

**Green Success Button:**
```tsx
className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
```

**Red Danger Button:**
```tsx
className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
```

**Purple Action Button:**
```tsx
className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
```

### ❌ Wrong (Hard to Read):

**DON'T DO THIS:**
```tsx
className="bg-blue-600 text-white hover:text-[#0066CC]"  // Blue text on blue background!
```

**DON'T DO THIS:**
```tsx
className="bg-green-600 text-white hover:text-blue-500"  // Changes color on hover
```

### Key Rules:
1. **Colored backgrounds** → Darken the same color on hover
2. **White/transparent backgrounds** → Can change text color on hover
3. **Always include** `disabled:opacity-50 disabled:cursor-not-allowed` for buttons that can be disabled
4. **Always include** `transition-colors` for smooth hover effects
5. **Never change text color** on hover when background is colored

---

## Testing Your Buttons

1. **Visual Test:** Hover over each button - text should stay readable
2. **Functional Test:** Click and verify the API call works
3. **Disabled Test:** Verify button is disabled during API call
4. **Success Test:** Verify alert message appears with proper info
5. **Error Test:** Trigger an error and verify error alert shows

---

## Quick Reference: Where Each Button Goes

| Page | Button | Condition | Action |
|------|--------|-----------|--------|
| **Assessment Detail** | Mark Complete & Notify VA | `status !== 'Completed'` | POST `/api/assessments/[id]/complete` |
| **Recommendation Detail** | Submit for Approval | `approval_status === 'Draft'` | POST `/api/product-recommendations/[id]/submit-for-approval` |
| **Recommendation Detail** | Approve / Reject | `approval_status === 'Pending'` | POST `/api/product-recommendations/[id]/approve` |
| **Recommendation Detail** | Finalize & Create Quote | `approval_status === 'Approved' && status !== 'Finalized'` | POST `/api/va-submit-recommendation` |
| **Quote Detail** | Send to Customer | `status === 'Draft' && total > 0` | POST `/api/send-quote-email` |
| **Quote Detail** | Customer Accepted - Create Job | `sent_at exists && status not Won/Accepted` | POST `/api/quotes/[id]/accept` |
| **Job Detail** | Mark Complete & Issue Certificate | `status !== 'Completed/Cancelled'` | POST `/api/jobs/[id]/complete` |

---

## Icons Used

All from `lucide-react`:
- `CheckCircle` - Completion/approval actions
- `Mail` - Email sending actions
- `AlertCircle` - Rejection/warning actions

Make sure to import them at the top of each file!
