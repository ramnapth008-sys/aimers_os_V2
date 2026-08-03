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
