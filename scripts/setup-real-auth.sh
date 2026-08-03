#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS authentication foundation..."

mkdir -p \
  apps/api/src/auth/decorators \
  apps/api/src/auth/dto \
  apps/api/src/auth/guards

# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

python3 - <<'PY'
from pathlib import Path
import secrets


def upsert(path: Path, key: str, value: str, overwrite: bool) -> None:
    lines = path.read_text().splitlines() if path.exists() else []
    prefix = f"{key}="
    found = False

    for index, line in enumerate(lines):
        if line.startswith(prefix):
            found = True
            current = line[len(prefix):].strip()

            if overwrite or not current:
                lines[index] = f"{key}={value}"

            break

    if not found:
        if lines and lines[-1] != "":
            lines.append("")

        lines.append(f"{key}={value}")

    path.write_text("\n".join(lines).rstrip() + "\n")


example = Path("apps/api/.env.example")

example_values = {
    "ACCESS_TOKEN_SECRET":
        "replace_this_with_a_random_secret_that_is_at_least_64_characters_long_before_deploying",
    "ACCESS_TOKEN_TTL_SECONDS": "900",
    "REFRESH_TOKEN_TTL_DAYS": "30",
    "REFRESH_COOKIE_NAME": "aimers_refresh_token",
    "COOKIE_SECURE": "false",
}

for key, value in example_values.items():
    upsert(example, key, value, overwrite=True)


local = Path("apps/api/.env")

local_values = {
    "ACCESS_TOKEN_SECRET": secrets.token_urlsafe(64),
    "ACCESS_TOKEN_TTL_SECONDS": "900",
    "REFRESH_TOKEN_TTL_DAYS": "30",
    "REFRESH_COOKIE_NAME": "aimers_refresh_token",
    "COOKIE_SECURE": "false",
}

for key, value in local_values.items():
    upsert(local, key, value, overwrite=False)

print("Authentication environment variables configured.")
print("The local access-token secret was not printed.")
PY

# ============================================================
# ENVIRONMENT VALIDATION
# ============================================================

cat > apps/api/src/config/environment.ts <<'EOF'
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

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

  ACCESS_TOKEN_SECRET: z
    .string()
    .min(
      64,
      "ACCESS_TOKEN_SECRET must contain at least 64 characters.",
    ),

  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86400)
    .default(900),

  REFRESH_TOKEN_TTL_DAYS: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30),

  REFRESH_COOKIE_NAME: z
    .string()
    .min(1)
    .default("aimers_refresh_token"),

  COOKIE_SECURE: booleanString,
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
# AUTH TYPES
# ============================================================

cat > apps/api/src/auth/auth.types.ts <<'EOF'
import { UserRole } from "@aimers/database";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  type: "access";
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: UserRole[];
}

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}
EOF

# ============================================================
# DTO VALIDATION
# ============================================================

cat > apps/api/src/auth/dto/register.dto.ts <<'EOF'
import { Transform } from "class-transformer";

import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim().toLowerCase()
      : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
EOF

cat > apps/api/src/auth/dto/login.dto.ts <<'EOF'
import { Transform } from "class-transformer";

import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim().toLowerCase()
      : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
EOF

# ============================================================
# AUTH DECORATORS
# ============================================================

cat > apps/api/src/auth/decorators/public.decorator.ts <<'EOF'
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY =
  "aimers:is-public";

export const Public = () =>
  SetMetadata(
    IS_PUBLIC_KEY,
    true,
  );
EOF

cat > apps/api/src/auth/decorators/roles.decorator.ts <<'EOF'
import { SetMetadata } from "@nestjs/common";

import { UserRole } from "@aimers/database";

export const ROLES_KEY =
  "aimers:required-roles";

export const Roles = (
  ...roles: UserRole[]
) =>
  SetMetadata(
    ROLES_KEY,
    roles,
  );
EOF

cat > apps/api/src/auth/decorators/current-user.decorator.ts <<'EOF'
import {
  createParamDecorator,
  type ExecutionContext,
} from "@nestjs/common";

import type { Request } from "express";

import type {
  AuthenticatedUser,
} from "../auth.types";

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

export const CurrentUser =
  createParamDecorator(
    (
      _data: unknown,
      context: ExecutionContext,
    ): AuthenticatedUser | undefined => {
      const request =
        context
          .switchToHttp()
          .getRequest<AuthenticatedRequest>();

      return request.user;
    },
  );
EOF

# ============================================================
# ACCESS-TOKEN GUARD
# ============================================================

cat > apps/api/src/auth/guards/access-token.guard.ts <<'EOF'
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import { JwtService } from "@nestjs/jwt";

import type { Request } from "express";

import {
  IS_PUBLIC_KEY,
} from "../decorators/public.decorator";

