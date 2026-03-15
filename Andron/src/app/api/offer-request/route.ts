import { NextRequest, NextResponse } from "next/server";

interface OfferRequestBody {
  name?: string;
  email?: string;
  company?: string;
  position?: string;
  assessmentCount?: string;
  goal?: string;
  source?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OfferRequestBody;
    const {
      name,
      email,
      company,
      position,
      assessmentCount,
      goal,
      source,
      message,
    } = body;

    if (!name || !email || !company || !position || !assessmentCount || !goal) {
      return NextResponse.json(
        { success: false, message: "Zorunlu alanlar eksik." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Geçersiz e-posta adresi." },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      "http://localhost:5000";
    const recipientEmail = process.env.TEST_CONTACT_EMAIL || "info@androngame.com";

    const subject = `Kurumsal Teklif Talebi - ${company} (${name})`;

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #222;">Yeni Kurumsal Teklif Talebi</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold; width: 220px;">Ad Soyad</td><td style="padding: 8px; border: 1px solid #ddd;">${name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Kurumsal E-posta</td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Şirket Adı</td><td style="padding: 8px; border: 1px solid #ddd;">${company}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Pozisyon</td><td style="padding: 8px; border: 1px solid #ddd;">${position}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Assessment Adedi</td><td style="padding: 8px; border: 1px solid #ddd;">${assessmentCount}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Amaç</td><td style="padding: 8px; border: 1px solid #ddd;">${goal}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Bizi Nereden Buldunuz?</td><td style="padding: 8px; border: 1px solid #ddd;">${source || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f8f8f8; font-weight: bold;">Mesaj</td><td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${message || "-"}</td></tr>
          </table>
        </body>
      </html>
    `;

    const backendResponse = await fetch(`${backendUrl}/api/admin/send-contact-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        html,
        replyTo: email,
      }),
    });

    const backendText = await backendResponse.text();
    let backendData: { success?: boolean; message?: string } = {};
    try {
      backendData = backendText ? JSON.parse(backendText) : {};
    } catch {
      backendData = { message: backendText };
    }

    if (!backendResponse.ok || !backendData.success) {
      return NextResponse.json(
        {
          success: false,
          message: backendData.message || "Mail gönderimi başarısız oldu.",
        },
        { status: backendResponse.status || 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Talebiniz başarıyla iletildi." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Offer request api error:", error);
    return NextResponse.json(
      { success: false, message: "İstek işlenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
