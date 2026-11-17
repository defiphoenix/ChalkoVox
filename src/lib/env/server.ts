/**
 * Server-only environment access for AI providers.
 * Never import this file from a client component.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Reads a required server environment variable or throws a descriptive error. */
export function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ConfigError(`${name} is not set. Add it to .env.local and restart the server.`);
  }
  return value;
}

/**
 * OpenRouter-compatible settings used by the AI client.
 * OPENROUTER_BASE_URL allows a proxy or alternative OpenAI-compatible gateway.
 */
export function getOpenRouterSettings() {
  const baseUrl = (
    process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1"
  ).replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new ConfigError("OPENROUTER_BASE_URL must start with http:// or https://.");
  }

  return {
    apiKey: requireServerEnv("OPENROUTER_API_KEY"),
    model: process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash",
    baseUrl,
  };
}

/** Deepgram API key used by speech-to-text and text-to-speech. */
export function getDeepgramKey(): string {
  return requireServerEnv("DEEPGRAM_API_KEY");
}

