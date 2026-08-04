import type {
  AiTextProvider,
} from "../ai-provider";

import {
  AiProviderError,
} from "../provider-error";

import type {
  AiGenerateTextRequest,
  AiGenerateTextResult,
} from "../types";

type JsonRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown,
): value is JsonRecord {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value),
  );
}

function extractOutputText(
  payload: unknown,
): string {
  if (
    !isRecord(payload) ||
    !Array.isArray(payload.output)
  ) {
    return "";
  }

  const parts: string[] = [];

  for (const item of payload.output) {
    if (
      !isRecord(item) ||
      !Array.isArray(item.content)
    ) {
      continue;
    }

    for (const content of item.content) {
      if (
        isRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function readUsage(
  payload: unknown,
): {
  inputTokens: number | null;
  outputTokens: number | null;
} {
  if (
    !isRecord(payload) ||
    !isRecord(payload.usage)
  ) {
    return {
      inputTokens: null,
      outputTokens: null,
    };
  }

  return {
    inputTokens:
      typeof payload.usage.input_tokens === "number"
        ? payload.usage.input_tokens
        : null,

    outputTokens:
      typeof payload.usage.output_tokens === "number"
        ? payload.usage.output_tokens
        : null,
  };
}

function readProviderError(
  payload: unknown,
): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    isRecord(payload.error) &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return null;
}

export class OpenAiResponsesProvider
implements AiTextProvider {
  readonly name = "openai" as const;

  private readonly baseUrl: string;

  constructor(
    private readonly configuration: {
      apiKey: string;
      baseUrl: string;
      model: string;
      timeoutMs: number;
      maxOutputTokens: number;
    },
  ) {
    if (!configuration.apiKey.trim()) {
      throw new AiProviderError(
        "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
        {
          code: "configuration",
        },
      );
    }

    this.baseUrl =
      configuration.baseUrl.replace(/\/+$/, "");
  }

  async generateText(
    request: AiGenerateTextRequest,
  ): Promise<AiGenerateTextResult> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        this.configuration.timeoutMs,
      );

    try {
      const response =
        await fetch(
          `${this.baseUrl}/responses`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${this.configuration.apiKey}`,
              "Content-Type":
                "application/json",
            },

            signal:
              controller.signal,

            body:
              JSON.stringify({
                model:
                  this.configuration.model,

                instructions:
                  request.instructions,

                input:
                  request.messages.map(
                    (message) => ({
                      role: message.role,
                      content:
                        message.content,
                    }),
                  ),

                max_output_tokens:
                  request.maxOutputTokens ??
                  this.configuration
                    .maxOutputTokens,

                store:
                  false,

                safety_identifier:
                  request.safetyIdentifier,
              }),
          },
        );

      const payload: unknown =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        const providerMessage =
          readProviderError(payload);

        const code =
          response.status === 401 ||
          response.status === 403
            ? "authentication"
            : response.status === 429
              ? "rate_limit"
              : "provider_error";

        throw new AiProviderError(
          providerMessage ||
          `OpenAI returned HTTP ${response.status}.`,
          {
            code,
            statusCode:
              response.status,
            retryable:
              response.status === 408 ||
              response.status === 429 ||
              response.status >= 500,
          },
        );
      }

      const text =
        extractOutputText(payload);

      if (!text) {
        throw new AiProviderError(
          "OpenAI returned no text output.",
          {
            code:
              "invalid_response",
          },
        );
      }

      const usage =
        readUsage(payload);

      const responseModel =
        isRecord(payload) &&
        typeof payload.model === "string"
          ? payload.model
          : this.configuration.model;

      return {
        provider: this.name,
        model: responseModel,
        text,
        inputTokens:
          usage.inputTokens,
        outputTokens:
          usage.outputTokens,
      };
    } catch (error) {
      if (error instanceof AiProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new AiProviderError(
          "The AI provider request timed out.",
          {
            code: "timeout",
            retryable: true,
            cause: error,
          },
        );
      }

      throw new AiProviderError(
        "Unable to reach the AI provider.",
        {
          code: "provider_error",
          retryable: true,
          cause: error,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
