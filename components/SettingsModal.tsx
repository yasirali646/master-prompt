"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { loadApiKeys, maskApiKeys, saveApiKeys } from "@/lib/client-api-keys";
import { ProviderModelSelect } from "./ProviderModelSelect";
import { normalizeModel } from "@/lib/providers";

export interface ConfigData {
  provider: string;
  model: string | null;
  temperature?: number;
  max_tokens?: number | null;
  verbosity?: string;
}

interface SettingsModalProps {
  open: boolean;
  config: ConfigData | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function SettingsModal({ open, config, onClose, onSave, onToast }: SettingsModalProps) {
  const [tab, setTab] = useState<"general" | "keys">("general");
  const [keyStatus, setKeyStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (open && tab === "keys") {
      loadApiKeys().then((keys) => maskApiKeys(keys)).then(setKeyStatus);
    }
  }, [open, tab]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (tab === "keys") {
      const keys: Record<string, string> = {};
      for (const key of ["openai_api_key", "anthropic_api_key", "google_api_key", "groq_api_key"]) {
        const v = (fd.get(key) as string)?.trim();
        if (v) keys[key] = v;
      }
      const existing = await loadApiKeys();
      await saveApiKeys({ ...existing, ...keys });
      setKeyStatus(await maskApiKeys(await loadApiKeys()));
      onToast("API keys saved locally in your browser");
      return;
    }

    const data: Record<string, unknown> = {
      provider: fd.get("provider"),
      model: fd.get("model"),
      temperature: Number(fd.get("temperature")),
      max_tokens: fd.get("max_tokens") ? Number(fd.get("max_tokens")) : null,
      verbosity: fd.get("verbosity"),
    };
    if (!data.model) {
      onToast("Select a model", "error");
      return;
    }
    await onSave(data);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button type="button" className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col animate-modal-in rounded-[14px] border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="settings-title" className="text-lg font-semibold">Settings</h2>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-[10px] p-2 text-muted-fg hover:bg-muted" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-border px-4">
          {(["general", "keys"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer px-4 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-accent text-foreground" : "text-muted-fg"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
          {tab === "general" && <GeneralSettingsFields config={config} />}
          {tab === "keys" && (
            <>
              <p className="text-xs text-muted-fg">
                API keys are stored only in your browser, encrypted locally. They are never saved on our servers.{" "}
                <a href="/privacy" className="text-accent underline">Privacy Policy</a>
              </p>
              {[
                { id: "openaiKey", name: "openai_api_key", label: "OpenAI" },
                { id: "anthropicKey", name: "anthropic_api_key", label: "Anthropic" },
                { id: "googleKey", name: "google_api_key", label: "Google" },
                { id: "groqKey", name: "groq_api_key", label: "Groq" },
              ].map((k) => (
                <Field key={k.name} label={`${k.label} API key`} htmlFor={k.id}>
                  <input id={k.id} name={k.name} type="password" className="field-input" autoComplete="off" placeholder="Leave blank to keep existing" />
                  <p className="text-xs text-muted-fg">Stored locally: {keyStatus[k.name] ?? "(not set)"}</p>
                </Field>
              ))}
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost cursor-pointer">Cancel</button>
            <button type="submit" className="btn-primary cursor-pointer !w-auto px-6">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GeneralSettingsFields({ config }: { config: ConfigData | null }) {
  const [provider, setProvider] = useState(config?.provider ?? "anthropic");
  const [model, setModel] = useState(
    normalizeModel(config?.provider ?? "anthropic", config?.model)
  );

  useEffect(() => {
    setProvider(config?.provider ?? "anthropic");
    setModel(normalizeModel(config?.provider ?? "anthropic", config?.model));
  }, [config]);

  return (
    <>
      <ProviderModelSelect
        provider={provider}
        model={model}
        onProviderChange={setProvider}
        onModelChange={setModel}
        providerId="settingsProvider"
        modelId="settingsModel"
        providerName="provider"
        modelName="model"
      />
      <Field label="Temperature" htmlFor="temperature">
        <input id="temperature" name="temperature" type="number" step="0.1" min="0" max="2" defaultValue={config?.temperature ?? 0.7} className="field-input" />
      </Field>
      <Field label="Max tokens" htmlFor="max_tokens">
        <input id="max_tokens" name="max_tokens" type="number" defaultValue={config?.max_tokens ?? ""} placeholder="Auto" className="field-input" />
      </Field>
      <Field label="Verbosity" htmlFor="verbosity">
        <select id="verbosity" name="verbosity" defaultValue={config?.verbosity ?? "standard"} className="field-input">
          <option value="concise">Concise (6-8 states)</option>
          <option value="standard">Standard</option>
          <option value="detailed">Detailed (10-12 states)</option>
        </select>
      </Field>
    </>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
