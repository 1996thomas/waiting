import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { decrypt } from "@/utils";

const BLOB_NAME = "encrypted-subscribers-AtQOHuUSeObMWSfGaKWNwEHl72RCLe.json";
const EXPORT_TOKEN = process.env.EXPORT_TOKEN;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token || token !== EXPORT_TOKEN) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 });
  }

  try {
    const blobMeta = await head(BLOB_NAME);
    if (!blobMeta?.url) {
      return NextResponse.json({ error: "Blob introuvable" }, { status: 404 });
    }

    const res = await fetch(blobMeta.url);
    const text = await res.text();
    const entries: { email: string; date: string }[] = JSON.parse(text);

    const emails: string[] = [];
    for (const entry of entries) {
      try {
        const decrypted = decrypt(entry.email);
        emails.push(decrypted);
      } catch {
        // ligne corrompue ignorée
      }
    }

    const csv = `emails\n"${emails.join('","')}"`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers.csv"`,
      },
    });
  } catch (err) {
    console.error("Erreur lors de l’export :", err);
    return NextResponse.json(
      { error: "Erreur lors de l’export" },
      { status: 500 }
    );
  }
}
