import AdvocateDashboard from "@/components/AdvocateDashboard";

export const metadata = { title: "Advocate approvals", robots: { index: false, follow: false } };

export default function AdvocatePage() {
  return (
    <main className="page">
      <AdvocateDashboard />
    </main>
  );
}
