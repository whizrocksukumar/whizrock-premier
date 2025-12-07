# Quote PDF System - Architecture Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                       │
│  ┌──────────────┐         ┌──────────────┐        ┌──────────────┐ │
│  │ Quote Detail │────────▶│ Send Quote   │───────▶│ Quote Send   │ │
│  │ Page         │         │ Button       │        │ Modal        │ │
│  └──────────────┘         └──────────────┘        └──────┬───────┘ │
│                                                           │          │
└───────────────────────────────────────────────────────────┼──────────┘
                                                            │
                        ┌───────────────────────────────────┼───────────────┐
                        │                                   │               │
                        ▼                                   ▼               ▼
              ┌─────────────────┐              ┌─────────────────┐  ┌─────────────┐
              │   EMAIL TAB     │              │   PRINT TAB     │  │ DOWNLOAD TAB│
              └────────┬────────┘              └────────┬────────┘  └──────┬──────┘
                       │                                │                   │
                       │                                │                   │
                       │         ┌──────────────────────┴───────────────────┤
                       │         │                                          │
                       │         │  PDF FORMAT SELECTION                    │
                       │         │  ┌────────────────┐  ┌────────────────┐ │
                       │         │  │ Standard Quote │  │ Detailed Quote │ │
                       │         │  │ (No Pricing)   │  │ (With Pricing) │ │
                       │         │  └────────────────┘  └────────────────┘ │
                       │         │                                          │
                       └─────────┴──────────────────────┬───────────────────┘
                                                        │
                                                        ▼
                                            ┌──────────────────────┐
                                            │  PDF GENERATOR       │
                                            │  (@react-pdf)        │
                                            │                      │
                                            │  • Template Engine   │
                                            │  • Style System      │
                                            │  • Data Formatting   │
                                            └──────────┬───────────┘
                                                       │
                                   ┌───────────────────┼───────────────────┐
                                   │                   │                   │
                                   ▼                   ▼                   ▼
                          ┌────────────────┐  ┌────────────────┐ ┌────────────────┐
                          │  EMAIL API     │  │  PRINT WINDOW  │ │  DOWNLOAD      │
                          │  (Resend)      │  │  Browser       │ │  Local File    │
                          │                │  │                │ │                │
                          │  • HTML Email  │  │  • Print Dialog│ │  • Blob → File │
                          │  • PDF Attach  │  │  • PDF Preview │ │  • Save Dialog │
                          └────────────────┘  └────────────────┘ └────────────────┘
```

## Component Hierarchy

```
QuoteDetailPage (Server Component)
    │
    ├─ Header
    │   └─ Back Button
    │
    ├─ Toolbar
    │   ├─ Status Badge
    │   └─ QuoteSendButton (Client Component) ◄── INTEGRATION POINT
    │       └─ QuoteSendModal (Client Component)
    │           ├─ Tab Navigation
    │           │   ├─ Email Tab
    │           │   ├─ Print Tab
    │           │   └─ Download Tab
    │           │
    │           ├─ PDF Format Selector
    │           │   ├─ Standard Quote (Default)
    │           │   └─ Detailed Quote
    │           │
    │           └─ Action Button
    │
    ├─ Quote Info Cards
    │   ├─ Quote Details
    │   ├─ Customer Info
    │   └─ Financial Summary
    │
    └─ Line Items Section
        └─ Sections with Items
```

## Data Flow

```
1. USER ACTION
   └─ Clicks "Send Quote" Button
       │
       ▼
2. MODAL OPENS
   └─ QuoteSendModal receives quote data
       │
       ├─ Quote metadata (number, dates, status)
       ├─ Customer info (name, email, phone)
       ├─ Site details (address, city, postcode)
       ├─ Line items grouped by sections
       └─ Financial totals
       │
       ▼
3. USER SELECTS OPTIONS
   ├─ PDF Format: Standard OR Detailed
   └─ Method: Email OR Print OR Download
       │
       ▼
4. PDF GENERATION
   └─ generateQuotePDF(quoteData, showPricing)
       │
       ├─ Load template components
       ├─ Apply styling (colors, fonts, layout)
       ├─ Format data (dates, currency, etc.)
       ├─ Conditionally render pricing
       ├─ Add terms & conditions
       └─ Generate PDF Blob
       │
       ▼
