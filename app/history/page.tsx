"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { deleteLocalHistoryEntry, listLocalHistory } from "@/lib/client-data";
import { Trash2 } from "lucide-react";

interface Entry {
  id: string;
  idea: string;
  output: string;
  provider: string;
  qualityScore: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const { activeWorkspaceId, apiQuery } = useWorkspace();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (isLoggedIn) {
      fetch(`/api/history${apiQuery()}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setEntries);
      return;
    }
    setEntries(listLocalHistory());
  }, [isLoggedIn, status, activeWorkspaceId, apiQuery]);

  async function handleDelete(id: string) {
    if (isLoggedIn) {
      await fetch(`/api/history/${id}${apiQuery()}`, { method: "DELETE" });
    } else {
      deleteLocalHistoryEntry(id);
    }
    setEntries((e) => e.filter((x) => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onOpenSettings={() => {}} />
      <main className="mx-auto flex w-full max-w-[900px] flex-1 gap-6 px-4 py-8 md:px-6">
        <div className="w-full md:w-1/3">
          <h1 className="mb-4 text-xl font-bold">History</h1>
          {!isLoggedIn && status !== "loading" && (
            <p className="mb-3 text-xs text-muted-fg">Stored locally in your browser. Sign in to sync to your account.</p>
          )}
          {isLoggedIn && activeWorkspaceId && (
            <p className="mb-3 text-xs text-muted-fg">Showing shared workspace history.</p>
          )}
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelected(e)}
                  className={`w-full cursor-pointer rounded-[10px] border p-3 text-left text-sm transition-colors ${selected?.id === e.id ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-muted-fg"}`}
                >
                  <p className="line-clamp-2 font-medium">{e.idea}</p>
                  <p className="mt-1 text-xs text-muted-fg">{e.provider} · {e.qualityScore}/100 · {new Date(e.createdAt).toLocaleDateString()}</p>
                </button>
              </li>
            ))}
            {entries.length === 0 && <p className="text-sm text-muted-fg">No history yet.</p>}
          </ul>
        </div>
        <div className="hidden flex-1 md:block">
          {selected ? (
            <div>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{selected.idea}</h2>
                  <p className="text-xs text-muted-fg">{selected.provider} · Score {selected.qualityScore}/100</p>
                </div>
                <button type="button" onClick={() => handleDelete(selected.id)} className="btn-secondary cursor-pointer text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <pre className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap rounded-[14px] border border-border bg-surface p-4 font-mono text-xs">{selected.output}</pre>
              <Link href="/" className="btn-primary mt-4 inline-flex cursor-pointer !w-auto">Use on home</Link>
            </div>
          ) : (
            <p className="text-muted-fg">Select an entry to view</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
