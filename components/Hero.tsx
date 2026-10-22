/** A small, true-to-life sample of the finished notice, so the first screen shows the outcome. */
function SampleNotice() {
  return (
    <figure className="sample" aria-label="Example of a finished legal notice">
      <div className="sheet-sample" aria-hidden="true">
        <p className="s-meta">Date: 22 October 2026</p>
        <p className="s-to">To, The Manager / Grievance Officer<br />Swiggy</p>
        <p className="s-sub"><strong>Subject:</strong> Legal notice under the Consumer Protection Act, 2019: complaint regarding ₹1,200 paid to Swiggy</p>
        <p>On 2 October 2026, I paid ₹1,200 for an order that was never delivered. Swiggy has refused to refund my money. This is a deficiency in service and an unfair trade practice. I demand a full refund with interest.</p>
        <p className="s-sec">Sections relied upon: 2(7), 2(11), 2(47), 39</p>
        <p className="s-sign">Yours faithfully,<br />Priya Menon</p>
      </div>
      <figcaption>Example notice. Yours is written from your facts.</figcaption>
    </figure>
  );
}

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <div className="hero">
      <div className="hero-copy">
        <h1>
          <span className="l1">Your money.</span>
          <span className="l2">Your right.</span>
          <span className="l3">Let&apos;s get it back.</span>
        </h1>
        <p className="sub">
          Tell us what the company did. We check it against the Consumer Protection Act, 2019, and write the legal notice for you.
        </p>
        <button type="button" className="cta" onClick={onStart}>Start your complaint</button>
        <ul className="facts">
          <li>Free to use</li>
          <li>Takes a few minutes</li>
          <li>Pictures stay on your device</li>
        </ul>
      </div>
      <SampleNotice />
    </div>
  );
}
