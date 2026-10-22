import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExampleWorkspace from "@/components/ExampleWorkspace";
import { EXAMPLES, getExample } from "@/lib/examples";

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

async function Example({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) notFound();
  return <ExampleWorkspace example={example} />;
}

export default function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="page narrow-page">
      <p className="crumbs"><Link href="/examples">Example cases</Link></p>
      <Suspense fallback={<p className="status">Loading the example…</p>}>
        <Example params={params} />
      </Suspense>
    </main>
  );
}
