"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Square, Zap, Share2, FileUp, Wand2 } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SettingsModal, type ConfigData } from "./SettingsModal";
import { Toast } from "./Toast";
import { TemplateChips } from "./TemplateChips";
import { ExportMenu } from "./ExportMenu";
import { QualityBadge } from "./QualityBadge";
import { StructuredPreview } from "./StructuredPreview";
import { RefinePanel } from "./RefinePanel";
import { TestSandbox } from "./TestSandbox";
import { ComparePanel } from "./ComparePanel";
import { OnboardingTour } from "./OnboardingTour";
import { useStream } from "@/hooks/useStream";
import { loadApiKeys } from "@/lib/client-api-keys";
import {
  loadLocalConfig,
  recordLocalUsage,
  saveLocalConfig,
  saveLocalHistoryEntry,
} from "@/lib/client-data";
import { ProviderModelSelect } from "./ProviderModelSelect";
import { getDefaultModel, normalizeModel } from "@/lib/providers";
import { useWorkspace } from "./WorkspaceProvider";

type Tab = "generate" | "import";
type OutputView = "raw" | "structured";

const DRAFT_KEY = "mp-idea-draft";

export function MasterPromptApp() {
  const { data: session, status: authStatus } = useSession();
  const isLoggedIn = authStatus === "authenticated" && !!session?.user;
  const { activeWorkspaceId, apiQuery, withWorkspace } = useWorkspace();
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("generate");
  const [idea, setIdea] = useState("");
  const [importPrompt, setImportPrompt] = useState("");
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState(getDefaultModel("anthropic"));
  const [output, setOutput] = useState("");
  const [outputVisible, setOutputVisible] = useState(false);
  const [outputView, setOutputView] = useState<OutputView>("raw");
  const [versions, setVersions] = useState<{ output: string; instruction?: string }[]>([]);
  const [status, setStatus] = useState<{ text: string; variant: "idle" | "streaming" | "warning" | "error" }>({ text: "", variant: "idle" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const { streaming, consumeStream, stop } = useStream();
  const importFileRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  const loadConfig = useCallback(async () => {
    if (isLoggedIn) {
      const res = await fetch(`/api/config${apiQuery()}`);
      if (!res.ok) return;
      const data = await res.json();
      setConfig(data);
      setProvider(data.provider ?? "anthropic");
      setModel(normalizeModel(data.provider ?? "anthropic", data.model));
      return;
    }
    const data = await loadLocalConfig();
    setConfig(data);
    setProvider(data.provider ?? "anthropic");
    setModel(normalizeModel(data.provider ?? "anthropic", data.model));
  }, [isLoggedIn, apiQuery]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setIdea(draft);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, idea), 500);
    return () => clearTimeout(t);
  }, [idea]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !streaming) {
        e.preventDefault();
        if (tab === "generate") handleGenerate();
        else handleImport();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function handleSaveSettings(data: Record<string, unknown>) {
    if (isLoggedIn) {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withWorkspace(data)),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save");
      }
    } else {
      await saveLocalConfig(data as Parameters<typeof saveLocalConfig>[0]);
    }
    await loadConfig();
    setSettingsOpen(false);
    showToast(isLoggedIn ? "Settings saved" : "Settings saved locally");
  }

  async function runStream(
    url: string,
    body: Record<string, unknown>,
    sourceIdea: string,
    usageType: "generate" | "import"
  ) {
    setOutput("");
    setOutputVisible(true);
    setVersions([]);
    setStatus({ text: "Generating", variant: "streaming" });
    try {
      const apiKeys = await loadApiKeys();
      const result = await consumeStream(url, withWorkspace({ ...body, apiKeys }), setOutput);
      if (result.missing?.length) {
        setStatus({ text: `Complete — missing: ${result.missing.join(", ")}`, variant: "warning" });
      } else {
        setStatus({ text: "Generation complete", variant: "idle" });
      }
      if (!isLoggedIn) {
        if (usageType === "generate" && !body.skipHistory) {
          saveLocalHistoryEntry({
            idea: sourceIdea,
            output: result.text,
            provider,
            model,
          });
        }
        recordLocalUsage({
          type: usageType,
          provider,
          model,
          totalTokens: result.usage?.totalTokens,
        });
      }
      setIdea(sourceIdea);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus({ text: "Stopped", variant: "idle" });
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed";
      setStatus({ text: msg, variant: "error" });
      showToast(msg, "error");
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          const content =
            typeof parsed === "string"
              ? parsed
              : parsed.content ?? parsed.prompt ?? parsed.output ?? text;
          setImportPrompt(typeof content === "string" ? content : JSON.stringify(content, null, 2));
        } catch {
          setImportPrompt(text);
        }
      } else {
        setImportPrompt(text);
      }
      showToast(`Loaded ${file.name}`);
    } catch {
      showToast("Failed to read file", "error");
    }
    e.target.value = "";
  }

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed) { showToast("Enter your idea", "error"); return; }
    if (!model) { showToast("Select a model", "error"); return; }
    await runStream("/api/generate", { idea: trimmed, provider, model }, trimmed, "generate");
  }

  async function handleImport(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = importPrompt.trim();
    if (trimmed.length < 20) { showToast("Paste a longer prompt", "error"); return; }
    if (!model) { showToast("Select a model", "error"); return; }
    await runStream("/api/import", { prompt: trimmed, provider, model }, "Imported prompt", "import");
  }

  function handleRefined(text: string, instruction: string) {
    setOutput(text);
    setVersions((v) => [...v, { output: text, instruction }]);
  }

  async function handleShare() {
    if (!output) return;
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, output }),
    });
    const share = await res.json();
    const url = `${window.location.origin}/p/${share.id}`;
    await navigator.clipboard.writeText(url);
    showToast("Share link copied");
  }

  const hasOutput = output.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <OnboardingTour />

      <main className="mx-auto w-full max-w-[800px] flex-1 px-4 py-8 md:px-6 md:py-12">
        <section className="mb-8 text-center">
          <h1 className="mb-3 text-[clamp(1.75rem,5vw,2.25rem)] font-bold leading-tight tracking-tight text-shadow-glow">
            Turn ideas into master prompts
          </h1>
          <p className="mx-auto max-w-[52ch] text-muted-fg">
            Structured state-machine prompts with strict rules and multi-step workflows.
            <span className="mt-1 block text-xs opacity-70">Tip: Cmd+Enter to generate</span>
          </p>
        </section>

        <div className="mb-4 flex gap-2">
          {(["generate", "import"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-accent text-[#052e16]" : "bg-muted text-muted-fg hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCompareOpen((o) => !o)}
            className={`ml-auto cursor-pointer rounded-full px-4 py-2 text-sm ${compareOpen ? "bg-accent/20 text-accent" : "text-muted-fg hover:text-foreground"}`}
          >
            A/B Compare
          </button>
        </div>

        <section className="rounded-[14px] border border-border bg-surface p-6">
          {tab === "generate" ? (
            <form onSubmit={handleGenerate} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1">
                <label htmlFor="idea" className="text-sm font-medium">Your idea</label>
                <textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={3}
                  placeholder="e.g. I want to create a youtube channel clone prompt"
                  disabled={streaming}
                  className="field-input min-h-[88px] resize-y"
                />
                <TemplateChips onSelect={setIdea} />
              </div>
              <ProviderModelSelect
                provider={provider}
                model={model}
                onProviderChange={setProvider}
                onModelChange={setModel}
                disabled={streaming}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={streaming} className="btn-primary relative flex-1 cursor-pointer">
                  {streaming ? <span className="inline-block h-5 w-5 animate-spin-slow rounded-full border-2 border-transparent border-t-current" /> : <><Zap className="h-4 w-4" /> Generate</>}
                </button>
                {streaming && (
                  <button type="button" onClick={stop} className="btn-secondary cursor-pointer">
                    <Square className="h-4 w-4" /> Stop
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleImport} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="import" className="text-sm font-medium">
                    Existing prompt to restructure
                  </label>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".txt,.md,.markdown,.json,text/plain,text/markdown,application/json"
                    onChange={handleImportFile}
                    className="sr-only"
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => importFileRef.current?.click()}
                    disabled={streaming}
                    className="btn-secondary cursor-pointer !min-h-9 !px-3 !py-1.5 text-xs"
                  >
                    <FileUp className="h-3.5 w-3.5" aria-hidden />
                    Upload file
                  </button>
                </div>
                <textarea
                  id="import"
                  value={importPrompt}
                  onChange={(e) => setImportPrompt(e.target.value)}
                  rows={6}
                  placeholder="Paste an existing system prompt to convert into state-machine format, or upload a .txt, .md, or .json file"
                  disabled={streaming}
                  className="field-input min-h-[120px] resize-y font-mono text-sm"
                />
              </div>
              <ProviderModelSelect
                provider={provider}
                model={model}
                onProviderChange={setProvider}
                onModelChange={setModel}
                disabled={streaming}
              />
              <button type="submit" disabled={streaming} className="btn-primary cursor-pointer">
                <Wand2 className="h-4 w-4" /> Import & Restructure
              </button>
            </form>
          )}
        </section>

        {compareOpen && <ComparePanel idea={idea} provider={provider} model={model} onToast={showToast} />}

        {outputVisible && (
          <section className="mt-8 overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Output</h2>
                <div className="flex rounded-[8px] border border-border bg-background p-0.5 text-xs">
                  {(["raw", "structured"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setOutputView(v)} className={`cursor-pointer rounded-[6px] px-2 py-1 capitalize ${outputView === v ? "bg-muted text-foreground" : "text-muted-fg"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!hasOutput} onClick={handleShare} className="btn-secondary cursor-pointer">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>

            {hasOutput && <QualityBadge text={output} />}

            {status.text && (
              <div role="status" aria-live="polite" className={`px-4 py-2 text-xs md:px-6 ${status.variant === "streaming" ? "text-muted-fg after:ml-1 after:inline-block after:h-3.5 after:w-1.5 after:animate-blink after:bg-accent after:align-text-bottom after:content-['']" : status.variant === "warning" ? "text-[#fbbf24]" : status.variant === "error" ? "text-destructive" : "text-muted-fg"}`}>
                {status.text}
              </div>
            )}

            {outputView === "structured" ? (
              <StructuredPreview text={output} />
            ) : (
              <pre className={`max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words bg-background p-4 font-mono text-sm leading-relaxed md:p-6 ${!hasOutput ? "italic text-muted-fg" : ""}`}>
                {output || (streaming ? "" : "—")}
              </pre>
            )}

            <div className="border-t border-border px-4 py-4 md:px-6">
              <ExportMenu output={output} idea={idea} disabled={!hasOutput || streaming} onToast={showToast} />
            </div>

            <RefinePanel idea={idea} output={output} provider={provider} model={model} onRefined={handleRefined} onToast={showToast} />
            <TestSandbox masterPrompt={output} provider={provider} model={model} />

            {versions.length > 0 && (
              <div className="border-t border-border px-4 py-3 text-xs text-muted-fg md:px-6">
                {versions.length} refinement(s) applied
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />

      <SettingsModal open={settingsOpen} config={config} onClose={() => setSettingsOpen(false)} onSave={handleSaveSettings} onToast={showToast} />
      <Toast message={toast?.message ?? null} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}
