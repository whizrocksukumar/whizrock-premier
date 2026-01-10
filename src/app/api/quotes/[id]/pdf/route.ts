import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { supabase } from '@/lib/supabase';
import QuotePDF from '@/components/QuotePDF'; // Using your existing import path
import React from 'react';
import { getLogoBase64 } from '@/lib/utils/pdf-utils';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const quoteId = params.id;

        console.log('Fetching quote:', quoteId);

        // Fetch quote details (ADDED new fields: subject, description_of_work, specifications_note, include_important_notes)
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select(`
                *,
                clients (
                    first_name,
                    last_name,
                    email,
                    phone,
                    companies (
                        company_name
                    )
                ),
                team_members!quotes_sales_rep_id_fkey (
                    first_name,
                    last_name
                )
            `)
            .eq('id', quoteId)
            .single();

        if (quoteError || !quote) {
            console.error('Quote error:', quoteError);
            return NextResponse.json(
                { error: 'Quote not found', details: quoteError },
                { status: 404 }
            );
        }

        console.log('Quote found:', quote.quote_number);

        // Fetch quote sections and line items (UNCHANGED)
        const { data: sections, error: sectionsError } = await supabase
            .from('quote_sections')
            .select(`
                *,
                app_types (
                    name
                ),
                quote_line_items (
                    *,
                    products (
                        product_description
                    )
                )
            `)
            .eq('quote_id', quoteId)
            .order('id', { ascending: true });

        if (sectionsError) {
            console.error('Sections error:', sectionsError);
            return NextResponse.json(
                { error: 'Failed to fetch quote sections', details: sectionsError },
                { status: 500 }
            );
        }

        console.log('Sections found:', sections?.length || 0);

        // NEW: Fetch active terms & conditions
        const { data: terms } = await supabase
            .from('quote_terms_master')
            .select('body')
            .eq('is_active', true)
            .single();

        // NEW: Get logo as base64
        const logoBase64 = await getLogoBase64();

        // Calculate totals (UNCHANGED)
        let subtotal = 0;
        const formattedSections = (sections || []).map(section => {
            const lineItems = (section.quote_line_items || []).map((item: any) => {
                if (!item.is_labour) {
                    subtotal += item.line_sell || 0;
                }
                return {
                    description: item.products?.product_description || 'Custom Item',
                    quantity: item.area_sqm || 0,
                    unit_price: item.sell_price || 0,
                    line_total: item.line_sell || 0,
                };
            });

            return {
                section_name: section.custom_name || section.app_types?.name || 'Section',
                line_items: lineItems,
            };
        });

        const gst = subtotal * 0.15;
        const total = subtotal + gst;

        // Prepare quote data for PDF (UPDATED to match new QuotePDF component)
        const pdfData = {
            quote: {
                quote_number: quote.quote_number,
                quote_date: quote.quote_date,
                validity_days: quote.validity_days || 30,
                subject: quote.subject, // NEW
                description_of_work: quote.description_of_work, // NEW
                specifications_note: quote.specifications_note, // NEW
                include_important_notes: quote.include_important_notes ?? true, // NEW
                subtotal_ex_gst: subtotal,
                gst_amount: gst,
                total_inc_gst: total,
            },
            customer: {
                first_name: quote.clients?.first_name || '',
                last_name: quote.clients?.last_name || '',
                email: quote.clients?.email,
                phone: quote.clients?.phone,
            },
            site: {
                address_line_1: quote.site_address || '',
                city: quote.city,
                postcode: quote.postcode,
            },
            salesRep: quote.team_members?.first_name && quote.team_members?.last_name
                ? {
                    first_name: quote.team_members.first_name,
                    last_name: quote.team_members.last_name,
                }
                : undefined,
            sections: formattedSections,
            terms, // NEW
            logoBase64, // NEW
        };

        console.log('Generating PDF...');

        // Generate PDF (UNCHANGED)
        const pdfDocument = React.createElement(QuotePDF, pdfData) as React.ReactElement;
        const pdfStream = await ReactPDF.renderToStream(pdfDocument as any);

        console.log('PDF stream created');

        // Convert stream to buffer (UNCHANGED)
        const chunks: any[] = [];
        for await (const chunk of pdfStream) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        console.log('PDF generated successfully, size:', pdfBuffer.length);

        // Return PDF as response (UNCHANGED)
        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Quote-${quote.quote_number}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { error: 'Failed to generate PDF', message: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}