5. DISTRIBUTION
   │
   ├─ IF EMAIL:
   │   └─ sendQuoteByEmail()
   │       ├─ Prepare FormData with PDF
   │       ├─ POST to /api/send-quote-email
   │       ├─ Backend: Resend API call
   │       └─ Email sent with PDF attachment
   │
   ├─ IF PRINT:
   │   └─ printPDF()
   │       ├─ Create blob URL
   │       ├─ Open in new window
   │       └─ Trigger print dialog
   │
   └─ IF DOWNLOAD:
       └─ downloadPDF()
           ├─ Create blob URL
           ├─ Create download link
           └─ Save to local computer
```

## PDF Structure

```
┌─────────────────────────────────────────────────┐
│ HEADER                                          │
│ ┌─────────┐          Company Info (Right)      │
│ │  LOGO   │          Premier Insulation         │
│ │         │          West Auckland • Rodney     │
│ └─────────┘          Contact Details            │
├─────────────────────────────────────────────────┤
│                                                  │
│ QUOTATION                                        │
│ Quote #QUO-2025-0001                            │
│                                                  │
├──────────────────────┬──────────────────────────┤
│ Quote Information    │ Client Details           │
│ • Date              │ • Name                    │
│ • Valid Until       │ • Company                 │
│ • Job Type          │ • Email / Phone           │
└──────────────────────┴──────────────────────────┘
│                                                  │
│ SITE ADDRESS                                     │
│ 123 Example Street, Auckland 1010               │
│                                                  │
├─────────────────────────────────────────────────┤
│ SCOPE OF WORK                                    │
│                                                  │
│ ┌─ Section 1: Ceiling Insulation ─────────────┐│
│ │ Marker │ Description    │ Area │ Qty │ ...  ││
│ │ ────── │ ────────────── │ ──── │ ─── │ ...  ││
│ │ C1     │ R3.6 Glasswool │ 120  │ 15  │ ...  ││
│ │ C2     │ Vapour Barrier │ 120  │ 15  │ ...  ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ┌─ Section 2: Wall Insulation ────────────────┐│
│ │ W1     │ R2.8 Polyester │ 80   │ 10  │ ...  ││
│ │ W2     │ Installation   │ 80   │ 10  │ ...  ││
│ └─────────────────────────────────────────────┘│
│                                                  │
├─────────────────────────────────────────────────┤
│                              FINANCIAL SUMMARY   │
│                              ─────────────────   │
│                              Subtotal: $2,200.00│
│                              GST (15%):  $330.00│
│                              ═══════════════════ │
│                              TOTAL:    $2,530.00│
│                                                  │
├─────────────────────────────────────────────────┤
│ ADDITIONAL NOTES                                 │
│ Customer-specific notes appear here...          │
│                                                  │
├─────────────────────────────────────────────────┤
│ TERMS & CONDITIONS                               │
│ 1. ACCEPTANCE: This quote is valid...          │
│ 2. PAYMENT TERMS: Payment is due...            │
│ ... (10 clauses total)                          │
│                                                  │
├─────────────────────────────────────────────────┤
│ FOOTER                                           │
│ Thank you for considering Premier Insulation    │
│ Contact: 0800 PREMIER | quotes@premier...      │
└─────────────────────────────────────────────────┘
```

## File Organization

```
project-root/
│
├── src/
│   ├── lib/
│   │   └── pdf/
│   │       ├── quote-pdf-generator.tsx  ◄── PDF Template
│   │       │   ├── QuotePDF Component
│   │       │   ├── Style Definitions
│   │       │   ├── Terms & Conditions
│   │       │   └── Formatting Functions
│   │       │
│   │       └── quote-pdf-utils.ts       ◄── Utility Functions
│   │           ├── generateQuotePDF()
│   │           ├── downloadPDF()
│   │           ├── printPDF()
│   │           └── sendQuoteByEmail()
│   │
│   ├── components/
│   │   ├── QuoteSendModal.tsx           ◄── Main Modal UI
│   │   │   ├── Tab System
│   │   │   ├── Format Selector
│   │   │   └── Action Handlers
│   │   │
│   │   └── QuoteSendButton.tsx          ◄── Integration Component
│   │       └── Button + Modal Wrapper
│   │
│   └── app/
│       ├── api/
│       │   └── send-quote-email/
│       │       └── route.ts             ◄── Email API
│       │           ├── Resend Integration
│       │           ├── Email HTML Template
│       │           └── PDF Attachment Handler
│       │
│       └── quotes/
│           └── [id]/
│               └── page.tsx             ◄── Quote Detail Page
│                   └── Integrated Button
│
├── public/
│   └── premier-insulation-logo-orange   ◄── Logo Asset
│
├── .env.local                           ◄── Configuration
│   └── RESEND_API_KEY
│
└── Documentation/
    ├── PDF_SYSTEM_README.md            ◄── Setup Guide
    ├── QUOTE_PDF_SYSTEM_SUMMARY.md     ◄── Feature Overview
    └── QUICK_START_PDF_SYSTEM.md       ◄── Quick Setup
