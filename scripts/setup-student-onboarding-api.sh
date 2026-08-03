#!/usr/bin/env bash

set -euo pipefail

echo "Creating student onboarding and profile APIs..."

mkdir -p \
  apps/api/src/onboarding/dto \
  apps/api/src/profile/dto

# ============================================================
# PROFILE DTO
# ============================================================

cat > apps/api/src/profile/dto/update-profile.dto.ts <<'EOF'
import {
  Transform,
} from "class-transformer";

import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName?: string;

  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @Matches(
    /^[0-9+()\-\s]{7,30}$/,
    {
      message:
        "phoneNumber must be a valid phone number.",
    },
  )
  phoneNumber?: string;
}
EOF

# ============================================================
# PROFILE SERVICE
# ============================================================

cat > apps/api/src/profile/profile.service.ts <<'EOF'
import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  UpdateProfileDto,
} from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  async getProfile(
    userId: string,
  ) {
    const user =
      await this.database.user
        .findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            phoneNumber: true,
            avatarUrl: true,
            status: true,
            emailVerifiedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,

            globalRoles: {
              select: {
                role: true,
              },
            },

            organizationMemberships: {
              select: {
                organizationId: true,
                role: true,
                status: true,
                joinedAt: true,

                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                    status: true,
                  },
                },
              },
            },

            studentProfiles: {
              select: {
                id: true,
                admissionNumber: true,
                examTarget: true,
                targetYear: true,
                dateOfBirth: true,
                status: true,
                createdAt: true,
                updatedAt: true,

                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                  },
                },
              },
            },

            staffProfiles: {
              select: {
                id: true,
                employeeCode: true,
                jobTitle: true,
                department: true,

                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                  },
                },
              },
            },
          },
        });

    if (!user) {
      throw new NotFoundException(
        "The user profile was not found.",
      );
    }

    const roles = [
      ...new Set([
        ...user.globalRoles.map(
          ({ role }) => role,
        ),

        ...user
          .organizationMemberships
          .map(({ role }) => role),
      ]),
    ];

    return {
      ...user,
      roles,
      globalRoles: undefined,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const existingUser =
      await this.database.user
        .findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
          },
        });

    if (!existingUser) {
      throw new NotFoundException(
        "The user profile was not found.",
      );
    }

    await this.database.user.update({
      where: {
        id: userId,
      },

      data: {
        ...(dto.firstName !== undefined
          ? {
              firstName:
                dto.firstName.trim(),
            }
          : {}),

        ...(dto.lastName !== undefined
          ? {
              lastName:
                dto.lastName.trim() ||
                null,
            }
          : {}),

        ...(dto.displayName !== undefined
          ? {
              displayName:
                dto.displayName.trim(),
            }
          : {}),

        ...(dto.phoneNumber !== undefined
          ? {
              phoneNumber:
                dto.phoneNumber.trim(),
            }
          : {}),
      },
    });

    return this.getProfile(
      userId,
    );
  }
}
EOF

# ============================================================
# PROFILE CONTROLLER
# ============================================================

cat > apps/api/src/profile/profile.controller.ts <<'EOF'
import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
} from "@nestjs/common";

import type {
  AuthenticatedUser,
} from "../auth/auth.types";

import {
  CurrentUser,
} from "../auth/decorators/current-user.decorator";

import {
  UpdateProfileDto,
} from "./dto/update-profile.dto";

import {
  ProfileService,
} from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(
    @Inject(ProfileService)
    private readonly profileService:
      ProfileService,
  ) {}

  @Get("me")
  getProfile(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.profileService
      .getProfile(
        user.userId,
      );
  }

  @Patch("me")
  updateProfile(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: UpdateProfileDto,
  ) {
    return this.profileService
      .updateProfile(
        user.userId,
        dto,
      );
  }
}
EOF

cat > apps/api/src/profile/profile.module.ts <<'EOF'
import {
  Module,
} from "@nestjs/common";

import {
  ProfileController,
} from "./profile.controller";

import {
  ProfileService,
} from "./profile.service";

@Module({
  controllers: [
    ProfileController,
  ],

  providers: [
    ProfileService,
  ],

  exports: [
    ProfileService,
  ],
})
export class ProfileModule {}
EOF

# ============================================================
# STUDENT ONBOARDING DTO
# ============================================================

cat > apps/api/src/onboarding/dto/student-onboarding.dto.ts <<'EOF'
import {
  Transform,
} from "class-transformer";

import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class StudentOnboardingDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim().toUpperCase()
      : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  examTarget!: string;

  @IsInt()
  @Min(2026)
  @Max(2100)
  targetYear!: number;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
EOF

# ============================================================
# ONBOARDING SERVICE
# ============================================================

