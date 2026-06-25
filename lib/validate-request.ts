import { assertProviderModel } from "@/lib/providers";
import type { Provider } from "@/lib/config-types";

export function parseProviderModel(
  body: { provider?: string; model?: string | null },
  config: { provider: Provider; model: string | null }
): { provider: Provider; model: string } {
  const provider = (body.provider as Provider) || config.provider;
  const model = assertProviderModel(provider, (body.model as string) || config.model);
  return { provider, model };
}
