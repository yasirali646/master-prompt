import Link from "next/link";
import { Footer } from "@/components/Footer";

export function LegalLayout({
  title,
  children,
  updated,
}: {
  title: string;
  children: React.ReactNode;
  updated: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="header-shell">
        <div className="mx-auto flex max-w-[1600px] items-center px-4 py-3 md:px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight hover:text-accent">
            ← Back to Master Prompt
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-10 md:px-6 md:py-14">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mb-10 text-sm text-muted-fg">Last updated: {updated}</p>
        <article className="legal-content space-y-6 text-[0.9375rem] leading-relaxed text-muted-fg [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}
