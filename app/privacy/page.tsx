import Link from "next/link";
import { AI_DATA } from "@/lib/aiRole";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <main className="page narrow-page">
      <h1 className="page-h">Privacy</h1>
      <p className="callout">Draft. This describes what Claimatic does today. It has not yet been reviewed as a formal privacy policy.</p>

      <section className="ws-card" aria-labelledby="p1">
        <h2 id="p1">What stays on your device</h2>
        <p>Your cases are saved in your browser on your device. Your evidence pictures are kept only in the open tab and are not uploaded or saved. The text in them is read on your device.</p>
      </section>

      <section className="ws-card" aria-labelledby="p2">
        <h2 id="p2">How your story is checked</h2>
        <p>{AI_DATA}</p>
        <p>The AI writes your story out in English, checks whether the Consumer Protection Act, 2019 appears to cover it, and drafts your notice. It may cite only sections from Claimatic&apos;s verified list; our server removes anything else and rejects drafts that cite court cases or state facts you didn&apos;t confirm. If the AI service is unavailable, you see an error and can try again; nothing is checked by any other means. Please leave your name, phone number and address out of your story: you add them on the last step, and they go only into the notice and to the advocate.</p>
      </section>

      <section className="ws-card" aria-labelledby="p3">
        <h2 id="p3">When you send your case to the advocate</h2>
        <p>Your name, address, contact details, the notice and your evidence pictures are emailed to the advocate. Claimatic also keeps your request on its server, with your notice and details, so it can show you the status. The pictures are in the email, not stored on the server.</p>
        <p>You can delete your request from the server from your case page. The advocate keeps the email she already received.</p>
      </section>

      <section className="ws-card" aria-labelledby="p4">
        <h2 id="p4">Payments</h2>
        <p>You pay by UPI to the advocate. Claimatic stores the amount, the payment reference and the UPI transaction ID you enter, so the advocate can match the payment.</p>
      </section>

      <p>Questions? <Link href="/contact" className="link">Contact us</Link>.</p>
    </main>
  );
}