```

## State Management

```
QuoteSendModal State:
│
├── activeTab: 'email' | 'print' | 'download'
│   └── Controls which tab content is shown
│
├── pdfType: 'no-pricing' | 'with-pricing'
│   └── Determines PDF format
│
├── sending: boolean
│   └── Loading state during generation/sending
│
├── emailTo: string
│   └── Recipient email address
│
└── emailSubject: string
    └── Email subject line

Quote Data Structure:
│
├── Quote Metadata
│   ├── quote_number
│   ├── quote_date
│   ├── valid_until
│   └── status
│
├── Customer Info
│   ├── customer_name
│   ├── customer_email
│   ├── customer_phone
│   └── customer_company
│
├── Site Details
│   ├── site_address
│   ├── city
│   └── postcode
│
├── Financial Data
│   ├── subtotal
│   ├── gst_amount
│   └── total_amount
│
└── Line Items
    └── sections[]
        ├── custom_name
        ├── section_color
        └── items[]
            ├── marker
            ├── description
            ├── area_sqm
            ├── packs_required
            ├── sell_price
            └── line_sell
```

## API Flow

```
Client Side                    Server Side (API Route)              External Service
───────────                    ────────────────────────             ─────────────────

QuoteSendModal
     │
     │ User clicks "Send Email"
     │
     ├─ Generate PDF Blob
     │  (client-side)
     │
     ├─ Prepare FormData
     │  ├─ to: email
     │  ├─ subject: text
     │  ├─ customerName: text
     │  ├─ quoteNumber: text
     │  └─ pdf: blob
     │
     ├─ POST Request
     │  │
     │  └──────────────────────▶ /api/send-quote-email
     │                                    │
     │                                    ├─ Parse FormData
     │                                    │
     │                                    ├─ Convert blob to buffer
     │                                    │
     │                                    ├─ Build HTML email
     │                                    │
     │                                    ├─ resend.emails.send()
     │                                    │  ├─ from: premier email
     │                                    │  ├─ to: customer email
     │                                    │  ├─ subject: custom
     │                                    │  ├─ html: template
     │                                    │  └─ attachments: [pdf]
     │                                    │          │
     │                                    │          └──────────────▶ Resend API
     │                                    │                                │
     │                                    │                                ├─ Process email
     │                                    │                                │
     │                                    │                                ├─ Send via SMTP
     │                                    │                                │
     │                                    │          ◀──────────────  Email sent
     │                                    │                          (messageId)
     │                                    │
     │          ◀──────────────────────  Return success/error
     │                                   { success: true, messageId }
     │
     └─ Show success message
        or error alert
```

## Security Considerations

```
┌────────────────────────────────────────────────────────┐
│ SECURITY LAYERS                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. Environment Variables                               │
│     • RESEND_API_KEY stored in .env.local              │
│     • Never committed to version control                │
│     • Only accessible server-side                       │
│                                                         │
│  2. API Route Protection                                │
│     • Server-side only execution                        │
│     • No direct client access to API keys               │
│     • Validation of input data                          │
│                                                         │
│  3. Email Validation                                    │
│     • Format validation on client                       │
│     • Server-side validation before sending             │
│     • Rate limiting (future enhancement)                │
│                                                         │
│  4. PDF Generation                                      │
│     • Client-side generation (no server load)           │
│     • Sanitized data inputs                             │
│     • No user-executable code in PDFs                   │
│                                                         │
│  5. Data Privacy                                        │
│     • Quote data never logged in plaintext              │
│     • Email attachments transmitted securely            │
│     • TLS encryption for API calls                      │
│                                                         │
└────────────────────────────────────────────────────────┘
```
