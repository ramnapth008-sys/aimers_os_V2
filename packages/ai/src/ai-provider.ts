import type {
  AiGenerateTextRequest,
  AiGenerateTextResult,
  AiProviderName,
} from "./types";

export interface AiTextProvider {
  readonly name: AiProviderName;

  generateText(
    request: AiGenerateTextRequest,
  ): Promise<AiGenerateTextResult>;
}
