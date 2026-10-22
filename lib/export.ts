// Browser-only helpers: file downloads and the email link. Loaded on demand.

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeName(company: string): string {
  return "Legal-notice-" + (company.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "company");
}

export async function downloadPdf(text: string, filename: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  // The built-in PDF font has no rupee glyph, so write it as "Rs." in the PDF only.
  const clean = text.replace(/₹\s?/g, "Rs. ");
  doc.setFont("times", "normal");
  doc.setFontSize(11.5);
  const margin = 22;
  const width = 210 - margin * 2;
  const lineH = 5.8;
  let y = margin;
  for (const para of clean.split("\n")) {
    const lines: string[] = para.trim() === "" ? [""] : doc.splitTextToSize(para, width);
    for (const line of lines) {
      if (y > 297 - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineH;
    }
  }
  doc.save(filename + ".pdf");
}

export async function downloadDocx(text: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const doc = new Document({
    sections: [
      {
        children: text.split("\n").map(
          (line) =>
            new Paragraph({
              spacing: { after: 120 },
              children: [new TextRun({ text: line, font: "Times New Roman", size: 24 })],
            }),
        ),
      },
    ],
  });
  saveBlob(await Packer.toBlob(doc), filename + ".docx");
}

export function downloadIcs(opts: { title: string; description: string; dateIso: string }, filename: string) {
  const d = opts.dateIso.replace(/-/g, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const next = new Date(opts.dateIso + "T00:00:00");
  next.setDate(next.getDate() + 1);
  const end = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hisaab//EN",
    "BEGIN:VEVENT",
    `UID:${d}-${Math.random().toString(36).slice(2)}@hisaab`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(opts.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  saveBlob(new Blob([ics], { type: "text/calendar" }), filename + ".ics");
}

export function noticeSubject(text: string): string {
  const line = text.split("\n").find((l) => l.startsWith("Subject:"));
  return line ? line.replace(/^Subject:\s*/, "") : "Legal notice under the Consumer Protection Act, 2019";
}

export function mailtoHref(to: string, text: string): string {
  const params = `subject=${encodeURIComponent(noticeSubject(text))}&body=${encodeURIComponent(text)}`;
  return `mailto:${to.trim()}?${params}`;
}

export function looksLikeEmail(s: string): boolean {
  return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(s.trim());
}
