import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { 
  parseSimpleMarkdown, 
  parseTermsAndConditions, 
  COMPANY_DETAILS,
  IMPORTANT_NOTES 
} from '@/lib/utils/pdf-utils';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC',
    paddingBottom: 15,
  },
  logo: {
    width: 100,
    height: 40,
  },
  companyDetails: {
    textAlign: 'right',
    fontSize: 9,
  },
  companyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  
  // Title
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  
  // Customer details card
  customerCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  cardLabel: {
    width: '35%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  cardValue: {
    width: '65%',
    fontSize: 10,
  },
  
  // Greeting and content
  greeting: {
    fontSize: 10,
    marginBottom: 10,
  },
  subject: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#0066CC',
  },
  
  // Product tables
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  
  // Totals
  totalsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#0066CC',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    width: 150,
    textAlign: 'right',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
  },
  grandTotal: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    borderTopWidth: 1,
    borderTopColor: '#0066CC',
    paddingTop: 5,
    marginTop: 5,
  },
  
  // Important Notes
  importantNotesSection: {
    marginTop: 20,
    marginBottom: 15,
  },
  importantNotesTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  
  // How to Pay section
  paymentSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  paymentQuoteNo: {
    fontSize: 10,
    color: '#666',
  },
  paymentDetails: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentLabel: {
    width: '30%',
    fontFamily: 'Helvetica-Bold',
  },
  
  // Page 2+ header
  secondaryHeader: {
    textAlign: 'right',
    fontSize: 10,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
});

interface QuotePDFProps {
  quote: {
    quote_number: string;
    quote_date: string | null;
    validity_days: number;
    subject?: string;
    description_of_work?: string;
    specifications_note?: string;
    include_important_notes?: boolean;
    subtotal_ex_gst: number;
    gst_amount: number;
    total_inc_gst: number;
  };
  customer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  site: {
    address_line_1: string;
    city?: string;
    postcode?: string;
  };
  salesRep?: {
    first_name: string;
    last_name: string;
  };
  sections: Array<{
    section_name: string;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }>;
  }>;
  terms?: {
    body: string;
  };
  logoBase64?: string;
}

export default function QuotePDF({
  quote,
  customer,
  site,
  salesRep,
  sections,
  terms,
  logoBase64,
}: QuotePDFProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const validUntil = new Date(quote.quote_date || new Date());
  validUntil.setDate(validUntil.getDate() + (quote.validity_days || 30));
  
  const siteAddress = `${site.address_line_1}${site.city ? ', ' + site.city : ''}${site.postcode ? ', ' + site.postcode : ''}`;
  const customerName = `${customer.first_name} ${customer.last_name}`;
  const subject = quote.subject || `Quote for ${siteAddress}`;

  return (
    <Document>
      {/* PAGE 1: Quote Details */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{COMPANY_DETAILS.name}</Text>
            <Text>{COMPANY_DETAILS.address}</Text>
            <Text>{COMPANY_DETAILS.email}</Text>
            <Text>{COMPANY_DETAILS.phone}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>CUSTOMER QUOTATION NO. {quote.quote_number}</Text>

        {/* Customer Details Card */}
        <View style={styles.customerCard}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Created Date:</Text>
            <Text style={styles.cardValue}>{formatDate(quote.quote_date)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Site:</Text>
            <Text style={styles.cardValue}>{siteAddress}</Text>
          </View>
          {customer.phone && (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Site Contact:</Text>
              <Text style={styles.cardValue}>{customerName}</Text>
            </View>
          )}
          {customer.phone && (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Site Phone:</Text>
              <Text style={styles.cardValue}>{customer.phone}</Text>
            </View>
          )}
          {salesRep && (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Salesperson:</Text>
              <Text style={styles.cardValue}>{salesRep.first_name} {salesRep.last_name}</Text>
            </View>
          )}
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Valid For:</Text>
            <Text style={styles.cardValue}>{quote.validity_days || 30} days</Text>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Hi {customer.first_name},</Text>

        {/* Subject */}
        <Text style={styles.subject}>Re: {subject}</Text>

        {/* Description of Work */}
        {quote.description_of_work && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description of work</Text>
            {parseSimpleMarkdown(quote.description_of_work)}
          </View>
        )}

        {/* Specifications Note */}
        {quote.specifications_note && (
          <View style={styles.section}>
            {parseSimpleMarkdown(quote.specifications_note)}
          </View>
        )}

        {/* Product Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.table}>
            <Text style={styles.sectionTitle}>{section.section_name}</Text>
            
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Item</Text>
              <Text style={styles.col2}>Quantity</Text>
              <Text style={styles.col3}>Unit Price</Text>
              <Text style={styles.col4}>Total</Text>
            </View>
            
            {section.line_items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.tableRow}>
                <Text style={styles.col1}>{item.description}</Text>
                <Text style={styles.col2}>{item.quantity.toFixed(2)}</Text>
                <Text style={styles.col3}>${item.unit_price.toFixed(2)}</Text>
                <Text style={styles.col4}>${item.line_total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sub-Total ex GST</Text>
            <Text style={styles.totalValue}>${quote.subtotal_ex_gst.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST</Text>
            <Text style={styles.totalValue}>${quote.gst_amount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total inc GST</Text>
            <Text style={styles.totalValue}>${quote.total_inc_gst.toFixed(2)}</Text>
          </View>
        </View>

        {/* Important Notes */}
        {quote.include_important_notes && (
          <View style={styles.importantNotesSection}>
            <Text style={styles.importantNotesTitle}>Important Notes</Text>
            {parseSimpleMarkdown(IMPORTANT_NOTES)}
          </View>
        )}

        {/* How To Pay */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentTitle}>How To Pay</Text>
            <Text style={styles.paymentQuoteNo}>QUOTATION NO. {quote.quote_number}</Text>
          </View>
          
          <View style={styles.paymentDetails}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>Direct Credit</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Bank:</Text>
              <Text>{COMPANY_DETAILS.bank}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Acc. Name:</Text>
              <Text>{COMPANY_DETAILS.accountName}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Acc. No.:</Text>
              <Text>{COMPANY_DETAILS.accountNumber}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
              <Text>Customer Reference: ____________</Text>
              <Text>Customer Name: {customerName}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* PAGE 2+: Terms & Conditions */}
      {terms && (
        <Page size="A4" style={styles.page}>
          <View style={styles.secondaryHeader}>
            <Text>{COMPANY_DETAILS.tradingAs}</Text>
          </View>
          
          {parseTermsAndConditions(terms.body)}
        </Page>
      )}
    </Document>
  );
}