import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from "../auth.types";

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class AccessTokenGuard
  implements CanActivate
{
  constructor(
    @Inject(JwtService)
    private readonly jwtService:
      JwtService,

    @Inject(Reflector)
    private readonly reflector:
      Reflector,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic =
      this.reflector
        .getAllAndOverride<boolean>(
          IS_PUBLIC_KEY,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    if (isPublic) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const token =
      this.extractBearerToken(
        request,
      );

    if (!token) {
      throw new UnauthorizedException(
        "A valid access token is required.",
      );
    }

    try {
      const payload =
        await this.jwtService
          .verifyAsync<AccessTokenPayload>(
            token,
          );

      if (
        payload.type !== "access" ||
        !payload.sub ||
        !payload.email
      ) {
        throw new Error(
          "Invalid token payload.",
        );
      }

      request.user = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        "The access token is invalid or expired.",
      );
    }
  }

  private extractBearerToken(
    request: Request,
  ): string | undefined {
    const [
      type,
      token,
    ] =
      request.headers.authorization
        ?.split(" ") ?? [];

    return type === "Bearer"
      ? token
      : undefined;
  }
}
EOF

# ============================================================
# ROLE GUARD
# ============================================================

cat > apps/api/src/auth/guards/roles.guard.ts <<'EOF'
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import {
  UserRole,
} from "@aimers/database";

import type { Request } from "express";

import {
  ROLES_KEY,
} from "../decorators/roles.decorator";

import type {
  AuthenticatedUser,
} from "../auth.types";

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    @Inject(Reflector)
    private readonly reflector:
      Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector
        .getAllAndOverride<UserRole[]>(
          ROLES_KEY,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const user =
      request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (
      user.roles.includes(
        UserRole.SUPER_ADMIN,
      )
    ) {
      return true;
    }

    const allowed =
      requiredRoles.some(
        (role) =>
          user.roles.includes(role),
      );

    if (!allowed) {
      throw new ForbiddenException(
        "Your account does not have permission to access this route.",
      );
    }

    return true;
  }
}
EOF

# ============================================================
# AUTH SERVICE
# ============================================================

cat > apps/api/src/auth/auth.service.ts <<'EOF'
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { JwtService } from "@nestjs/jwt";

import {
  Algorithm,
  hash,
  verify,
} from "@node-rs/argon2";

import {
  createHash,
  randomBytes,
} from "node:crypto";

import {
  MembershipStatus,
  Prisma,
  SessionStatus,
  UserRole,
  UserStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  LoginDto,
} from "./dto/login.dto";

import type {
  RegisterDto,
} from "./dto/register.dto";

import type {
  SessionMetadata,
} from "./auth.types";

interface AuthUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;

  globalRoles: Array<{
    role: UserRole;
  }>;

  organizationMemberships: Array<{
    organizationId: string;
    role: UserRole;
    status: MembershipStatus;
  }>;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;

  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    displayName: string | null;
    status: UserStatus;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    roles: UserRole[];

    organizationMemberships:
      Array<{
        organizationId: string;
        role: UserRole;
        status: MembershipStatus;
      }>;
  };
}

const PASSWORD_HASH_OPTIONS = {
  algorithm:
    Algorithm.Argon2id,

  memoryCost:
    19 * 1024,

  timeCost:
    2,

  parallelism:
    1,

  outputLen:
    32,
} as const;

@Injectable()
export class AuthService {
  private readonly accessTokenTtl:
    number;

  private readonly refreshTokenTtlDays:
    number;

  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(JwtService)
    private readonly jwtService:
      JwtService,

