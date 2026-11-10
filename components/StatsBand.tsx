/** Two figures from public sources, in a slim band. The numbers are rounded. */
export default function StatsBand() {
  return (
    <section className="stats-band" aria-label="Consumer complaints in India, in numbers">
      <div className="sb-item">
        <p className="sb-num">13.4 lakh</p>
        <p className="sb-label">complaints reached the National Consumer Helpline in 2024, about 2.5 every minute.</p>
      </div>
      <div className="sb-item">
        <p className="sb-num">1 in 3</p>
        <p className="sb-label">cases in the consumer commissions has waited more than three years.</p>
      </div>
      <p className="sb-src">
        Sources: Ministry of Consumer Affairs reply in Parliament (2025), rounded; India Justice Report, Consumer Justice Report 2026, as reported by{" "}
        <a href="https://www.theweek.in/news/india/2026/03/18/vacancies-backlog-choke-consumer-courts-1-in-3-cases-pending-over-three-years-ijr-report.amp.html" target="_blank" rel="noreferrer">The Week</a>.
      </p>
    </section>
  );
}
