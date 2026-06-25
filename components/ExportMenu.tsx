"use client";

import { formatForClaude, formatForChatGPT, formatForCursor } from "@/lib/export";
import { toStructuredJson } from "@/lib/parse-sections";
import { Copy, Download, FileJson, FileText } from "lucide-react";

interface ExportMenuProps {
  output: string;
  idea: string;
  disabled?: boolean;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function ExportMenu({ output, idea, disabled, onToast }: ExportMenuProps) {
  async function download(format: string) {
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output, idea, format }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = format === "docx" ? "docx" : format === "md" ? "md" : format === "json" ? "json" : "txt";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `master-prompt.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      onToast(`Downloaded .${ext}`);
    } catch {
      onToast("Export failed", "error");
    }
  }

  async function copyFormatted(fn: (s: string) => string, label: string) {
    try {
      await navigator.clipboard.writeText(fn(output));
      onToast(`Copied ${label}`);
    } catch {
      onToast("Copy failed", "error");
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(toStructuredJson(output), null, 2));
    onToast("Copied structured JSON");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled} onClick={() => copyFormatted((s) => s, "raw")} className="btn-secondary cursor-pointer">
        <Copy className="h-4 w-4" /> Copy
      </button>
      <button type="button" disabled={disabled} onClick={() => copyFormatted(formatForCursor, "for Cursor")} className="btn-secondary cursor-pointer">
        <Copy className="h-4 w-4" /> Cursor
      </button>
      <button type="button" disabled={disabled} onClick={() => copyFormatted(formatForClaude, "for Claude")} className="btn-secondary cursor-pointer">
        <Copy className="h-4 w-4" /> Claude
      </button>
      <button type="button" disabled={disabled} onClick={() => copyFormatted(formatForChatGPT, "for ChatGPT")} className="btn-secondary cursor-pointer">
        <Copy className="h-4 w-4" /> ChatGPT
      </button>
      <button type="button" disabled={disabled} onClick={() => download("txt")} className="btn-secondary cursor-pointer">
        <Download className="h-4 w-4" /> .txt
      </button>
      <button type="button" disabled={disabled} onClick={() => download("md")} className="btn-secondary cursor-pointer">
        <FileText className="h-4 w-4" /> .md
      </button>
      <button type="button" disabled={disabled} onClick={() => download("docx")} className="btn-secondary cursor-pointer">
        <FileText className="h-4 w-4" /> .docx
      </button>
      <button type="button" disabled={disabled} onClick={copyJson} className="btn-secondary cursor-pointer">
        <FileJson className="h-4 w-4" /> JSON
      </button>
      <button type="button" disabled={disabled} onClick={() => download("json")} className="btn-secondary cursor-pointer">
        <Download className="h-4 w-4" /> .json
      </button>
    </div>
  );
}
