// Server-only. Builds the notice PDF from the final notice text, so the advocate always receives a PDF made on the server
// from exactly the text that was submitted.
import { jsPDF } from "jspdf";

export function noticePdfBase64(text: string, ref: string): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  // The built-in PDF fonts have no rupee glyph, so the PDF writes "Rs." instead.
  const clean = text.replace(/₹\s?/g, "Rs. ").replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, "");
  const margin = 22;
  const width = 210 - margin * 2;
  const lineH = 5.8;
  let y = margin;
  let page = 1;
  const footer = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Claimatic ref ${ref} - page ${page}`, margin, 297 - 10);
    doc.setFont("times", "normal");
    doc.setFontSize(11.5);
  };
  doc.setFont("times", "normal");
  doc.setFontSize(11.5);
  for (const para of clean.split("\n")) {
    const heading = /^(LEGAL NOTICE|DRAFT FOR ADVOCATE REVIEW)/.test(para.trim());
    doc.setFont("times", heading ? "bold" : "normal");
    const lines: string[] = para.trim() === "" ? [""] : doc.splitTextToSize(para, width);
    for (const line of lines) {
      if (y > 297 - margin - 6) {
        footer();
        doc.addPage();
        page++;
        y = margin;
        doc.setFont("times", heading ? "bold" : "normal");
      }
      doc.text(line, margin, y);
      y += lineH;
    }
  }
  footer();
  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}
