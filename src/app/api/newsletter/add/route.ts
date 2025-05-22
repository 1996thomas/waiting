import { NextResponse } from "next/server";
import { put, head } from "@vercel/blob";
import { Resend } from "resend";
import { html } from "@/app/components/emailTemplate";

const resend = new Resend(process.env.RESEND);
const BLOB_NAME = "newsletter-subscribers.json";
const emailFrom = process.env.EMAIL_FROM;

export async function POST(req: Request) {
  const { email, website, start } = await req.json();

  // Honeypot
  if (website) {
    return NextResponse.json({ error: "Bot détecté" }, { status: 400 });
  }

  //Anti-spam
  const elapsed = Date.now() - Number(start);
  if (isNaN(elapsed) || elapsed < 800) {
    return NextResponse.json(
      { error: "Soumission trop rapide" },
      { status: 400 }
    );
  }

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!email || !isValidEmail(email) || email.length > 100) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // Lecture du blob existant
  let existing: { email: string; date: string }[] = [];

  try {
    const blobMeta = await head(BLOB_NAME);
    if (blobMeta?.url) {
      const res = await fetch(blobMeta.url);
      const text = await res.text();
      existing = JSON.parse(text);
    }
  } catch (err) {
    console.info(
      err,
      "Blob introuvable ou invalide, création d’un nouveau fichier."
    );
  }

  const alreadyExists = existing.some((entry) => entry.email === email);
  if (alreadyExists) {
    return NextResponse.json({ error: "Email déjà inscrit" }, { status: 409 });
  }

  const newEntry = { email, date: new Date().toISOString() };
  const updated = [...existing, newEntry];

  await put(BLOB_NAME, JSON.stringify(updated, null, 2), {
    access: "public",
    allowOverwrite: true,
  });

  // Envoi email de confirmation
  await resend.emails.send({
    from: emailFrom || "newsletter@99knit.com",
    to: email,
    subject: "99Knit - Merci pour ton inscription",
    html: html,
  });
  return NextResponse.json({ success: true });
}
