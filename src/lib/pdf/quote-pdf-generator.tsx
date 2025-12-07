import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 'bold' },
  ],
});

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  logo: {
    width: 150,
    height: 50,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 9,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5,
  },
  quoteNumber: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 9,
    color: '#333',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  tableCellBold: {
    fontSize: 9,
    color: '#333',
    fontWeight: 'bold',
  },
  // Column widths for table with pricing
  col1: { width: '10%' },
  col2: { width: '35%' },
  col3: { width: '12%' },
  col4: { width: '10%' },
  col5: { width: '15%' },
  col6: { width: '18%' },
  // Column widths for table without pricing
  colNP1: { width: '15%' },
  colNP2: { width: '55%' },
  colNP3: { width: '15%' },
  colNP4: { width: '15%' },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#0066CC',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#0066CC',
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  termsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  termsList: {
    fontSize: 8,
    color: '#666',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
});

interface QuoteData {
  quote_number: string;
  quote_date: string;
  valid_until: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company?: string;
  site_address: string;
  city: string;
  postcode: string;
  job_type: string;
  notes?: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  margin_percentage?: number;
  sections: Array<{
    custom_name: string;
    section_color: string;
    items: Array<{
      marker?: string;
      description: string;
      area_sqm: number;
      packs_required?: number;
      sell_price: number;
      line_sell: number;
      margin_percent?: number;
    }>;
  }>;
}

interface QuotePDFProps {
  quote: QuoteData;
  showPricing?: boolean; // true = show line item pricing, false = only total at end
}

