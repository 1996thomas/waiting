"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot
  const [startTime] = useState(Date.now()); // Anti-spam timing
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!email.includes("@")) {
      setError("Email invalide.");
      return;
    }

    try {
      const res = await fetch("/api/newsletter/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, start: startTime }),
      });

      console.log("Réponse status :", res.status);

      if (res.ok) {
        setSubmitted(true);
      } else {
        let message = "Erreur lors de l'inscription.";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch (jsonErr) {
          console.error("Erreur de parsing JSON :", jsonErr);
        }
        setError(message);
      }
    } catch (fetchErr) {
      console.error("Erreur de requête :", fetchErr);
      setError("Erreur de connexion.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-end min-h-screen font-mono bg-[#141415] overflow-auto relative">
      <video
        src="/anim.mp4"
        autoPlay
        loop
        playsInline
        muted
        className="absolute inset-0 w-full h-full z-0 max-w-[600px] mx-auto object-cover brightness-55"
      />

      <div className="flex-1" />
      <div className="mt-10 w-full flex-1 max-w-sm gap-3 flex flex-col items-center justify-center z-10 relative px-4">
        {!submitted ? (
          <>
            <h1 className="font-bold uppercase text-white text-center">
              Kulture Nexus & Innovative trends
            </h1>

            <div className="flex bg-white/15 rounded-full shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-sm border border-white/30 p-2 pl-5 z-10 items-center w-full">
              <input
                type="email"
                placeholder="E-MAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:outline-none bg-transparent text-white placeholder:text-white/50 w-full pr-2"
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="h-7 w-7 aspect-square rounded-full bg-white text-black flex justify-center items-center z-50"
              >
                <Image
                  src="/arrow.svg"
                  alt="arrow"
                  width={16}
                  height={16}
                  className="h-3 w-3 translate-x-[1px]"
                  priority
                />
              </button>
            </div>

            <label className="text-white text-sm font-semibold">
              SIGNUP FOR EARLY ACCESS
            </label>
            <h2 className="text-white">PARIS, FR</h2>

            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              autoComplete="off"
            />

            {error && <p className="text-red-400 text-xl">{error}</p>}
          </>
        ) : (
          <p className="mt-8 text-2xl drop-shadow-2xl text-white">
            Inscription validée
          </p>
        )}

        {/* Pour debug mobile */}
        <p className="text-white text-xs opacity-30">
          submitted: {submitted.toString()}
        </p>
      </div>
    </div>
  );
}
