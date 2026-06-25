import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Workspaces",
  description: "Create and manage team workspaces for collaborative prompt building.",
  path: "/workspaces",
  noIndex: true,
});

export default function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