const TERMS_AND_CONDITIONS = `
1. ACCEPTANCE: This quote is valid for 30 days from the date of issue. Acceptance of this quote constitutes agreement to these terms and conditions.

2. PAYMENT TERMS: Payment is due within 7 days of invoice date unless otherwise agreed in writing. We accept bank transfer, credit card, or approved account terms.

3. VARIATIONS: Any variations to the scope of work must be agreed in writing and may result in additional charges.

4. SITE ACCESS: The client must ensure clear and safe access to all work areas. Additional charges may apply for difficult access or delays caused by site conditions.

5. MATERIALS: All materials supplied are to manufacturer's specifications. We reserve the right to substitute equivalent materials if originals become unavailable.

6. WORKMANSHIP: All work is completed to industry standards and building code requirements. Any defects in workmanship will be rectified at no additional cost if notified within 12 months.

7. WARRANTIES: Product warranties are as per manufacturer's terms. Installation workmanship is warranted for 12 months from completion date.

8. CANCELLATION: Cancellations must be made in writing. Cancellation fees may apply for materials ordered or work commenced.

9. LIABILITY: Our liability is limited to the value of work performed. We are not liable for consequential losses or damages.

10. HEALTH & SAFETY: All work will be carried out in accordance with Health and Safety regulations. The client must inform us of any site-specific hazards.
`;

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, showPricing = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image
              src="/premier-insulation-logo-orange"
              style={styles.logo}
            />
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontWeight: 'bold', fontSize: 11, color: '#333' }}>
              PREMIER INSULATION
            </Text>
            <Text>West Auckland • Rodney</Text>
            <Text>Phone: 0800 PREMIER</Text>
            <Text>Email: quotes@premierinsulation.co.nz</Text>
            <Text>www.premierinsulation.co.nz</Text>
          </View>
        </View>

        {/* Title */}
        <View>
          <Text style={styles.title}>QUOTATION</Text>
          <Text style={styles.quoteNumber}>Quote #{quote.quote_number}</Text>
        </View>

        {/* Quote & Customer Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Quote Information
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{formatDate(quote.quote_date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valid Until:</Text>
              <Text style={styles.infoValue}>{formatDate(quote.valid_until)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job Type:</Text>
              <Text style={styles.infoValue}>{quote.job_type}</Text>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              Client Details
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{quote.customer_name}</Text>
            </View>
            {quote.customer_company && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company:</Text>
                <Text style={styles.infoValue}>{quote.customer_company}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{quote.customer_email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{quote.customer_phone}</Text>
            </View>
          </View>
        </View>

        {/* Site Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Address</Text>
          <Text style={styles.infoValue}>
            {quote.site_address}, {quote.city} {quote.postcode}
          </Text>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope of Work</Text>

          {showPricing ? (
            // Table WITH Pricing
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.col1]}>Marker</Text>
                <Text style={[styles.tableHeaderText, styles.col2]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.col3, { textAlign: 'right' }]}>
                  Area (m²)
                </Text>
                <Text style={[styles.tableHeaderText, styles.col4, { textAlign: 'right' }]}>
                  Qty
                </Text>
                <Text style={[styles.tableHeaderText, styles.col5, { textAlign: 'right' }]}>
                  Unit Price
                </Text>
                <Text style={[styles.tableHeaderText, styles.col6, { textAlign: 'right' }]}>
                  Line Total
                </Text>
              </View>

              {quote.sections.map((section, sectionIdx) => (
                <View key={sectionIdx}>
                  {/* Section Header */}
                  <View
                    style={[
                      styles.sectionHeaderRow,
                      { backgroundColor: section.section_color || '#F3F4F6' },
                    ]}
                  >
                    <Text style={styles.sectionHeaderText}>{section.custom_name}</Text>
                  </View>

                  {/* Section Items */}
                  {section.items.map((item, itemIdx) => (
                    <View key={itemIdx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.col1]}>{item.marker || ''}</Text>
                      <Text style={[styles.tableCell, styles.col2]}>{item.description}</Text>
                      <Text style={[styles.tableCell, styles.col3, { textAlign: 'right' }]}>
                        {item.area_sqm ? item.area_sqm.toFixed(2) : '—'}
                      </Text>
                      <Text style={[styles.tableCell, styles.col4, { textAlign: 'right' }]}>
                        {item.packs_required || '—'}
                      </Text>
                      <Text style={[styles.tableCell, styles.col5, { textAlign: 'right' }]}>
                        {formatCurrency(item.sell_price)}
                      </Text>
                      <Text style={[styles.tableCellBold, styles.col6, { textAlign: 'right' }]}>
                        {formatCurrency(item.line_sell)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            // Table WITHOUT Pricing (only description and specs)
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colNP1]}>Marker</Text>
                <Text style={[styles.tableHeaderText, styles.colNP2]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.colNP3, { textAlign: 'right' }]}>
                  Area (m²)
                </Text>
                <Text style={[styles.tableHeaderText, styles.colNP4, { textAlign: 'right' }]}>
                  Qty
                </Text>
              </View>

              {quote.sections.map((section, sectionIdx) => (
                <View key={sectionIdx}>
                  {/* Section Header */}
                  <View
                    style={[
                      styles.sectionHeaderRow,
                      { backgroundColor: section.section_color || '#F3F4F6' },
                    ]}
                  >
                    <Text style={styles.sectionHeaderText}>{section.custom_name}</Text>
                  </View>

                  {/* Section Items */}
                  {section.items.map((item, itemIdx) => (
                    <View key={itemIdx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.colNP1]}>{item.marker || ''}</Text>
                      <Text style={[styles.tableCell, styles.colNP2]}>{item.description}</Text>
                      <Text style={[styles.tableCell, styles.colNP3, { textAlign: 'right' }]}>
                        {item.area_sqm ? item.area_sqm.toFixed(2) : '—'}
                      </Text>
                      <Text style={[styles.tableCell, styles.colNP4, { textAlign: 'right' }]}>
                        {item.packs_required || '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal (ex GST):</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (15%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.gst_amount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL (inc GST):</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quote.total_amount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsList}>{TERMS_AND_CONDITIONS}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for considering Premier Insulation. We look forward to working with you.
          </Text>
          <Text style={{ marginTop: 4 }}>
            Premier Insulation | West Auckland • Rodney | 0800 PREMIER |
            quotes@premierinsulation.co.nz
          </Text>
        </View>
      </Page>
    </Document>
  );
};
