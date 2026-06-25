import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/50 bg-background px-4 py-5">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-xs text-muted-fg sm:flex-row">
        <p>© {year} Master Prompt</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="Legal">
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms & Conditions
          </Link>
        </nav>
      </div>
    </footer>
  );
}
