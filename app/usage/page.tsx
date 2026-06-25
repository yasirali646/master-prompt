"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { getLocalUsageSummary } from "@/lib/client-data";

interface Summary {
  totalGenerations: number;
  totalTokens: number;
  estimatedCostUsd: number;
  byProvider: Record<string, { count: number; tokens: number }>;
  recent: { type: string; provider: string; model: string; totalTokens?: number; createdAt: string }[];
}

export default function UsagePage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const { activeWorkspaceId, apiQuery } = useWorkspace();
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (isLoggedIn) {
      fetch(`/api/usage${apiQuery()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setData);
      return;
    }
    setData(getLocalUsageSummary());
  }, [isLoggedIn, status, activeWorkspaceId, apiQuery]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onOpenSettings={() => {}} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 md:px-6">
        <h1 className="mb-6 text-2xl font-bold">Usage & Cost</h1>
        {!isLoggedIn && status !== "loading" && (
          <p className="mb-4 text-sm text-muted-fg">Usage is tracked locally. Sign in to persist usage in your account.</p>
        )}
        {isLoggedIn && activeWorkspaceId && (
          <p className="mb-4 text-sm text-muted-fg">Showing shared workspace usage.</p>
        )}
        {!data ? (
          <p className="text-muted-fg">Loading…</p>
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <Stat label="Generations" value={String(data.totalGenerations)} />
              <Stat label="Total tokens" value={data.totalTokens.toLocaleString()} />
              <Stat label="Est. cost (USD)" value={`$${data.estimatedCostUsd}`} />
            </div>
            <h2 className="mb-3 font-semibold">By provider</h2>
            <div className="mb-8 space-y-2">
              {Object.entries(data.byProvider).map(([p, v]) => (
                <div key={p} className="flex justify-between rounded-[10px] border border-border bg-surface px-4 py-3 text-sm">
                  <span className="capitalize">{p}</span>
                  <span className="text-muted-fg">{v.count} calls · {v.tokens.toLocaleString()} tokens</span>
                </div>
              ))}
            </div>
            <h2 className="mb-3 font-semibold">Recent activity</h2>
            <ul className="space-y-2 text-sm">
              {data.recent.map((r, i) => (
                <li key={i} className="flex justify-between rounded-[10px] border border-border px-4 py-2 text-muted-fg">
                  <span>{r.type} · {r.provider}</span>
                  <span>{r.totalTokens ?? "—"} tok · {new Date(r.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-4">
      <p className="text-xs text-muted-fg">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
