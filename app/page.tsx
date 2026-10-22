"use client";
import { useState } from "react";
import ComplaintWizard from "@/components/ComplaintWizard";
import Hero from "@/components/Hero";
import Logo from "@/components/Logo";
import { useSavedCase } from "@/lib/session";

export default function Home() {
  const saved = useSavedCase();
  const [started, setStarted] = useState(false);
  // Coming back from the case page ("Edit my details") reopens the wizard on the review step.
  const showWizard = started || Boolean(saved);

  return (
    <main className="page home">
      <header className="topbar"><Logo /></header>
      {showWizard ? (
        <ComplaintWizard key={saved ? "saved" : "new"} initial={saved?.input} startStep={saved ? 3 : 0} />
      ) : (
        <Hero onStart={() => setStarted(true)} />
      )}
      <p className="disclaimer">General legal information, not legal advice. Review your notice before sending it.</p>
    </main>
  );
}
