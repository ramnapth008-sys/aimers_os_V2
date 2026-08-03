import {
  Inject,
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
    @Inject(ConfigService)
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
