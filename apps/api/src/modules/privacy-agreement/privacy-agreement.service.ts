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
  DataConnectorStatus,
  DataConnectorType,
  DeviceStatus,
  type Prisma,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import type {
  AcceptPrivacyAgreementDto,
} from "./dto/accept-privacy-agreement.dto";

import {
  ALL_AGREEMENT_SCOPES,
  NATIVE_CONNECTOR_TYPES,
  PENDING_EXTERNAL_CONNECTORS,
  PRIVACY_POLICY,
  PRIVACY_POLICY_VERSION,
} from "./privacy-agreement.constants";

interface ConnectorDefinition {
  type:
    DataConnectorType;
  displayName:
    string;
  status:
    DataConnectorStatus;
  connectedDevice:
    boolean;
  historicalImport:
    boolean;
}

const CONNECTOR_DEFINITIONS:
  ConnectorDefinition[] = [
    {
      type:
        DataConnectorType.AIMERS_WEB,
      displayName:
        "AIMERS Web",
      status:
        DataConnectorStatus.ACTIVE,
      connectedDevice:
        true,
      historicalImport:
        false,
    },
    {
      type:
        DataConnectorType
          .AIMERS_LECTURE_PLAYER,
      displayName:
        "AIMERS Lecture Player",
      status:
        DataConnectorStatus.ACTIVE,
      connectedDevice:
        true,
      historicalImport:
        false,
    },
    {
      type:
        DataConnectorType
          .BROWSER_EXTENSION,
      displayName:
        "Browser Activity Extension",
      status:
        DataConnectorStatus.PENDING,
      connectedDevice:
        true,
      historicalImport:
        true,
    },
    {
      type:
        DataConnectorType.YOUTUBE,
      displayName:
        "YouTube Learning History",
      status:
        DataConnectorStatus.PENDING,
      connectedDevice:
        false,
      historicalImport:
        true,
    },
    {
      type:
        DataConnectorType
          .LEARNING_PLATFORM,
      displayName:
        "Learning Platform",
      status:
        DataConnectorStatus.PENDING,
      connectedDevice:
        false,
      historicalImport:
        true,
    },
    {
      type:
        DataConnectorType.MANUAL_IMPORT,
      displayName:
        "Past Activity Import",
      status:
        DataConnectorStatus.PENDING,
      connectedDevice:
        true,
      historicalImport:
        true,
    },
  ];

