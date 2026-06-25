"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { clearLocalUserData, exportLocalData } from "@/lib/client-data";

export function DataSync() {
  const { status } = useSession();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      const local = exportLocalData();
      if (!local.hasData) return;
      try {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(local),
        });
        clearLocalUserData();
      } catch {
        syncedRef.current = false;
      }
    })();
  }, [status]);

  return null;
}
