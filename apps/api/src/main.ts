import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { ConfigService } from "@nestjs/config";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.create(
      AppModule,
    );

  const configService =
    app.get(ConfigService);

  const port =
    configService.getOrThrow<number>(
      "PORT",
    );

  const corsOrigins =
    configService
      .getOrThrow<string>(
        "CORS_ORIGINS",
      )
      .split(",")
      .map((origin) =>
        origin.trim(),
      )
      .filter(Boolean);

  app.setGlobalPrefix(
    "api/v1",
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(
    port,
    "0.0.0.0",
  );

  console.log(
    `AIMERS API running at http://localhost:${port}/api/v1`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error(
    "AIMERS API failed to start:",
    error,
  );

  process.exitCode = 1;
});
