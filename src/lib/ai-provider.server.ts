/**
 * Provider-agnostic chat completion helper.
 *
 * Works on Lovable AND on any host (Vercel, Netlify, Fly, a VPS...) with no
 * Lovable-specific environment variables. The first provider whose API key is
 * present in the environment wins:
 *
 *   1. OPENAI_API_KEY        -> https://api.openai.com/v1        (default model gpt-4o-mini)
 *   2. OPENROUTER_API_KEY    -> https://openrouter.ai/api/v1     (default model google/gemini-2.0-flash-001)
 *   3. GEMINI_API_KEY        -> Google's OpenAI-compatible API   (default model gemini-2.5-flash)
 *   4. LOVABLE_API_KEY       -> Lovable AI Gateway               (only available inside Lovable)
 *
 * Optional overrides (any provider):
 *   AI_MODEL     - model id to use instead of the provider default
 *   AI_BASE_URL  - OpenAI-compatible base URL (used with AI_API_KEY)
 *   AI_API_KEY   - API key for AI_BASE_URL
 */

type Provider = {
  name: string;
  url: string;
  headers: Record<string, string>;
  model: string;
};

const GOOGLE_OPENAI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function resolveProvider(): Provider {
  const override = env("AI_MODEL");

  const custom = env("AI_API_KEY");
  const customBase = env("AI_BASE_URL");
  if (custom && customBase) {
    return {
      name: "custom",
      url: `${customBase.replace(/\/+$/, "")}/chat/completions`,
      headers: { Authorization: `Bearer ${custom}` },
      model: override ?? "gpt-4o-mini",
    };
  }

  const openai = env("OPENAI_API_KEY");
  if (openai) {
    return {
      name: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      headers: { Authorization: `Bearer ${openai}` },
      model: override ?? "gpt-4o-mini",
    };
  }

  const openrouter = env("OPENROUTER_API_KEY");
  if (openrouter) {
    return {
      name: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: { Authorization: `Bearer ${openrouter}` },
      model: override ?? "google/gemini-2.0-flash-001",
    };
  }

  const gemini = env("GEMINI_API_KEY") ?? env("GOOGLE_GENERATIVE_AI_API_KEY");
  if (gemini) {
    return {
      name: "gemini",
      url: `${GOOGLE_OPENAI_BASE}/chat/completions`,
      headers: { Authorization: `Bearer ${gemini}` },
      model: override ?? "gemini-2.5-flash",
    };
  }

  const lovable = env("LOVABLE_API_KEY");
  if (lovable) {
    return {
      name: "lovable",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      headers: { "Lovable-API-Key": lovable, "X-Lovable-AIG-SDK": "fetch" },
      model: override ?? "google/gemini-3.6-flash",
    };
  }

  throw new Error(
    "No AI provider is configured. Add one of these environment variables to your " +
      "hosting provider (e.g. Vercel > Project Settings > Environment Variables) and redeploy: " +
      "OPENAI_API_KEY (OpenAI), OPENROUTER_API_KEY (OpenRouter), or GEMINI_API_KEY (Google AI Studio). " +
      "Optionally set AI_MODEL to pick a specific model.",
  );
}

export async function callChat(system: string, user: string): Promise<string> {
  const provider = resolveProvider();

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...provider.headers,
    },
    body: JSON.stringify({
      model: provider.model,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403)
      throw new Error(
        `The AI provider (${provider.name}) rejected the API key. Check the key value in your hosting environment variables.`,
      );
    if (res.status === 429) throw new Error("The AI is rate limited right now. Try again shortly.");
    if (res.status === 402)
      throw new Error(`AI credits are exhausted for the configured provider (${provider.name}).`);
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") out += delta;
      } catch {
        /* partial chunk */
      }
    }
  }
  return out;
}
