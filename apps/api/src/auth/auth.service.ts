import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { JwtService } from "@nestjs/jwt";

import {
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
