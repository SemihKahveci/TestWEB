import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, company, where, email, phone, message, newsletter } = body;

    // Validation
    if (!topic || !company || !where || !email || !phone || !message) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Create email content
    const emailSubject = `New Contact Form Submission - ${topic}`;
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0099FF;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold; width: 200px;">Topic:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${topic}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold;">Company Name:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${company}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold;">How Did You Hear About Us:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${where}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold;">Email:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold;">Phone:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold;">Newsletter Subscription:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${newsletter ? "Yes" : "No"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This email was sent from the contact form on the ANDRON Game website.
          </p>
        </body>
      </html>
    `;

    // Send email using backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000";
    
    // Email recipient - Production: info@androngame.com
    // Test için environment variable kullanılabilir: TEST_CONTACT_EMAIL
    const recipientEmail = process.env.TEST_CONTACT_EMAIL || "info@androngame.com";
    
    console.log("Sending email to backend:", {
      url: `${backendUrl}/api/admin/send-contact-email`,
      to: recipientEmail,
      from: email,
      backendUrl
    });

    try {
      const backendResponse = await fetch(`${backendUrl}/api/admin/send-contact-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          html: emailBody,
          replyTo: email,
        }),
      });

      const backendData = await backendResponse.json();

      console.log("Backend response:", {
        ok: backendResponse.ok,
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        data: backendData
      });

      if (!backendResponse.ok) {
        console.error("Backend error:", backendData);
        return NextResponse.json(
          { 
            success: false, 
            message: backendData.message || "Failed to send email. Please try again later." 
          },
          { status: backendResponse.status }
        );
      }

      if (backendData.success) {
        return NextResponse.json(
          { success: true, message: "Your message has been sent successfully!" },
          { status: 200 }
        );
      } else {
        console.error("Backend returned error:", backendData);
        return NextResponse.json(
          { 
            success: false, 
            message: backendData.message || "Failed to send email. Please try again later.",
            error: backendData.error 
          },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Could not connect to email service. Please try again later." 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

