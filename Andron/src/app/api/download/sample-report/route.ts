import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FILE_NAME = "ANDRON_Ornek_Rapor.pdf";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "templates", FILE_NAME);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Rapor dosyasi bulunamadi." },
      { status: 404 }
    );
  }
}
