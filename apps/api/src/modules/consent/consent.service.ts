import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  ConsentActorType,
  ConsentScope,
  ConsentStatus,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import type {
  GrantConsentDto,
} from "./dto/grant-consent.dto";

const SENSITIVE_MINOR_SCOPES =
  new Set<ConsentScope>([
    ConsentScope.APP_USAGE,
    ConsentScope.BROWSER_ACTIVITY,
    ConsentScope.BROWSER_HISTORY_IMPORT,
    ConsentScope.CROSS_DEVICE_SYNC,
    ConsentScope.BEHAVIOR_ANALYSIS,
    ConsentScope.AI_CONTEXT_SHARING,
  ]);

@Injectable()
export class ConsentService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  async resolveStudentProfile(
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
            dateOfBirth: true,
            organizationId: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        });

    if (!profile) {
      throw new NotFoundException(
        "An active student profile was not found.",
      );
    }

    return profile;
  }

  async list(
    userId: string,
  ) {
    const profile =
      await this.resolveStudentProfile(
        userId,
      );

    const grants =
      await this.database
        .consentGrant
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          orderBy: [
            {
              scope: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        });

    return {
      studentProfileId:
        profile.id,
      grants,
    };
  }

  async grant(
    userId: string,
    scope: ConsentScope,
    dto: GrantConsentDto,
  ) {
    const profile =
      await this.resolveStudentProfile(
        userId,
      );

    if (
      this.isMinor(
        profile.dateOfBirth,
      ) &&
      SENSITIVE_MINOR_SCOPES.has(
        scope,
      )
    ) {
      throw new ForbiddenException(
        "This monitoring permission requires the dedicated guardian and minor-safety flow.",
      );
    }

    const expiresAt =
      dto.expiresAt
        ? new Date(dto.expiresAt)
        : null;

    if (
      expiresAt &&
      expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        "Consent expiry must be in the future.",
      );
    }

    const now =
      new Date();

    const grant =
      await this.database
        .$transaction(
          async (transaction) => {
            await transaction
              .consentGrant
              .updateMany({
                where: {
                  studentProfileId:
                    profile.id,
                  scope,
                  status:
                    ConsentStatus.ACTIVE,
                },

                data: {
                  status:
                    ConsentStatus.REVOKED,
                  revokedAt:
                    now,
                },
              });

            return transaction
              .consentGrant
              .create({
                data: {
                  studentProfileId:
                    profile.id,
                  scope,
                  status:
                    ConsentStatus.ACTIVE,
                  actorType:
                    ConsentActorType.STUDENT,
                  grantedByUserId:
                    userId,
                  policyVersion:
                    dto.policyVersion.trim(),
                  grantedForMinor:
                    false,
                  grantedAt:
                    now,
                  expiresAt,
                },
              });
          },
        );

    return {
      success: true,
      grant,
    };
  }

  async revoke(
    userId: string,
    scope: ConsentScope,
  ) {
    const profile =
      await this.resolveStudentProfile(
        userId,
      );

    const now =
      new Date();

    const result =
      await this.database
        .consentGrant
        .updateMany({
          where: {
            studentProfileId:
              profile.id,
            scope,
            status:
              ConsentStatus.ACTIVE,
          },

          data: {
            status:
              ConsentStatus.REVOKED,
            revokedAt:
              now,
          },
        });

    return {
      success: true,
      scope,
      revokedCount:
        result.count,
      revokedAt:
        now,
    };
  }

  async activeScopesForProfile(
    studentProfileId: string,
  ) {
    const now =
      new Date();

    const grants =
      await this.database
        .consentGrant
        .findMany({
          where: {
            studentProfileId,

            status:
              ConsentStatus.ACTIVE,

            grantedAt: {
              not: null,
            },

            revokedAt:
              null,

            OR: [
              {
                expiresAt:
                  null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },

          select: {
            scope:
              true,
          },
        });

    return new Set<ConsentScope>(
      grants.map(
        (grant) =>
          grant.scope,
      ),
    );
  }

  async assertScopeActiveForProfile(
    studentProfileId: string,
    scope: ConsentScope,
  ) {
    const now =
      new Date();

    const grant =
      await this.database
        .consentGrant
        .findFirst({
          where: {
            studentProfileId,
            scope,
            status:
              ConsentStatus.ACTIVE,
            grantedAt: {
              not: null,
            },
            revokedAt:
              null,

            OR: [
              {
                expiresAt:
                  null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },

          orderBy: {
            grantedAt: "desc",
          },
        });

    if (!grant) {
      throw new ForbiddenException(
        `Active consent is required for ${scope}.`,
      );
    }

    return grant;
  }

  private isMinor(
    dateOfBirth: Date | null,
  ): boolean {
    if (!dateOfBirth) {
      return false;
    }

    const today =
      new Date();

    let age =
      today.getUTCFullYear() -
      dateOfBirth.getUTCFullYear();

    const monthDifference =
      today.getUTCMonth() -
      dateOfBirth.getUTCMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getUTCDate() <
          dateOfBirth.getUTCDate()
      )
    ) {
      age -= 1;
    }

    return age < 18;
  }
}
