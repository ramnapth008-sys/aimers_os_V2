export type AiProviderName =
  | "mock"
  | "openai";

export type AiMessageRole =
  | "user"
  | "assistant";

export interface AiMessage {
  role: AiMessageRole;
  content: string;
}

export interface AiGenerateTextRequest {
  instructions: string;
  messages: readonly AiMessage[];
  maxOutputTokens?: number;
  safetyIdentifier?: string;
}

export interface AiGenerateTextResult {
  provider: AiProviderName;
  model: string;
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface AiProviderConfiguration {
  provider: AiProviderName;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  openAiApiKey?: string;
  openAiBaseUrl?: string;
}
