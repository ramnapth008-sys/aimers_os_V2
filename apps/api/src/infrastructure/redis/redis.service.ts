import {
  Inject,
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
    @Inject(ConfigService)
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
