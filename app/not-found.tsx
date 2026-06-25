import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-muted-fg">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-fg">
        The page you requested does not exist or may have been removed.
      </p>
      <Link href="/" className="btn-primary mt-8 inline-flex cursor-pointer !w-auto px-6">
        Back to home
      </Link>
    </main>
  );
}
