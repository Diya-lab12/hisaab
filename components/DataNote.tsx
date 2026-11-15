import Link from "next/link";
import { AI_DATA } from "@/lib/aiRole";

/** One short privacy line, with the full explanation in a small popover. It replaces the long paragraphs that were repeated on every step. */
export default function DataNote({ line }: { line: string }) {
  return (
    <div className="data-note">
      <p className="fine">{line}</p>
      <details className="popover">
        <summary>How your data is used</summary>
        <div className="popover-body">
          <ul>
            <li>{AI_DATA}</li>
            <li>Pictures stay on your device and are cleared when you close the tab. The text in them is read on your device. They are not uploaded.</li>
            <li>When you send your case to the advocate, your details, notice and pictures are emailed to her, and Claimatic keeps your request so it can show you the status. You can delete it later.</li>
            <li>Before you add a picture, hide other people&apos;s faces, card numbers, UPI IDs, OTPs and passwords.</li>
          </ul>
          <p className="fine"><Link href="/privacy">Read the privacy page</Link></p>
        </div>
      </details>
    </div>
  );
}
