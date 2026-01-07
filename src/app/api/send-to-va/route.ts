import { NextRequest, NextResponse } from "next/server";
import { sendAssessmentCompletedToVA } from "@/lib/email-service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    // Fetch assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        opportunities (
          client_id,
          company_id,
          clients (first_name, last_name),
          companies (company_name)
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { ok: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Get VA users (role = 'VA')
    const { data: vaUsers } = await supabase
      .from('team_members')
      .select('email, first_name, last_name')
      .eq('role', 'VA')
      .eq('is_active', true)
      .limit(1);

    if (!vaUsers || vaUsers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No VA user found" },
        { status: 404 }
      );
    }

    const va = vaUsers[0];
    const customerName = assessment.opportunities?.clients
      ? `${assessment.opportunities.clients.first_name} ${assessment.opportunities.clients.last_name}`
      : assessment.opportunities?.companies?.company_name || 'Customer';

    // Send email
    const result = await sendAssessmentCompletedToVA({
      vaEmail: va.email,
      vaName: `${va.first_name} ${va.last_name}`,
      assessmentId: assessment.id,
      assessmentReference: assessment.reference_number,
      customerName,
      siteAddress: assessment.site_address || 'N/A',
      assessmentDate: new Date(assessment.scheduled_date).toLocaleDateString('en-NZ'),
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    // Update assessment to mark VA notified
    await supabase
      .from('assessments')
      .update({
        va_notified_at: new Date().toISOString(),
        va_notification_email: va.email,
      })
      .eq('id', assessmentId);

    return NextResponse.json({
      ok: true,
      message: "Email sent to VA successfully",
      messageId: result.messageId,
    });

  } catch (error: any) {
    console.error("send-to-va error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
