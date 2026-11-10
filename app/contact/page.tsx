import { ADVOCATE } from "@/lib/advocate";

export const metadata = { title: "Contact" };

export default function Contact() {
  return (
    <main className="page narrow-page">
      <h1 className="page-h">Contact</h1>
      <p className="lede">Questions about a case, a payment or your data? Email us and we&apos;ll reply as soon as we can.</p>
      <section className="ws-card" aria-labelledby="c1">
        <h2 id="c1">Email</h2>
        <p><a href={`mailto:${ADVOCATE.reviewEmail}`} className="link">{ADVOCATE.reviewEmail}</a></p>
        <p className="fine">Please don&apos;t email passwords or card details. If your question is about a case you sent, include its reference number.</p>
      </section>
      <section className="ws-card" aria-labelledby="c2">
        <h2 id="c2">The reviewing advocate</h2>
        <p>{ADVOCATE.name}, {ADVOCATE.title}, {ADVOCATE.council}, Enrolment No. {ADVOCATE.enrolment}, {ADVOCATE.place}.</p>
      </section>
    </main>
  );
}
