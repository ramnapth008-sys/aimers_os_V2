import {
  Module,
} from "@nestjs/common";

import {
  ConfigModule,
} from "@nestjs/config";

import {
  AppController,
} from "./app.controller";

import {
  AuthModule,
} from "./auth/auth.module";

import {
  validateEnvironment,
} from "./config/environment";

import {
  HealthController,
} from "./health/health.controller";

import {
  DatabaseModule,
} from "./infrastructure/database/database.module";

import {
  RedisModule,
} from "./infrastructure/redis/redis.module";

import {
  OnboardingModule,
} from "./onboarding/onboarding.module";

import {
  ProfileModule,
} from "./profile/profile.module";

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
    AuthModule,
    ProfileModule,
    OnboardingModule,
  ],

  controllers: [
    AppController,
    HealthController,
  ],
})
export class AppModule {}
