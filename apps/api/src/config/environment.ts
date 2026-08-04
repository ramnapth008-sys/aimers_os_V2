import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(4000),

  DATABASE_URL: z
    .string()
    .regex(
      /^postgres(?:ql)?:\/\//,
      "DATABASE_URL must be a PostgreSQL URL.",
    ),

  REDIS_URL: z
    .string()
    .regex(
      /^rediss?:\/\//,
      "REDIS_URL must be a Redis URL.",
    ),

  CORS_ORIGINS: z
    .string()
    .min(1),

  ACCESS_TOKEN_SECRET: z
    .string()
    .min(
      64,
      "ACCESS_TOKEN_SECRET must contain at least 64 characters.",
    ),

  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86400)
    .default(900),

  REFRESH_TOKEN_TTL_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30),

  REFRESH_COOKIE_NAME: z
    .string()
    .min(1)
    .default("aimers_refresh_token"),

  COOKIE_SECURE: booleanString,

  AI_PROVIDER: z
    .enum([
      "mock",
      "openai",
    ])
    .default("mock"),

  AI_MODEL: z
    .string()
    .trim()
    .min(1)
    .default("gpt-5-mini"),

  AI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(120000)
    .default(45000),

  AI_MAX_OUTPUT_TOKENS: z.coerce
    .number()
    .int()
    .min(64)
    .max(8192)
    .default(1200),

  OPENAI_BASE_URL: z
    .string()
    .url()
    .default(
      "https://api.openai.com/v1",
    ),

  OPENAI_API_KEY: z
    .string()
    .trim()
    .optional(),
}).superRefine(
  (
    value,
    context,
  ) => {
    if (
      value.AI_PROVIDER === "openai" &&
      !value.OPENAI_API_KEY
    ) {
      context.addIssue({
        code: "custom",
        path: [
          "OPENAI_API_KEY",
        ],
        message:
          "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
      });
    }
  },
);

export type Environment =
  z.infer<typeof environmentSchema>;

export function validateEnvironment(
  configuration: Record<string, unknown>,
): Environment {
  const result =
    environmentSchema.safeParse(
      configuration,
    );

  if (!result.success) {
    console.error(
      "Invalid API environment configuration:",
    );

    console.error(
      result.error.flatten().fieldErrors,
    );

    throw new Error(
      "API environment validation failed.",
    );
  }

  return result.data;
}
