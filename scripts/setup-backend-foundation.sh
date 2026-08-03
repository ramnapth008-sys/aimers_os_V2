#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS backend foundation..."

mkdir -p \
  apps/api/src/config \
  apps/api/src/health \
  apps/api/src/infrastructure/database \
  apps/api/src/infrastructure/redis \
  infra/docker

# ============================================================
# API PACKAGE
# ============================================================

cat > apps/api/package.json <<'EOF'
{
  "name": "@aimers/api",
  "version": "0.0.0",
  "private": true,
  "description": "AIMERS OS application API",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "start": "node dist/main.js",
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  }
}
EOF

# ============================================================
# TYPESCRIPT CONFIGURATION
# ============================================================

cat > apps/api/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Bundler",

    "rootDir": "./src",
    "outDir": "./dist",

    "noEmit": false,
    "sourceMap": true,
    "declaration": false,

    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    "strict": true,

    "types": [
      "node"
    ]
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "src/**/*.test.ts",
    "src/**/*.spec.ts"
  ]
}
EOF

cat > apps/api/tsconfig.build.json <<'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false
  },
  "exclude": [
    "node_modules",
    "dist",
    "src/**/*.test.ts",
    "src/**/*.spec.ts"
  ]
}
EOF

# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

cat > apps/api/.env.example <<'EOF'
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://aimers:aimers_dev_password@localhost:5433/aimers_os?schema=public

REDIS_URL=redis://:aimers_redis_dev_password@localhost:6380

CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178
EOF

if [[ ! -f apps/api/.env ]]; then
  cp apps/api/.env.example apps/api/.env
  echo "Created apps/api/.env"
else
  echo "Existing apps/api/.env preserved"
fi

python3 - <<'PY'
from pathlib import Path

gitignore = Path(".gitignore")

existing = (
    gitignore.read_text()
    if gitignore.exists()
    else ""
)

rules = """
# AIMERS local environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
apps/*/.env
!**/.env.example
"""

if "apps/*/.env" not in existing:
    with gitignore.open("a") as file:
        file.write(rules)
PY

cat > apps/api/src/config/environment.ts <<'EOF'
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
EOF

# ============================================================
# POSTGRESQL SERVICE
# ============================================================

