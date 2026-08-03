import {
  Inject,
  Injectable,
  type OnModuleDestroy,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { PrismaClient } from "@aimers/database";

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleDestroy
{
  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    super({
      datasources: {
        db: {
          url:
            configService.getOrThrow<string>(
              "DATABASE_URL",
            ),
        },
      },
    });
  }

  async ping(): Promise<boolean> {
    const result =
      await this.$queryRaw<
        Array<{
          ok: number;
        }>
      >`
        SELECT 1::int AS ok
      `;

    return result[0]?.ok === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