@Injectable()
export class PrivacyAgreementService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  async getWorkspace(
    userId: string,
  ) {
    const profile =
      await this.resolveStudentProfile(
        userId,
      );

    const acceptance =
      await this.database
        .privacyAgreementAcceptance
        .findUnique({
          where: {
            studentProfileId_policyVersion: {
              studentProfileId:
                profile.id,
              policyVersion:
                PRIVACY_POLICY_VERSION,
            },
          },
        });

    return {
      required:
        !acceptance,

      accepted:
        Boolean(
          acceptance,
        ),

      acceptedAt:
        acceptance
          ?.acceptedAt ??
        null,

      activationSource:
        acceptance
          ?.activationSource ??
        null,

      policy:
        PRIVACY_POLICY,

      eligibility: {
        minor:
          this.isMinor(
            profile.dateOfBirth,
          ),

        guardianFlowRequired:
          this.isMinor(
            profile.dateOfBirth,
          ),
      },

      activation: {
        subscriptionEntitlementIntegration:
          "PENDING",

        developmentTrigger:
          "AUTHENTICATED_STUDENT_ACCESS",

        allScopes:
          ALL_AGREEMENT_SCOPES,

        nativeConnectors:
          NATIVE_CONNECTOR_TYPES,

        pendingExternalConnectors:
          PENDING_EXTERNAL_CONNECTORS,
      },
    };
  }

  async accept(
    userId: string,
    dto:
      AcceptPrivacyAgreementDto,
  ) {
    if (
      dto.policyVersion !==
      PRIVACY_POLICY_VERSION
    ) {
      throw new BadRequestException(
        "The privacy policy version is no longer current. Reload the agreement and review the latest version.",
      );
    }

    const profile =
      await this.resolveStudentProfile(
        userId,
      );

    if (
      this.isMinor(
        profile.dateOfBirth,
      )
    ) {
      throw new ForbiddenException(
        "This account requires the dedicated guardian and minor-safety agreement flow.",
      );
    }

    const now =
      new Date();

    const result =
      await this.database
        .$transaction(
          async (
            transaction,
          ) => {
            const existingAcceptance =
              await transaction
                .privacyAgreementAcceptance
                .findUnique({
                  where: {
                    studentProfileId_policyVersion: {
                      studentProfileId:
                        profile.id,
                      policyVersion:
                        PRIVACY_POLICY_VERSION,
                    },
                  },
                });

            if (
              existingAcceptance
            ) {
              return {
                alreadyAccepted:
                  true,

                acceptance:
                  existingAcceptance,
              };
            }

            await transaction
              .consentGrant
              .updateMany({
                where: {
                  studentProfileId:
                    profile.id,

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

            await transaction
              .consentGrant
              .createMany({
                data:
                  ALL_AGREEMENT_SCOPES
                    .map(
                      (
                        scope,
                      ) => ({
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
                          PRIVACY_POLICY_VERSION,

                        grantedForMinor:
                          false,

                        grantedAt:
                          now,

                        metadata: {
                          source:
                            "PRIVACY_AGREEMENT_GATE",

                          agreementMode:
                            "ALL_DISCLOSED_FUNCTIONALITY",

                          editable:
                            true,
                        } as
                          Prisma.InputJsonValue,
                      }),
                    ),
              });

            const privacy =
              await transaction
                .privacyPreference
                .upsert({
                  where: {
                    studentProfileId:
                      profile.id,
                  },

                  create: {
                    studentProfileId:
                      profile.id,

                    monitoringEnabled:
                      true,

                    backgroundMonitoring:
                      true,

                    crossDeviceSync:
                      true,

                    storeRawActivity:
                      true,

                    storeFullUrls:
                      true,

                    importPastHistory:
                      true,

                    allowAiContext:
                      true,

                    allowBehaviorAnalysis:
                      true,

                    allowNotifications:
                      true,

                    allowFocusControls:
                      true,

                    localProcessingPreferred:
                      true,

                    minorModeEnabled:
                      false,

                    guardianApprovalRequired:
                      false,

                    rawRetentionDays:
                      PRIVACY_POLICY
                        .defaults
                        .rawRetentionDays,

                    summaryRetentionDays:
                      PRIVACY_POLICY
                        .defaults
                        .summaryRetentionDays,

                    pausedAt:
                      null,
                  },

                  update: {
                    monitoringEnabled:
                      true,

                    backgroundMonitoring:
                      true,

                    crossDeviceSync:
                      true,

                    storeRawActivity:
                      true,

                    storeFullUrls:
                      true,

                    importPastHistory:
                      true,

                    allowAiContext:
                      true,

                    allowBehaviorAnalysis:
                      true,

                    allowNotifications:
                      true,

                    allowFocusControls:
                      true,

                    localProcessingPreferred:
                      true,

                    minorModeEnabled:
                      false,

                    guardianApprovalRequired:
                      false,

                    rawRetentionDays:
                      PRIVACY_POLICY
                        .defaults
                        .rawRetentionDays,

                    summaryRetentionDays:
                      PRIVACY_POLICY
                        .defaults
                        .summaryRetentionDays,

                    pausedAt:
                      null,
                  },
                });

            const device =
              await transaction
                .connectedDevice
                .upsert({
                  where: {
                    studentProfileId_externalDeviceId: {
                      studentProfileId:
                        profile.id,

                      externalDeviceId:
                        dto.externalDeviceId
                          .trim(),
                    },
                  },

                  create: {
                    studentProfileId:
                      profile.id,

                    externalDeviceId:
                      dto.externalDeviceId
                        .trim(),

                    name:
                      dto.deviceName
                        .trim(),

                    platform:
                      dto.platform,

                    status:
                      DeviceStatus.ACTIVE,

                    appVersion:
                      dto.appVersion
                        ?.trim(),

                    osVersion:
                      dto.osVersion
                        ?.trim(),

                    lastSeenAt:
                      now,

                    monitoringStartedAt:
                      now,

                    metadata: {
                      source:
                        "PRIVACY_AGREEMENT_GATE",

                      autoRegistered:
                        true,

                      policyVersion:
                        PRIVACY_POLICY_VERSION,
                    } as
                      Prisma.InputJsonValue,
                  },

                  update: {
                    name:
                      dto.deviceName
                        .trim(),

                    platform:
                      dto.platform,

                    status:
                      DeviceStatus.ACTIVE,

                    appVersion:
                      dto.appVersion
                        ?.trim(),

                    osVersion:
                      dto.osVersion
                        ?.trim(),

                    lastSeenAt:
                      now,

                    monitoringStartedAt:
                      now,

                    monitoringPausedAt:
                      null,

                    metadata: {
                      source:
                        "PRIVACY_AGREEMENT_GATE",

                      autoRegistered:
                        true,

                      policyVersion:
                        PRIVACY_POLICY_VERSION,
                    } as
                      Prisma.InputJsonValue,
                  },
                });

            const connectors = [];

            for (
              const definition
              of CONNECTOR_DEFINITIONS
            ) {
              const connector =
                await this
                  .upsertConnector(
                    transaction,
                    profile.id,
                    definition
                      .connectedDevice
                      ? device.id
                      : null,
                    definition,
                  );

              connectors.push(
                connector,
              );
            }

            const acceptance =
              await transaction
                .privacyAgreementAcceptance
                .create({
                  data: {
                    studentProfileId:
                      profile.id,

                    acceptedByUserId:
                      userId,

                    policyVersion:
                      PRIVACY_POLICY_VERSION,

                    activationSource:
                      "PRIVACY_GATE",

                    acceptedAt:
                      now,

                    metadata: {
                      agreementMode:
                        "ALL_DISCLOSED_FUNCTIONALITY",

                      editable:
                        true,

                      subscriptionEntitlementIntegration:
                        "PENDING",

                      developmentTrigger:
                        "AUTHENTICATED_STUDENT_ACCESS",

                      consentScopes:
                        ALL_AGREEMENT_SCOPES,

                      nativeConnectors:
                        NATIVE_CONNECTOR_TYPES,

                      pendingExternalConnectors:
                        PENDING_EXTERNAL_CONNECTORS,
                    } as
                      Prisma.InputJsonValue,
                  },
                });

            return {
              alreadyAccepted:
                false,

              acceptance,

              privacy,

              device,

              connectors,
            };
          },
        );

    return {
      success:
        true,

      ...result,

      workspace:
        await this
          .getWorkspace(
            userId,
          ),
    };
  }

  private async upsertConnector(
    transaction:
      Prisma.TransactionClient,
    studentProfileId:
      string,
    connectedDeviceId:
      string | null,
    definition:
      ConnectorDefinition,
  ) {
    const existing =
      await transaction
        .dataConnector
        .findFirst({
          where: {
            studentProfileId,

            connectedDeviceId,

            type:
              definition.type,

            displayName:
              definition
                .displayName,
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    const permissions = {
      source:
        "PRIVACY_AGREEMENT_GATE",

      policyVersion:
        PRIVACY_POLICY_VERSION,

      autoProvisioned:
        true,

      authorizationRequired:
        definition.status ===
        DataConnectorStatus.PENDING,

      historicalImport: {
        enabled:
          definition
            .historicalImport,

        range:
          definition
            .historicalImport
            ? "AVAILABLE_HISTORY"
            : null,
      },
    } as
      Prisma.InputJsonValue;

    if (existing) {
      return transaction
        .dataConnector
        .update({
          where: {
            id:
              existing.id,
          },

          data: {
            connectedDeviceId,

            status:
              definition.status,

            permissions,

            errorMessage:
              null,

            metadata: {
              policyVersion:
                PRIVACY_POLICY_VERSION,

              setupState:
                definition.status ===
                  DataConnectorStatus.ACTIVE
                  ? "ACTIVATED"
                  : "AUTHORIZATION_REQUIRED",
            } as
              Prisma.InputJsonValue,
          },
        });
    }

    return transaction
      .dataConnector
      .create({
        data: {
          studentProfileId,

          connectedDeviceId,

          type:
            definition.type,

          status:
            definition.status,

          displayName:
            definition
              .displayName,

          permissions,

          metadata: {
            policyVersion:
              PRIVACY_POLICY_VERSION,

            setupState:
              definition.status ===
                DataConnectorStatus.ACTIVE
                ? "ACTIVATED"
                : "AUTHORIZATION_REQUIRED",
          } as
            Prisma.InputJsonValue,
        },
      });
  }

  private async resolveStudentProfile(
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
            id:
              true,

            dateOfBirth:
              true,
          },

          orderBy: {
            createdAt:
              "asc",
          },
        });

    if (!profile) {
      throw new NotFoundException(
        "An active student profile was not found.",
      );
    }

    return profile;
  }

  private isMinor(
    dateOfBirth:
      Date | null,
  ): boolean {
    if (!dateOfBirth) {
      return false;
    }

    const today =
      new Date();

    let age =
      today.getUTCFullYear() -
      dateOfBirth
        .getUTCFullYear();

    const monthDifference =
      today.getUTCMonth() -
      dateOfBirth
        .getUTCMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getUTCDate() <
          dateOfBirth
            .getUTCDate()
      )
    ) {
      age -= 1;
    }

    return age < 18;
  }
}
