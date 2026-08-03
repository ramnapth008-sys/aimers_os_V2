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
