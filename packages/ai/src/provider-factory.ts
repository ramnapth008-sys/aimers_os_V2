import type {
  AiTextProvider,
} from "./ai-provider";

import {
  AiProviderError,
} from "./provider-error";

import {
  MockAiProvider,
} from "./providers/mock.provider";

import {
  OpenAiResponsesProvider,
} from "./providers/openai-responses.provider";

import type {
  AiProviderConfiguration,
} from "./types";

export function createAiProvider(
  configuration:
    AiProviderConfiguration,
): AiTextProvider {
  switch (configuration.provider) {
    case "mock":
      return new MockAiProvider(
        configuration.model,
      );

    case "openai":
      return new OpenAiResponsesProvider({
        apiKey:
          configuration.openAiApiKey ?? "",
        baseUrl:
          configuration.openAiBaseUrl ??
          "https://api.openai.com/v1",
        model:
          configuration.model,
        timeoutMs:
          configuration.timeoutMs,
        maxOutputTokens:
          configuration.maxOutputTokens,
      });

    default:
      throw new AiProviderError(
        "Unsupported AI provider configuration.",
        {
          code: "configuration",
        },
      );
  }
}
