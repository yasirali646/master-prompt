import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Usage & Cost",
  description: "Track token usage and estimated costs across AI providers.",
  path: "/usage",
  noIndex: true,
});

export default function UsageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
