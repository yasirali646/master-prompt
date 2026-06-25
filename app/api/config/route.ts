import { NextResponse } from "next/server";
import { requireDataScope } from "@/lib/auth-api";
import { loadScopedConfig, saveScopedConfig } from "@/lib/request-config";
import {
  maskedConfig,
  SUPPORTED_PROVIDERS,
  type Provider,
  type Verbosity,
} from "@/lib/config-types";
import { assertProviderModel, getDefaultModel, normalizeModel } from "@/lib/providers";

export async function GET(request: Request) {
  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;

  const config = await loadScopedConfig(scope);
  return NextResponse.json(maskedConfig(config));
}

export async function PUT(request: Request) {
  const body = await request.json();
  const scope = await requireDataScope(request, body);
  if (scope instanceof Response) return scope;

  const config = await loadScopedConfig(scope);

  if (body.provider !== undefined) {
    if (!SUPPORTED_PROVIDERS.includes(body.provider)) {
      return NextResponse.json(
        { detail: `Provider must be one of: ${SUPPORTED_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }
    config.provider = body.provider as Provider;
    if (body.model === undefined) {
      config.model = normalizeModel(config.provider, config.model);
    }
  }

  if (body.model !== undefined) {
    try {
      config.model = assertProviderModel(config.provider, body.model);
    } catch (err) {
      return NextResponse.json(
        { detail: err instanceof Error ? err.message : "Invalid model" },
        { status: 400 }
      );
    }
  } else if (body.provider !== undefined && !config.model) {
    config.model = getDefaultModel(config.provider);
  }

  if (body.temperature !== undefined) config.temperature = Number(body.temperature);
  if (body.max_tokens !== undefined) config.max_tokens = body.max_tokens ? Number(body.max_tokens) : null;
  if (body.verbosity !== undefined) config.verbosity = body.verbosity as Verbosity;

  await saveScopedConfig(scope, config);
  return NextResponse.json(maskedConfig(config));
}
