/**
 * API keys are stored only in the browser (localStorage), encrypted locally.
 * They are never written to server-side config files.
 */

const STORAGE_KEY = "mp_api_keys_v1";

export interface StoredApiKeys {
  openai_api_key?: string;
  anthropic_api_key?: string;
  google_api_key?: string;
  groq_api_key?: string;
}

async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`master-prompt:${location.origin}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("master-prompt-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function saveApiKeys(keys: StoredApiKeys): Promise<void> {
  const existing = await loadApiKeys();
  const merged = { ...existing, ...keys };
  Object.keys(merged).forEach((k) => {
    if (!merged[k as keyof StoredApiKeys]) delete merged[k as keyof StoredApiKeys];
  });

  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(merged));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const payload = JSON.stringify({ iv: toBase64(iv), data: toBase64(ciphertext) });
  localStorage.setItem(STORAGE_KEY, payload);
}

export async function loadApiKeys(): Promise<StoredApiKeys> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { iv, data } = JSON.parse(raw) as { iv: string; data: string };
    const key = await deriveKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(iv) },
      key,
      fromBase64(data)
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as StoredApiKeys;
  } catch {
    return {};
  }
}

export async function maskApiKeys(keys: StoredApiKeys): Promise<Record<string, string>> {
  const mask = (v?: string) => {
    if (!v) return "(not set)";
    if (v.length <= 8) return "****";
    return `${v.slice(0, 4)}...${v.slice(-4)}`;
  };
  return {
    openai_api_key: mask(keys.openai_api_key),
    anthropic_api_key: mask(keys.anthropic_api_key),
    google_api_key: mask(keys.google_api_key),
    groq_api_key: mask(keys.groq_api_key),
  };
}

export async function hashFingerprint(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
