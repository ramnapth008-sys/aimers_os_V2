import "reflect-metadata";

import {
  ValidationPipe,
} from "@nestjs/common";

import {
  ConfigService,
} from "@nestjs/config";

import {
  NestFactory,
} from "@nestjs/core";

import cookieParser from "cookie-parser";

import {
  AppModule,
} from "./app.module";

async function bootstrap():
  Promise<void> {
  const app =
    await NestFactory.create(
      AppModule,
    );

  const configService =
    app.get(
      ConfigService,
    );

  const port =
    configService
      .getOrThrow<number>(
        "PORT",
      );

  const corsOrigins =
    configService
      .getOrThrow<string>(
        "CORS_ORIGINS",
      )
      .split(",")
      .map(
        (origin) =>
          origin.trim(),
      )
      .filter(Boolean);

  app.setGlobalPrefix(
    "api/v1",
  );

  app.use(
    cookieParser(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,

      forbidNonWhitelisted:
        true,

      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.enableCors({
    origin:
      corsOrigins,

    credentials:
      true,
  });

  const express =
    app
      .getHttpAdapter()
      .getInstance();

  express.disable(
    "x-powered-by",
  );

  app.enableShutdownHooks();

  await app.listen(
    port,
    "0.0.0.0",
  );

  console.log(
    `AIMERS API running at http://localhost:${port}/api/v1`,
  );
}

bootstrap().catch(
  (error: unknown) => {
    console.error(
      "AIMERS API failed to start:",
      error,
    );

    process.exitCode = 1;
  },
);
