import Link from "next/link";

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
        <p>What you write about the problem is checked on Claimatic&apos;s server, to see whether the Consumer Protection Act, 2019 appears to cover it. To read your story, the server sends that text to Google&apos;s Gemini AI service, which returns the company, amount, date and a short explanation. The law sections and your notice are built by Claimatic&apos;s own rules, not by the AI. Claimatic does not store the story. Please do not include your name, phone number or address in it. If the AI service is unavailable, Claimatic&apos;s own rules read the story instead.</p>
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
