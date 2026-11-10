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
        <h2 id="p2">What is sent to an AI</h2>
        <p>What you write about the problem, and your answers to the questions, are sent to an AI service to check your case. Your name, address and contact details are not. A picture is sent to an AI only if you choose &ldquo;Check with AI&rdquo; for that picture.</p>
        <p>The wording helper and the &ldquo;explain in simple words&rdquo; feature send only the text you wrote or the result, never your personal details.</p>
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
