import { NextRequest, NextResponse } from "next/server";
import { sendCertificateToCustomer } from "@/lib/email-service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Mark job as complete and create certificate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { completionDate, completionNotes } = await request.json();

    // Fetch job with related data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        opportunities (
          client_id,
          company_id,
          clients (first_name, last_name, email),
          companies (company_name, primary_email)
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { ok: false, error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status === "Completed") {
      return NextResponse.json(
        { ok: false, error: "Job is already completed" },
        { status: 400 }
      );
    }

    // Update job to completed
    await supabase
      .from("jobs")
      .update({
        status: "Completed",
        completed_at: completionDate || new Date().toISOString(),
        completion_notes: completionNotes || "",
      })
      .eq("id", jobId);

    // Generate certificate number
    const { data: lastCert } = await supabase
      .from("certificates")
      .select("certificate_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let certificateNumber = "CERT-2025-0001";
    if (lastCert?.certificate_number) {
      const match = lastCert.certificate_number.match(/CERT-\d{4}-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        certificateNumber = `CERT-2025-${nextNum.toString().padStart(4, "0")}`;
      }
    }

    // Create certificate
    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        certificate_number: certificateNumber,
        job_id: jobId,
        customer_first_name: job.customer_first_name,
        customer_last_name: job.customer_last_name,
        customer_email: job.customer_email,
        site_address: job.site_address,
        city: job.city,
        postcode: job.postcode,
        completion_date: completionDate || new Date().toISOString(),
        warranty_expiry_date: new Date(
          Date.now() + (job.warranty_period_months || 12) * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        certificate_status: "Issued",
        issued_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (certError || !certificate) {
      console.error("Certificate creation error:", certError);
      return NextResponse.json(
        { ok: false, error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    // Get customer email and name
    let customerEmail = "";
    let customerName = "";

    if (job.opportunities?.clients) {
      customerEmail = job.opportunities.clients.email || job.customer_email || "";
      customerName = `${job.opportunities.clients.first_name} ${job.opportunities.clients.last_name}`;
    } else if (job.opportunities?.companies) {
      customerEmail = job.opportunities.companies.primary_email || job.customer_email || "";
      customerName = job.opportunities.companies.company_name || "";
    } else {
      customerEmail = job.customer_email || "";
      customerName = `${job.customer_first_name} ${job.customer_last_name}`;
    }

    // Send certificate email if customer email exists
    if (customerEmail) {
      const emailResult = await sendCertificateToCustomer({
        customerEmail,
        customerName,
        certificateNumber: certificate.certificate_number,
        jobCompletionDate: new Date(certificate.completion_date).toLocaleDateString("en-NZ"),
        siteAddress: job.site_address || "N/A",
        warrantyMonths: job.warranty_period_months || 12,
        viewCertificateUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/certificates/${certificate.id}`,
      });

      if (!emailResult.success) {
        console.error("Failed to send certificate email:", emailResult.error);
      }

      // Update certificate with sent info
      await supabase
        .from("certificates")
        .update({
          sent_at: new Date().toISOString(),
          sent_to_email: customerEmail,
        })
        .eq("id", certificate.id);

      return NextResponse.json({
        ok: true,
        message: "Job completed, certificate created and sent",
        certificate,
        certificateNumber,
        messageId: emailResult.messageId,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Job completed and certificate created",
      certificate,
      certificateNumber,
    });
  } catch (error: any) {
    console.error("Complete job error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to complete job" },
      { status: 500 }
    );
  }
}
