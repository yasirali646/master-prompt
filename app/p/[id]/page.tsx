import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getShare } from "@/lib/share-store";
import { createPageMetadata, sharedPromptJsonLd } from "@/lib/seo";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) {
    return createPageMetadata({
      title: "Prompt Not Found",
      description: "This shared prompt could not be found.",
      path: `/p/${id}`,
      noIndex: true,
    });
  }

  const description = share.idea.slice(0, 155) + (share.idea.length > 155 ? "…" : "");

  return createPageMetadata({
    title: share.idea,
    description: `Shared master prompt: ${description}`,
    path: `/p/${id}`,
    ogType: "article",
  });
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={sharedPromptJsonLd(share.idea, share.id, share.createdAt)} />
      <header className="border-b border-border bg-surface-elevated px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Master Prompt
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 md:px-6">
        <p className="mb-2 text-sm text-muted-fg">
          Shared prompt · {new Date(share.createdAt).toLocaleDateString()}
        </p>
        <h1 className="mb-6 text-xl font-semibold">{share.idea}</h1>
        <pre className="whitespace-pre-wrap break-words rounded-[14px] border border-border bg-surface p-6 font-mono text-sm leading-relaxed">
          {share.output}
        </pre>
      </main>
    </div>
  );
}
