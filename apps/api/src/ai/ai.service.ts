import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

import {
  ConfigService,
} from "@nestjs/config";

import {
  AiProviderError,
  createAiProvider,
} from "@aimers/ai";

import type {
  AiGenerateTextRequest,
  AiGenerateTextResult,
  AiProviderName,
  AiTextProvider,
} from "@aimers/ai";

import type {
  Environment,
} from "../config/environment";

@Injectable()
export class AiService {
  private readonly provider:
    AiTextProvider;

  private readonly maximumOutputTokens:
    number;

  constructor(
    private readonly config:
      ConfigService<
        Environment,
        true
      >,
  ) {
    const provider =
      this.config
        .getOrThrow<AiProviderName>(
          "AI_PROVIDER",
        );

    this.maximumOutputTokens =
      this.config
        .getOrThrow<number>(
          "AI_MAX_OUTPUT_TOKENS",
        );

    this.provider =
      createAiProvider({
        provider,

        model:
          this.config
            .getOrThrow<string>(
              "AI_MODEL",
            ),

        timeoutMs:
          this.config
            .getOrThrow<number>(
              "AI_TIMEOUT_MS",
            ),

        maxOutputTokens:
          this.maximumOutputTokens,

        openAiBaseUrl:
          this.config
            .getOrThrow<string>(
              "OPENAI_BASE_URL",
            ),

        openAiApiKey:
          this.config
            .get<string>(
              "OPENAI_API_KEY",
            ),
      });
  }

  getProviderName():
    AiProviderName {
    return this.provider.name;
  }

  async generateText(
    request: AiGenerateTextRequest,
  ): Promise<AiGenerateTextResult> {
    try {
      return await this.provider
        .generateText({
          ...request,

          maxOutputTokens:
            request.maxOutputTokens ??
            this.maximumOutputTokens,
        });
    } catch (error) {
      if (!(error instanceof AiProviderError)) {
        throw new BadGatewayException(
          "Research AI could not generate a response.",
        );
      }

      switch (error.code) {
        case "configuration":
        case "authentication":
          throw new ServiceUnavailableException(
            "Research AI provider configuration is unavailable.",
          );

        case "timeout":
          throw new GatewayTimeoutException(
            "Research AI took too long to respond. Try again.",
          );

        case "rate_limit":
          throw new ServiceUnavailableException(
            "Research AI is temporarily busy. Try again shortly.",
          );

        default:
          throw new BadGatewayException(
            error.retryable
              ? "Research AI is temporarily unavailable. Try again."
              : "Research AI returned an invalid response.",
          );
      }
    }
  }
}