cat > apps/api/src/infrastructure/database/database.service.ts <<'EOF'
import {
  Injectable,
  type OnModuleDestroy,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { Pool } from "pg";

@Injectable()
export class DatabaseService
  implements OnModuleDestroy
{
  private readonly pool: Pool;

  constructor(
    configService: ConfigService,
  ) {
    this.pool = new Pool({
      connectionString:
        configService.getOrThrow<string>(
          "DATABASE_URL",
        ),

      max: 5,

      connectionTimeoutMillis: 3000,

      idleTimeoutMillis: 10000,
    });
  }

  async ping(): Promise<boolean> {
    const result =
      await this.pool.query<{
        ok: number;
      }>(
        "SELECT 1::int AS ok",
      );

    return result.rows[0]?.ok === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
EOF

cat > apps/api/src/infrastructure/database/database.module.ts <<'EOF'
import {
  Global,
  Module,
} from "@nestjs/common";

import { DatabaseService } from "./database.service";

@Global()
@Module({
  providers: [
    DatabaseService,
  ],

  exports: [
    DatabaseService,
  ],
})
export class DatabaseModule {}
EOF

# ============================================================
# REDIS SERVICE
# ============================================================

cat > apps/api/src/infrastructure/redis/redis.service.ts <<'EOF'
import {
  Injectable,
  type OnModuleDestroy,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import Redis from "ioredis";

@Injectable()
export class RedisService
  implements OnModuleDestroy
{
  private readonly client: Redis;

  constructor(
    configService: ConfigService,
  ) {
    this.client = new Redis(
      configService.getOrThrow<string>(
        "REDIS_URL",
      ),
      {
        lazyConnect: true,
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      },
    );
  }

  async ping(): Promise<boolean> {
    if (
      this.client.status === "wait"
    ) {
      await this.client.connect();
    }

    const response =
      await this.client.ping();

    return response === "PONG";
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }
}
EOF

cat > apps/api/src/infrastructure/redis/redis.module.ts <<'EOF'
import {
  Global,
  Module,
} from "@nestjs/common";

import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    RedisService,
  ],

  exports: [
    RedisService,
  ],
})
export class RedisModule {}
EOF

# ============================================================
# HEALTH SERVICE
# ============================================================

cat > apps/api/src/health/health.controller.ts <<'EOF'
import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";

import { DatabaseService } from "../infrastructure/database/database.service";
import { RedisService } from "../infrastructure/redis/redis.service";

interface DependencyResult {
  status: "up" | "down";
  latencyMs: number;
  error?: string;
}

@Controller("health")
export class HealthController {
  constructor(
    private readonly database:
      DatabaseService,

    private readonly redis:
      RedisService,
  ) {}

  @Get("live")
  getLiveness() {
    return {
      status: "ok",
      service: "aimers-api",
      timestamp:
        new Date().toISOString(),
      uptimeSeconds:
        Math.floor(process.uptime()),
    };
  }

  @Get()
  async getHealth() {
    return this.getReadiness();
  }

  @Get("ready")
  async getReadiness() {
    const [
      database,
      redis,
    ] = await Promise.all([
      this.runCheck(() =>
        this.database.ping(),
      ),

      this.runCheck(() =>
        this.redis.ping(),
      ),
    ]);

    const healthy =
      database.status === "up" &&
      redis.status === "up";

    const response = {
      status:
        healthy
          ? "ok"
          : "error",

      service: "aimers-api",

      timestamp:
        new Date().toISOString(),

      uptimeSeconds:
        Math.floor(process.uptime()),

      checks: {
        database,
        redis,
      },
    };

    if (!healthy) {
      throw new ServiceUnavailableException(
        response,
      );
    }

    return response;
  }

  private async runCheck(
    check: () => Promise<boolean>,
  ): Promise<DependencyResult> {
    const startedAt =
      performance.now();

    try {
      const successful =
        await check();

      return {
        status:
          successful
            ? "up"
            : "down",

        latencyMs:
          Math.round(
            performance.now() -
              startedAt,
          ),
      };
    } catch (error) {
      return {
        status: "down",

        latencyMs:
          Math.round(
            performance.now() -
              startedAt,
          ),

        error:
          error instanceof Error
            ? error.message
            : "Unknown dependency error",
      };
    }
  }
}
EOF

# ============================================================
# ROOT CONTROLLER AND MODULE
# ============================================================

cat > apps/api/src/app.controller.ts <<'EOF'
import {
  Controller,
  Get,
} from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getApiInformation() {
    return {
      name: "AIMERS OS API",
      version: "0.1.0",
      status: "running",

      endpoints: {
        health:
          "/api/v1/health",

        liveness:
          "/api/v1/health/live",

        readiness:
          "/api/v1/health/ready",
      },
    };
  }
}
EOF

cat > apps/api/src/app.module.ts <<'EOF'
import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";

import { validateEnvironment } from "./config/environment";

import { HealthController } from "./health/health.controller";

import { DatabaseModule } from "./infrastructure/database/database.module";

import { RedisModule } from "./infrastructure/redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate:
        validateEnvironment,
    }),

    DatabaseModule,

    RedisModule,
  ],

  controllers: [
    AppController,
    HealthController,
  ],
})
export class AppModule {}
EOF

# ============================================================
# API BOOTSTRAP
# ============================================================

cat > apps/api/src/main.ts <<'EOF'
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
EOF

# ============================================================
# DOCKER DEVELOPMENT INFRASTRUCTURE
# ============================================================

cat > infra/docker/docker-compose.dev.yml <<'EOF'
name: aimers-os-v2-dev

services:
  postgres:
    image: postgres:17-alpine
    container_name: aimers-postgres-dev
    restart: unless-stopped

    environment:
      POSTGRES_USER: aimers
      POSTGRES_PASSWORD: aimers_dev_password
      POSTGRES_DB: aimers_os

    ports:
      - "5433:5432"

    volumes:
      - aimers_postgres_data:/var/lib/postgresql/data

    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U aimers -d aimers_os"
        ]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  redis:
    image: redis:7.4-alpine
    container_name: aimers-redis-dev
    restart: unless-stopped

    command:
      [
        "redis-server",
        "--appendonly",
        "yes",
        "--requirepass",
        "aimers_redis_dev_password"
      ]

    ports:
      - "6380:6379"

    volumes:
      - aimers_redis_data:/data

    healthcheck:
      test:
        [
          "CMD",
          "redis-cli",
          "-a",
          "aimers_redis_dev_password",
          "ping"
        ]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s

volumes:
  aimers_postgres_data:
  aimers_redis_data:
EOF

echo "Backend foundation files created successfully."
