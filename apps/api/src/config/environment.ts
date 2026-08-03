import { z } from "zod";

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
});

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
