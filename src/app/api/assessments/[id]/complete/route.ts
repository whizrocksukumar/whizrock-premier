import { NextRequest, NextResponse } from "next/server";
import { sendAssessmentCompletedToVA } from "@/lib/email-service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Mark assessment as complete and notify VA to create recommendation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = params.id;

    console.log('Complete assessment API called for ID:', assessmentId);

    // Fetch assessment first without relationships to debug
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select('*')
      .eq("id", assessmentId)
      .single();

    console.log('Assessment query result:', { found: !!assessment, error: assessmentError });

    if (assessmentError || !assessment) {
      console.error('Assessment error:', assessmentError);
      return NextResponse.json(
        { ok: false, error: `Assessment not found: ${assessmentError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    // Check if assessment has opportunity linked
    if (!assessment.opportunity_id) {
      return NextResponse.json(
        { ok: false, error: "Assessment must be linked to an opportunity. Please edit the assessment and select an opportunity first." },
        { status: 400 }
      );
    }

    // Get VA user with ID
    const { data: vaUsers, error: vaError } = await supabase
      .from("team_members")
      .select("id, email, first_name, last_name")
      .eq("role", "VA")
      .eq("status", "active")
      .limit(1);

    console.log('VA query result:', { found: vaUsers?.length || 0, error: vaError });

    if (vaError || !vaUsers || vaUsers.length === 0) {
      console.error('VA error:', vaError);
      return NextResponse.json(
        { ok: false, error: "No active VA found" },
        { status: 400 }
      );
    }

    const va = vaUsers[0];

    // Get customer name from client
    let customerName = "Unknown Client";
    let companyName = "";

    if (assessment.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("first_name, last_name, company_id, companies!company_id(company_name)")
        .eq("id", assessment.client_id)
        .single();

      if (client) {
        customerName = `${client.first_name} ${client.last_name}`;
        companyName = client.companies?.company_name || "";
      }
    }

    console.log('Customer info:', { customerName, companyName });

    // Send email to VA
    const emailResult = await sendAssessmentCompletedToVA({
      vaEmail: va.email,
      vaName: `${va.first_name} ${va.last_name}`,
      assessmentId: assessment.id,
      assessmentReference: assessment.reference_number,
      customerName,
      siteAddress: assessment.site_address || "N/A",
      assessmentDate: new Date(assessment.scheduled_date).toLocaleDateString("en-NZ"),
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { ok: false, error: emailResult.error },
        { status: 500 }
      );
    }

    // Update assessment status
    console.log('Updating assessment status to Completed...');
    const { error: updateError } = await supabase
      .from("assessments")
      .update({
        status: "Completed",
        completed_date: new Date().toISOString(),
      })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Error updating assessment:", updateError);
      return NextResponse.json(
        { ok: false, error: "Failed to update assessment status" },
        { status: 500 }
      );
    }

    console.log('✓ Assessment status updated');

    // Create task for VA with client name and assessment link
    console.log('Creating task for VA...');
    const { error: taskError } = await supabase.from("tasks").insert({
      task_description: `Create Recommendation - ${customerName}`,
      task_type: "Create Recommendation",
      assigned_to_user_id: va.id,
      opportunity_id: assessment.opportunity_id,
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      priority: "High",
      status: "Not Started",
      completion_percent: 0,
      notes: `Assessment: ${assessment.reference_number}\nClient: ${customerName}\nCompany: ${companyName || 'N/A'}\nAssessment ID: ${assessmentId}`,
    });

    if (taskError) {
      console.error("Error creating task:", taskError);
      return NextResponse.json(
        { ok: false, error: "Failed to create task for VA" },
        { status: 500 }
      );
    }

    console.log('✓ Task created successfully');
    console.log('✓ Complete! Assessment marked complete, VA notified, task created');

    return NextResponse.json({
      ok: true,
      message: "Assessment marked complete and VA notified",
      messageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error("Complete assessment error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to complete assessment" },
      { status: 500 }
    );
  }
}
