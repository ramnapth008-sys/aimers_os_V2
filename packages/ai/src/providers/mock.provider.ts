import type {
  AiTextProvider,
} from "../ai-provider";

import type {
  AiGenerateTextRequest,
  AiGenerateTextResult,
} from "../types";

function clip(
  value: string,
  maximum = 500,
): string {
  const normalized = value.trim();

  if (normalized.length <= maximum) {
    return normalized;
  }

  return `${normalized.slice(0, maximum).trimEnd()}…`;
}

export class MockAiProvider
implements AiTextProvider {
  readonly name = "mock" as const;

  constructor(
    private readonly model: string,
  ) {}

  async generateText(
    request: AiGenerateTextRequest,
  ): Promise<AiGenerateTextResult> {
    const lastUserMessage =
      [...request.messages]
        .reverse()
        .find(
          (message) =>
            message.role === "user",
        )
        ?.content ??
      "No user question was supplied.";

    return {
      provider: this.name,
      model: this.model,
      text: [
        "Mock Research AI is active.",
        "",
        `I received this question: ${clip(lastUserMessage)}`,
        "",
        "No external model call was made. Set AI_PROVIDER=openai and configure OPENAI_API_KEY in apps/api/.env to enable live server-generated answers.",
      ].join("\n"),
      inputTokens: null,
      outputTokens: null,
    };
  }
}
