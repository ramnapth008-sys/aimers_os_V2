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