cat > apps/api/src/onboarding/onboarding.service.ts <<'EOF'
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import {
  MembershipStatus,
  StudentStatus,
  UserRole,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  StudentOnboardingDto,
} from "./dto/student-onboarding.dto";

@Injectable()
export class OnboardingService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  async getStudentStatus(
    userId: string,
  ) {
    const profile =
      await this.database
        .studentProfile
        .findFirst({
          where: {
            userId,
            status:
              StudentStatus.ACTIVE,
          },

          select: {
            id: true,
            examTarget: true,
            targetYear: true,
            dateOfBirth: true,
            status: true,
            createdAt: true,
            updatedAt: true,

            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        });

    return {
      completed:
        Boolean(
          profile?.examTarget &&
          profile.targetYear,
        ),

      profile,
    };
  }

  async completeStudentOnboarding(
    userId: string,
    dto: StudentOnboardingDto,
  ) {
    const platform =
      await this.database
        .organization
        .findUnique({
          where: {
            slug:
              "aimers-platform",
          },

          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        });

    if (!platform) {
      throw new InternalServerErrorException(
        "The AIMERS platform organisation is unavailable.",
      );
    }

    const dateOfBirth =
      dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : null;

    const result =
      await this.database
        .$transaction(
          async (transaction) => {
            const membership =
              await transaction
                .organizationMembership
                .upsert({
                  where: {
                    userId_organizationId_role: {
                      userId,
                      organizationId:
                        platform.id,
                      role:
                        UserRole.STUDENT,
                    },
                  },

                  update: {
                    status:
                      MembershipStatus.ACTIVE,

                    joinedAt:
                      new Date(),
                  },

                  create: {
                    userId,
                    organizationId:
                      platform.id,
                    role:
                      UserRole.STUDENT,
                    status:
                      MembershipStatus.ACTIVE,
                    joinedAt:
                      new Date(),
                  },
                });

            const studentProfile =
              await transaction
                .studentProfile
                .upsert({
                  where: {
                    userId_organizationId: {
                      userId,
                      organizationId:
                        platform.id,
                    },
                  },

                  update: {
                    examTarget:
                      dto.examTarget,
                    targetYear:
                      dto.targetYear,
                    dateOfBirth,
                    status:
                      StudentStatus.ACTIVE,
                  },

                  create: {
                    userId,
                    organizationId:
                      platform.id,
                    examTarget:
                      dto.examTarget,
                    targetYear:
                      dto.targetYear,
                    dateOfBirth,
                    status:
                      StudentStatus.ACTIVE,
                  },
                });

            return {
              membership,
              studentProfile,
            };
          },
        );

    return {
      success: true,

      message:
        "Student onboarding was completed.",

      organization:
        platform,

      profile:
        result.studentProfile,

      membership: {
        role:
          result.membership.role,
        status:
          result.membership.status,
        joinedAt:
          result.membership.joinedAt,
      },
    };
  }
}
EOF

# ============================================================
# ONBOARDING CONTROLLER
# ============================================================

cat > apps/api/src/onboarding/onboarding.controller.ts <<'EOF'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
} from "@nestjs/common";

import {
  UserRole,
} from "@aimers/database";

import type {
  AuthenticatedUser,
} from "../auth/auth.types";

import {
  CurrentUser,
} from "../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../auth/decorators/roles.decorator";

import {
  StudentOnboardingDto,
} from "./dto/student-onboarding.dto";

import {
  OnboardingService,
} from "./onboarding.service";

@Roles(UserRole.STUDENT)
@Controller("onboarding")
export class OnboardingController {
  constructor(
    @Inject(OnboardingService)
    private readonly onboardingService:
      OnboardingService,
  ) {}

  @Get("status")
  getStatus(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.onboardingService
      .getStudentStatus(
        user.userId,
      );
  }

  @Post("student")
  completeStudentOnboarding(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: StudentOnboardingDto,
  ) {
    return this.onboardingService
      .completeStudentOnboarding(
        user.userId,
        dto,
      );
  }
}
EOF

cat > apps/api/src/onboarding/onboarding.module.ts <<'EOF'
import {
  Module,
} from "@nestjs/common";

import {
  OnboardingController,
} from "./onboarding.controller";

import {
  OnboardingService,
} from "./onboarding.service";

@Module({
  controllers: [
    OnboardingController,
  ],

  providers: [
    OnboardingService,
  ],

  exports: [
    OnboardingService,
  ],
})
export class OnboardingModule {}
EOF

# ============================================================
# ROOT APPLICATION MODULE
# ============================================================

cat > apps/api/src/app.module.ts <<'EOF'
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
EOF

echo "Student onboarding and profile APIs created."
