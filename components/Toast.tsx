"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error";
  onDismiss: () => void;
}

export function Toast({ message, type = "success", onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`animate-toast-in fixed bottom-6 left-1/2 z-200 -translate-x-1/2 rounded-[10px] border px-5 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${
        type === "error"
          ? "border-destructive bg-surface"
          : "border-accent bg-surface"
      }`}
    >
      {message}
    </div>
  );
}
