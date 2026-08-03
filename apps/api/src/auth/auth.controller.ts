import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import {
  UserRole,
} from "@aimers/database";

import type {
  CookieOptions,
  Request,
  Response,
} from "express";

import {
  AuthService,
} from "./auth.service";

import {
  CurrentUser,
} from "./decorators/current-user.decorator";

import {
  Public,
} from "./decorators/public.decorator";

import {
  Roles,
} from "./decorators/roles.decorator";

import {
  LoginDto,
} from "./dto/login.dto";

import {
  RegisterDto,
} from "./dto/register.dto";

import type {
  AuthenticatedUser,
  SessionMetadata,
} from "./auth.types";

type CookieRequest =
  Request & {
    cookies?: Record<
      string,
      string | undefined
    >;
  };

@Controller("auth")
export class AuthController {
  private readonly cookieName:
    string;

  private readonly cookieSecure:
    boolean;

  private readonly refreshTtlDays:
    number;

  constructor(
    @Inject(AuthService)
    private readonly authService:
      AuthService,

    @Inject(ConfigService)
    configService:
      ConfigService,
  ) {
    this.cookieName =
      configService
        .getOrThrow<string>(
          "REFRESH_COOKIE_NAME",
        );

    this.cookieSecure =
      configService
        .getOrThrow<boolean>(
          "COOKIE_SECURE",
        );

    this.refreshTtlDays =
      configService
        .getOrThrow<number>(
          "REFRESH_TOKEN_TTL_DAYS",
        );
  }

  @Public()
  @Post("register")
  async register(
    @Body()
    dto: RegisterDto,

    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const result =
      await this.authService
        .register(
          dto,
          this.getMetadata(
            request,
          ),
        );

    return this.writeSession(
      response,
      result,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @Body()
    dto: LoginDto,

    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const result =
      await this.authService
        .login(
          dto,
          this.getMetadata(
            request,
          ),
        );

    return this.writeSession(
      response,
      result,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(
    @Req()
    request: CookieRequest,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const refreshToken =
      request.cookies?.[
        this.cookieName
      ];

    if (!refreshToken) {
      throw new UnauthorizedException(
        "A refresh session cookie is required.",
      );
    }

    const result =
      await this.authService
        .refresh(
          refreshToken,
          this.getMetadata(
            request,
          ),
        );

    return this.writeSession(
      response,
      result,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  async logout(
    @Req()
    request: CookieRequest,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    await this.authService
      .logout(
        request.cookies?.[
          this.cookieName
        ],
      );

    response.clearCookie(
      this.cookieName,
      this.baseCookieOptions(),
    );

    return {
      success: true,
      message:
        "The session was logged out.",
    };
  }

  @Get("me")
  async getCurrentUser(
    @CurrentUser()
    user:
      AuthenticatedUser,
  ) {
    return this.authService
      .getCurrentUser(
        user.userId,
      );
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get("admin-check")
  adminCheck(
    @CurrentUser()
    user:
      AuthenticatedUser,
  ) {
    return {
      success: true,
      message:
        "The account has administrative access.",
      user,
    };
  }

  private writeSession(
    response: Response,
    result: Awaited<
      ReturnType<
        AuthService["login"]
      >
    >,
  ) {
    response.cookie(
      this.cookieName,
      result.refreshToken,
      {
        ...this.baseCookieOptions(),

        maxAge:
          this.refreshTtlDays *
          24 *
          60 *
          60 *
          1000,
      },
    );

    const {
      refreshToken:
        _refreshToken,
      ...publicResult
    } = result;

    return publicResult;
  }

  private baseCookieOptions():
    CookieOptions {
    return {
      httpOnly: true,
      secure:
        this.cookieSecure,
      sameSite: "lax",
      path:
        "/api/v1/auth",
    };
  }

  private getMetadata(
    request: Request,
  ): SessionMetadata {
    return {
      ipAddress:
        request.ip,

      userAgent:
        request.get(
          "user-agent",
        ),
    };
  }
}
