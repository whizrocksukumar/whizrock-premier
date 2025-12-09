import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with API key from Vercel environment
const resend = new Resend(process.env.Resend_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract fields ONCE ONLY
    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const customerName = formData.get("customerName") as string;
    const quoteNumber = formData.get("quoteNumber") as string;
    const pdfFile = formData.get("pdf") as Blob;

    // Validate required fields
    if (!to || !subject || !pdfFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert PDF Blob → Buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // Build your email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <p>Dear ${customerName},</p>
          <p>Please find your quote (#${quoteNumber}) attached.</p>
        </body>
      </html>
    `;

    // Send email using Resend
    const result = await resend.emails.send({
      from: "quotes@premierinsulation.nz",
      to,
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: `Quote-${quoteNumber}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Email API Error →", error);
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