    @Inject(ConfigService)
    configService:
      ConfigService,
  ) {
    this.accessTokenTtl =
      configService
        .getOrThrow<number>(
          "ACCESS_TOKEN_TTL_SECONDS",
        );

    this.refreshTokenTtlDays =
      configService
        .getOrThrow<number>(
          "REFRESH_TOKEN_TTL_DAYS",
        );
  }

  async register(
    dto: RegisterDto,
    metadata: SessionMetadata,
  ): Promise<AuthResult> {
    const email =
      dto.email
        .trim()
        .toLowerCase();

    const existingUser =
      await this.database.user
        .findUnique({
          where: {
            email,
          },

          select: {
            id: true,
          },
        });

    if (existingUser) {
      throw new ConflictException(
        "An account with this email already exists.",
      );
    }

    const passwordHash =
      await hash(
        dto.password,
        PASSWORD_HASH_OPTIONS,
      );

    try {
      const user =
        await this.database.user
          .create({
            data: {
              email,
              passwordHash,

              firstName:
                dto.firstName.trim(),

              lastName:
                dto.lastName?.trim() ||
                null,

              displayName:
                dto.firstName.trim(),

              status:
                UserStatus.ACTIVE,

              globalRoles: {
                create: {
                  role:
                    UserRole.STUDENT,
                },
              },
            },

            include: {
              globalRoles: {
                select: {
                  role: true,
                },
              },

              organizationMemberships: {
                where: {
                  status:
                    MembershipStatus.ACTIVE,
                },

                select: {
                  organizationId: true,
                  role: true,
                  status: true,
                },
              },
            },
          });

      return this.createSession(
        user,
        metadata,
      );
    } catch (error) {
      if (
        error instanceof
          Prisma
            .PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "An account with this email already exists.",
        );
      }

      throw error;
    }
  }

  async login(
    dto: LoginDto,
    metadata: SessionMetadata,
  ): Promise<AuthResult> {
    const email =
      dto.email
        .trim()
        .toLowerCase();

    const user =
      await this.database.user
        .findUnique({
          where: {
            email,
          },

          include: {
            globalRoles: {
              select: {
                role: true,
              },
            },

            organizationMemberships: {
              where: {
                status:
                  MembershipStatus.ACTIVE,
              },

              select: {
                organizationId: true,
                role: true,
                status: true,
              },
            },
          },
        });

    if (
      !user ||
      user.status !==
        UserStatus.ACTIVE ||
      !user.passwordHash
    ) {
      throw this.invalidCredentials();
    }

    let passwordMatches = false;

    try {
      passwordMatches =
        await verify(
          user.passwordHash,
          dto.password,
        );
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    await this.database.user.update({
      where: {
        id: user.id,
      },

      data: {
        lastLoginAt:
          new Date(),
      },
    });

    return this.createSession(
      user,
      metadata,
    );
  }

  async refresh(
    refreshToken: string,
    metadata: SessionMetadata,
  ): Promise<AuthResult> {
    const tokenHash =
      this.hashRefreshToken(
        refreshToken,
      );

    const session =
      await this.database.authSession
        .findUnique({
          where: {
            tokenHash,
          },

          include: {
            user: {
              include: {
                globalRoles: {
                  select: {
                    role: true,
                  },
                },

                organizationMemberships: {
                  where: {
                    status:
                      MembershipStatus.ACTIVE,
                  },

                  select: {
                    organizationId: true,
                    role: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

    const now =
      new Date();

    if (
      !session ||
      session.status !==
        SessionStatus.ACTIVE ||
      session.expiresAt <= now ||
      session.user.status !==
        UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        "The refresh session is invalid or expired.",
      );
    }

    const nextRefreshToken =
      this.generateRefreshToken();

    const nextTokenHash =
      this.hashRefreshToken(
        nextRefreshToken,
      );

    const nextExpiresAt =
      this.createRefreshExpiry();

    await this.database
      .$transaction(
        async (transaction) => {
          const revoked =
            await transaction
              .authSession
              .updateMany({
                where: {
                  id: session.id,

                  status:
                    SessionStatus.ACTIVE,

                  expiresAt: {
                    gt: now,
                  },
                },

                data: {
                  status:
                    SessionStatus.REVOKED,

                  revokedAt: now,
                },
              });

          if (revoked.count !== 1) {
            throw new UnauthorizedException(
              "This refresh session has already been used.",
            );
          }

          await transaction
            .authSession
            .create({
              data: {
                userId:
                  session.user.id,

                tokenHash:
                  nextTokenHash,

                status:
                  SessionStatus.ACTIVE,

                ipAddress:
                  this.cleanIpAddress(
                    metadata.ipAddress,
                  ),

                userAgent:
                  this.cleanUserAgent(
                    metadata.userAgent,
                  ),

                expiresAt:
                  nextExpiresAt,

                lastSeenAt:
                  now,
              },
            });
        },
      );

    const accessToken =
      await this.signAccessToken(
        session.user,
      );

    return {
      accessToken,
      refreshToken:
        nextRefreshToken,
      tokenType: "Bearer",
      expiresIn:
        this.accessTokenTtl,
      user:
        this.toPublicUser(
          session.user,
        ),
    };
  }

  async logout(
    refreshToken:
      string | undefined,
  ): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash =
      this.hashRefreshToken(
        refreshToken,
      );

    await this.database.authSession
      .updateMany({
        where: {
          tokenHash,

          status:
            SessionStatus.ACTIVE,
        },

        data: {
          status:
            SessionStatus.REVOKED,

          revokedAt:
            new Date(),
        },
      });
  }

  async getCurrentUser(
    userId: string,
  ) {
    const user =
      await this.database.user
        .findUnique({
          where: {
            id: userId,
          },

          include: {
            globalRoles: {
              select: {
                role: true,
              },
            },

            organizationMemberships: {
              where: {
                status:
                  MembershipStatus.ACTIVE,
              },

              select: {
                organizationId: true,
                role: true,
                status: true,
              },
            },
          },
        });

    if (
      !user ||
      user.status !==
        UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        "The authenticated user is unavailable.",
      );
    }

    return this.toPublicUser(
      user,
    );
  }

  private async createSession(
    user: AuthUserRecord,
    metadata: SessionMetadata,
  ): Promise<AuthResult> {
    const refreshToken =
      this.generateRefreshToken();

    await this.database.authSession
      .create({
        data: {
          userId:
            user.id,

          tokenHash:
            this.hashRefreshToken(
              refreshToken,
            ),

          status:
            SessionStatus.ACTIVE,

          ipAddress:
            this.cleanIpAddress(
              metadata.ipAddress,
            ),

          userAgent:
            this.cleanUserAgent(
              metadata.userAgent,
            ),

          expiresAt:
            this.createRefreshExpiry(),

          lastSeenAt:
            new Date(),
        },
      });

    const accessToken =
      await this.signAccessToken(
        user,
      );

    return {
      accessToken,
      refreshToken,
      tokenType:
        "Bearer",
      expiresIn:
        this.accessTokenTtl,
      user:
        this.toPublicUser(user),
    };
  }

  private async signAccessToken(
    user: AuthUserRecord,
  ): Promise<string> {
    return this.jwtService
      .signAsync({
        sub: user.id,
        email: user.email,
        roles:
          this.collectRoles(user),
        type: "access",
      });
  }

  private collectRoles(
    user: AuthUserRecord,
  ): UserRole[] {
    return [
      ...new Set([
        ...user.globalRoles.map(
          ({ role }) => role,
        ),

        ...user
          .organizationMemberships
          .map(
            ({ role }) => role,
          ),
      ]),
    ];
  }

  private toPublicUser(
    user: AuthUserRecord,
  ) {
    return {
      id: user.id,
      email: user.email,
      firstName:
        user.firstName,
      lastName:
        user.lastName,
      displayName:
        user.displayName,
      status:
        user.status,
      emailVerifiedAt:
        user.emailVerifiedAt,
      createdAt:
        user.createdAt,
      roles:
        this.collectRoles(user),

      organizationMemberships:
        user.organizationMemberships,
    };
  }

  private generateRefreshToken():
    string {
    return randomBytes(48)
      .toString("base64url");
  }

  private hashRefreshToken(
    token: string,
  ): string {
    return createHash("sha256")
      .update(token)
      .digest("hex");
  }

  private createRefreshExpiry():
    Date {
    const expiresAt =
      new Date();

    expiresAt.setDate(
      expiresAt.getDate() +
        this.refreshTokenTtlDays,
    );

    return expiresAt;
  }

  private cleanIpAddress(
    value: string | undefined,
  ): string | null {
    return value
      ? value.slice(0, 64)
      : null;
  }

  private cleanUserAgent(
    value: string | undefined,
  ): string | null {
    return value
      ? value.slice(0, 1000)
      : null;
  }

  private invalidCredentials():
    UnauthorizedException {
    return new UnauthorizedException(
      "The email or password is incorrect.",
    );
  }
}
EOF

# ============================================================
# AUTH CONTROLLER
# ============================================================

cat > apps/api/src/auth/auth.controller.ts <<'EOF'
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
EOF

# ============================================================
# AUTH MODULE
# ============================================================

cat > apps/api/src/auth/auth.module.ts <<'EOF'
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
EOF

# ============================================================
# PUBLIC ROOT CONTROLLER
# ============================================================

cat > apps/api/src/app.controller.ts <<'EOF'
import {
  Controller,
  Get,
} from "@nestjs/common";

import {
  Public,
} from "./auth/decorators/public.decorator";

@Controller()
export class AppController {
  @Public()
  @Get()
  getApiInformation() {
    return {
      name:
        "AIMERS OS API",

      version:
        "0.2.0",

      status:
        "running",

      endpoints: {
        health:
          "/api/v1/health",

        registration:
          "/api/v1/auth/register",

        login:
          "/api/v1/auth/login",

        refresh:
          "/api/v1/auth/refresh",

        logout:
          "/api/v1/auth/logout",

        currentUser:
          "/api/v1/auth/me",
      },
    };
  }
}
EOF

# ============================================================
# PUBLIC HEALTH CONTROLLER
# ============================================================

cat > apps/api/src/health/health.controller.ts <<'EOF'
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
EOF

# ============================================================
# ROOT APPLICATION MODULE
# ============================================================

cat > apps/api/src/app.module.ts <<'EOF'
import { Module } from "@nestjs/common";

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
EOF

echo "AIMERS OS authentication foundation created successfully."
