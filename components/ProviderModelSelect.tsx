"use client";

import { useEffect } from "react";
import type { Provider } from "@/lib/config-types";
import { SUPPORTED_PROVIDERS } from "@/lib/config-types";
import {
  getDefaultModel,
  getModelsForProvider,
  PROVIDER_LABELS,
} from "@/lib/providers";

interface ProviderModelSelectProps {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  providerId?: string;
  modelId?: string;
  providerName?: string;
  modelName?: string;
}

export function ProviderModelSelect({
  provider,
  model,
  onProviderChange,
  onModelChange,
  disabled = false,
  providerId = "provider",
  modelId = "model",
  providerName,
  modelName,
}: ProviderModelSelectProps) {
  const models = getModelsForProvider(provider);

  useEffect(() => {
    if (!models.some((m) => m.id === model)) {
      onModelChange(getDefaultModel(provider));
    }
  }, [provider, models, model, onModelChange]);

  function handleProviderChange(nextProvider: string) {
    onProviderChange(nextProvider);
    onModelChange(getDefaultModel(nextProvider));
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor={providerId} className="text-sm font-medium">
          Provider
        </label>
        <select
          id={providerId}
          name={providerName}
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          disabled={disabled}
          required
          className="field-input"
        >
          {SUPPORTED_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p as Provider]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-[2] flex-col gap-1">
        <label htmlFor={modelId} className="text-sm font-medium">
          Model
        </label>
        <select
          id={modelId}
          name={modelName}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled || models.length === 0}
          required
          className="field-input"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
