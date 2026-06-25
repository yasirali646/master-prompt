import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "History",
  description: "Browse and manage your generated master prompt history.",
  path: "/history",
  noIndex: true,
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
