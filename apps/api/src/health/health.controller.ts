import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";

import {
  Public,
} from "../auth/decorators/public.decorator";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import {
  RedisService,
} from "../infrastructure/redis/redis.service";

interface DependencyResult {
  status: "up" | "down";
  latencyMs: number;
  error?: string;
}

@Public()
@Controller("health")
export class HealthController {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(RedisService)
    private readonly redis:
      RedisService,
  ) {}

  @Get("live")
  getLiveness() {
    return {
      status: "ok",
      service:
        "aimers-api",
      timestamp:
        new Date().toISOString(),
      uptimeSeconds:
        Math.floor(
          process.uptime(),
        ),
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
    ] =
      await Promise.all([
        this.runCheck(
          () =>
            this.database.ping(),
        ),

        this.runCheck(
          () =>
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

      service:
        "aimers-api",

      timestamp:
        new Date().toISOString(),

      uptimeSeconds:
        Math.floor(
          process.uptime(),
        ),

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
    check:
      () => Promise<boolean>,
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
        status:
          "down",

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
