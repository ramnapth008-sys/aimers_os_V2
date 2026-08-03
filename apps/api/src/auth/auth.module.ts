import { Module } from "@nestjs/common";

import {
  ConfigModule,
  ConfigService,
} from "@nestjs/config";

import {
  APP_GUARD,
} from "@nestjs/core";

import {
  JwtModule,
} from "@nestjs/jwt";

import {
  AuthController,
} from "./auth.controller";

import {
  AuthService,
} from "./auth.service";

import {
  AccessTokenGuard,
} from "./guards/access-token.guard";

import {
  RolesGuard,
} from "./guards/roles.guard";

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      global: true,

      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService:
          ConfigService,
      ) => ({
        secret:
          configService
            .getOrThrow<string>(
              "ACCESS_TOKEN_SECRET",
            ),

        signOptions: {
          expiresIn:
            configService
              .getOrThrow<number>(
                "ACCESS_TOKEN_TTL_SECONDS",
              ),
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,

    {
      provide:
        APP_GUARD,

      useClass:
        AccessTokenGuard,
    },

    {
      provide:
        APP_GUARD,

      useClass:
        RolesGuard,
    },
  ],

  exports: [
    AuthService,
  ],
})
export class AuthModule {}
