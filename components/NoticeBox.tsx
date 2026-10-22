"use client";
import { useState } from "react";

export default function NoticeBox({ notice }: { notice: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(notice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please select the text and copy it manually.");
    }
  }
  return (
    <section className="notice">
      <div className="notice-head">
        <h3>Your legal notice</h3>
        <button type="button" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <pre>{notice}</pre>
    </section>
  );
}
