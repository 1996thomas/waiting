import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";
import { Resend } from "resend";
import { html } from "@/app/components/emailTemplate";
import { decrypt, encrypt } from "@/utils";

const resend = new Resend(process.env.RESEND!);
const BLOB_NAME = process.env.BLOB_NAME || "BLOB_NAME";
const emailFrom = process.env.EMAIL_FROM;

/**
 * Détermine si la chaîne ressemble à notre format « iv:tag:cipher »
 */
const looksEncrypted = (str: string) => str.split(":").length === 3;

export async function POST(req: NextRequest) {
  const { email, website, start } = await req.json();

  // Honeypot --------------------------------------------------------------
  if (website) {
    return NextResponse.json({ error: "Bot détecté" }, { status: 400 });
  }

  // Anti‑spam -------------------------------------------------------------
  const elapsed = Date.now() - Number(start);
  if (isNaN(elapsed) || elapsed < 800) {
    return NextResponse.json(
      { error: "Soumission trop rapide" },
      { status: 400 }
    );
  }

  const isValidEmail = (mail: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  if (!email || !isValidEmail(email) || email.length > 100) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // Lecture du blob existant ---------------------------------------------
  let existing: { email: string; date: string }[] = [];
  try {
    const blobMeta = await head(BLOB_NAME);
    if (blobMeta?.url) {
      const res = await fetch(blobMeta.url);
      existing = await res.json();
    }
  } catch {
    // premier upload : on continue avec existing = []
  }

  // Vérification de doublon ----------------------------------------------
  const alreadyExists = existing.some((entry) => {
    if (looksEncrypted(entry.email)) {
      try {
        return decrypt(entry.email) === email;
      } catch {
        return false; // entrée corrompue ignorée
      }
    }
    // Entrées legacy non chiffrées
    return entry.email === email;
  });

  if (alreadyExists) {
    return NextResponse.json({ error: "Email déjà inscrit" }, { status: 409 });
  }

  // Ajout de la nouvelle entrée ------------------------------------------
  const encryptedEmail = encrypt(email);
  const newEntry = { email: encryptedEmail, date: new Date().toISOString() };
  const updated = [...existing, newEntry];

  await put(BLOB_NAME, JSON.stringify(updated, null, 2), {
    access: "public", // le fichier reste public mais chiffré
    allowOverwrite: true,
  });

  // Envoi email de confirmation ------------------------------------------
  await resend.emails.send({
    from: `99Knit <${emailFrom || "newsletter@99knit.com"}>`,
    to: email,
    subject: "99Knit - Merci pour ton inscription",
    html,
  });

  return NextResponse.json({ success: true });
}
