# Quote PDF Generation & Email System

## Overview

This system provides comprehensive PDF generation and distribution for quotes with the following features:

1. **Two PDF Formats:**
   - **Standard Quote (Recommended):** Shows line items without individual pricing, total displayed at end
   - **Detailed Quote:** Full breakdown with unit prices and line totals for each item

2. **Distribution Methods:**
   - **Email:** Send directly to client with professional email template
   - **Print:** Open in browser and print
   - **Download:** Save PDF to local computer

3. **Professional Design:**
   - Clean, minimalistic layout
   - Premier Insulation branding
   - Company logo and contact information
   - Terms & conditions automatically appended

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@react-pdf/renderer` - For PDF generation
- `resend` - For email sending

### 2. Configure Email Service (Resend)

1. Sign up for a free account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Create a `.env.local` file in the project root:

```env
RESEND_API_KEY=re_your_api_key_here
```

4. Verify your sending domain (or use Resend's test domain for development)

### 3. Logo Setup

The system uses the logo from `/public/premier-insulation-logo-orange`

Ensure your logo file exists at this path. Supported formats:
- PNG
- JPG
- WEBP
- SVG

### 4. Test the System

1. Navigate to any quote detail page
2. Click the "Download PDF" or "Edit" button
3. In the new quote page, use "Create & Send" button
4. Select PDF format and distribution method

## Usage

### In Quote Detail Page

Add the QuoteSendModal component:

```tsx
import QuoteSendModal from '@/components/QuoteSendModal';

// In your component
const [showSendModal, setShowSendModal] = useState(false);

// Button to trigger
<button onClick={() => setShowSendModal(true)}>
  Send Quote
</button>

// Modal
<QuoteSendModal
  isOpen={showSendModal}
  onClose={() => setShowSendModal(false)}
  quote={quoteData}
  onSuccess={() => {
    // Handle success (e.g., update quote status)
  }}
/>
```

### Programmatic PDF Generation

```tsx
import { generateQuotePDF, downloadPDF } from '@/lib/pdf/quote-pdf-utils';

// Generate PDF with no pricing (recommended)
const blob = await generateQuotePDF(quoteData, false);

// Generate PDF with pricing
const blobWithPricing = await generateQuotePDF(quoteData, true);

// Download
downloadPDF(blob, 'Quote-001.pdf');
```

## File Structure

```
src/
├── lib/
│   └── pdf/
│       ├── quote-pdf-generator.tsx    # PDF template component
│       └── quote-pdf-utils.ts          # Utility functions
├── components/
│   └── QuoteSendModal.tsx             # Main modal interface
└── app/
    └── api/
        └── send-quote-email/
            └── route.ts                # Email API endpoint
```

## Terms & Conditions

Terms are automatically included in every PDF. To modify them, edit the `TERMS_AND_CONDITIONS` constant in `quote-pdf-generator.tsx`.

## Customization

### Colors & Branding

Edit the styles in `quote-pdf-generator.tsx`:

```tsx
const styles = StyleSheet.create({
  header: {
    borderBottomColor: '#FF6B35', // Orange accent
  },
  title: {
    color: '#0066CC', // Primary blue
  },
  // ... more styles
});
```

### Email Template

Modify the email HTML in `src/app/api/send-quote-email/route.ts`.

### PDF Layout

Adjust the PDF structure in `quote-pdf-generator.tsx` - the component is fully customizable.

## Troubleshooting

### PDFs not generating
- Check that `@react-pdf/renderer` is installed
- Ensure logo path is correct
- Check browser console for errors

### Emails not sending
- Verify `RESEND_API_KEY` is set in `.env.local`
- Check API endpoint is accessible
- Confirm domain is verified in Resend dashboard

### Logo not displaying
- Check file exists at `/public/premier-insulation-logo-orange`
- Try using full URL instead of relative path
- Verify image format is supported

## Production Considerations

1. **Email Limits:** Free Resend account has sending limits. Upgrade for production use.
2. **Logo Hosting:** For best reliability, use absolute URLs for logos in production.
3. **Error Handling:** Add proper error tracking (e.g., Sentry) for PDF generation failures.
4. **Rate Limiting:** Implement rate limiting on email endpoint to prevent abuse.

## Support

For issues or questions:
- Check the console for error messages
- Review the PDF generation logs
- Verify all dependencies are installed correctly
