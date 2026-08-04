export type AiProviderErrorCode =
  | "configuration"
  | "timeout"
  | "rate_limit"
  | "authentication"
  | "provider_error"
  | "invalid_response";

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode;
  readonly statusCode: number | null;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      code: AiProviderErrorCode;
      statusCode?: number | null;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "AiProviderError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? null;
    this.retryable = options.retryable ?? false;

    if (options.cause !== undefined) {
      Object.defineProperty(
        this,
        "cause",
        {
          configurable: true,
          enumerable: false,
          value: options.cause,
          writable: true,
        },
      );
    }
  }
}
