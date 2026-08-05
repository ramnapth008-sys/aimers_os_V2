import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  ActivityEventType,
  ActivitySource,
  ConsentScope,
  DataConfidenceLevel,
  DataConnectorStatus,
  DataConnectorType,
  DeviceStatus,
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import type {
  ActivityOverviewQueryDto,
} from "./dto/activity-overview-query.dto";

import type {
  ActivityQueryDto,
} from "./dto/activity-query.dto";

import type {
  CreateActivityEventDto,
} from "./dto/create-activity-event.dto";

import type {
  IngestActivityEventsDto,
} from "./dto/ingest-activity-events.dto";

import type {
  UpsertLectureProgressDto,
} from "./dto/upsert-lecture-progress.dto";

const EXACT_LECTURE_CONNECTORS =
  new Set<DataConnectorType>([
    DataConnectorType.AIMERS_LECTURE_PLAYER,
    DataConnectorType.YOUTUBE,
    DataConnectorType.LEARNING_PLATFORM,
  ]);

@Injectable()
export class ActivityService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async ingestEvents(
    userId: string,
    dto:
      IngestActivityEventsDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const privacy =
      await this.requireMonitoringEnabled(
        profile.id,
      );

    const scopes = [
      ...new Set(
        dto.events.map(
          (event) =>
            this.eventScope(
              event,
            ),
        ),
      ),
    ];

    const consentGrantIds =
      new Map<
        ConsentScope,
        string
      >();

    for (const scope of scopes) {
      const grant =
        await this.consentService
          .assertScopeActiveForProfile(
            profile.id,
            scope,
          );

      consentGrantIds.set(
        scope,
        grant.id,
      );
    }

    const deviceIds = [
      ...new Set(
        dto.events
          .map(
            (event) =>
              event.connectedDeviceId,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    ];

    const connectorIds = [
      ...new Set(
        dto.events
          .map(
            (event) =>
              event.dataConnectorId,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    ];

    await this.assertOwnedDevices(
      profile.id,
      deviceIds,
    );

    await this.assertOwnedConnectors(
      profile.id,
      connectorIds,
    );

    const now =
      new Date();

    const rows:
      Prisma.ActivityEventCreateManyInput[] =
      dto.events.map(
        (event) => {
          const scope =
            this.eventScope(
              event,
            );

          const consentGrantId =
            consentGrantIds.get(
              scope,
            );

          if (!consentGrantId) {
            throw new ForbiddenException(
              `Active consent is required for ${scope}.`,
            );
          }

          const startedAt =
            new Date(
              event.startedAt,
            );

          const endedAt =
            event.endedAt
              ? new Date(
                  event.endedAt,
                )
              : null;

          if (
            startedAt >
            new Date(
              now.getTime() +
                10 * 60 * 1000,
            )
          ) {
            throw new BadRequestException(
              "Activity events cannot be more than ten minutes in the future.",
            );
          }

          if (
            endedAt &&
            endedAt < startedAt
          ) {
            throw new BadRequestException(
              "Activity end time cannot be before its start time.",
            );
          }

          const calculatedDuration =
            endedAt
              ? Math.max(
                  0,
                  Math.round(
                    (
                      endedAt.getTime() -
                      startedAt.getTime()
                    ) /
                      1000,
                  ),
                )
              : undefined;

          return {
            studentProfileId:
              profile.id,

            connectedDeviceId:
              event.connectedDeviceId,

            dataConnectorId:
              event.dataConnectorId,

            consentGrantId,

            eventKey:
              event.eventKey
                ?.trim(),

            type:
              event.type,

            source:
              event.source,

            category:
              event.category,

            confidence:
              event.confidence ??
              DataConfidenceLevel.OBSERVED,

            appName:
              event.appName
                ?.trim(),

            domain:
              this.normalizeDomain(
                event.domain,
              ),

            pageTitle:
              privacy.storeRawActivity
                ? event.pageTitle
                    ?.trim()
                : undefined,

            externalReferenceId:
              event.externalReferenceId
                ?.trim(),

            subjectId:
              event.subjectId,

            chapterId:
              event.chapterId,

            topicId:
              event.topicId,

            startedAt,
            endedAt,

            durationSeconds:
              event.durationSeconds ??
              calculatedDuration,

            foreground:
              event.foreground ??
              true,

            metadata:
              privacy.storeRawActivity &&
              event.metadata
                ? event.metadata as
                  Prisma.InputJsonValue
                : undefined,
          };
        },
      );

    const result =
      await this.database
        .$transaction(
          async (transaction) => {
            const inserted =
              await transaction
                .activityEvent
                .createMany({
                  data:
                    rows,
                  skipDuplicates:
                    true,
                });

            if (
              deviceIds.length >
              0
            ) {
              await transaction
                .connectedDevice
                .updateMany({
                  where: {
                    studentProfileId:
                      profile.id,

                    id: {
                      in:
                        deviceIds,
                    },
                  },

                  data: {
                    lastSeenAt:
                      now,
                    lastSyncAt:
                      now,
                    status:
                      DeviceStatus.ACTIVE,
                  },
                });
            }

            if (
              connectorIds.length >
              0
            ) {
              await transaction
                .dataConnector
                .updateMany({
                  where: {
                    studentProfileId:
                      profile.id,

                    id: {
                      in:
                        connectorIds,
                    },
                  },

                  data: {
                    lastSyncAt:
                      now,

                    lastSuccessfulSyncAt:
                      now,

                    errorMessage:
                      null,
                  },
                });
            }

            return inserted;
          },
        );

    return {
      success: true,

      received:
        dto.events.length,

      inserted:
        result.count,

      duplicatesIgnored:
        dto.events.length -
        result.count,

      ingestedAt:
        now,
    };
  }

  async listEvents(
    userId: string,
    query:
      ActivityQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    if (
      query.from &&
      query.to &&
      new Date(
        query.from,
      ) >
        new Date(
          query.to,
        )
    ) {
      throw new BadRequestException(
        "The activity start date cannot be after the end date.",
      );
    }

    return this.database
      .activityEvent
      .findMany({
        where: {
          studentProfileId:
            profile.id,

          ...(query.category
            ? {
                category:
                  query.category,
              }
            : {}),

          ...(
            query.from ||
            query.to
              ? {
                  startedAt: {
                    ...(query.from
                      ? {
                          gte:
                            new Date(
                              query.from,
                            ),
                        }
                      : {}),

                    ...(query.to
                      ? {
                          lte:
                            new Date(
                              query.to,
                            ),
                        }
                      : {}),
                  },
                }
              : {}
          ),
        },

        orderBy: {
          startedAt:
            "desc",
        },

        take:
          query.limit,
      });
  }

  async getOverview(
    userId: string,
    query:
      ActivityOverviewQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const from =
      new Date();

    from.setUTCDate(
      from.getUTCDate() -
        query.days +
        1,
    );

    from.setUTCHours(
      0,
      0,
      0,
      0,
    );

    const [
      privacy,
      eventCount,
      recentEvents,
      devices,
      connectors,
      recentLectures,
    ] =
      await Promise.all([
        this.database
          .privacyPreference
          .findUnique({
            where: {
              studentProfileId:
                profile.id,
            },
          }),

        this.database
          .activityEvent
          .count({
            where: {
              studentProfileId:
                profile.id,

              startedAt: {
                gte:
                  from,
              },
            },
          }),

        this.database
          .activityEvent
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              startedAt: {
                gte:
                  from,
              },
            },

            orderBy: {
              startedAt:
                "desc",
            },

            take: 25,
          }),

        this.database
          .connectedDevice
          .findMany({
            where: {
              studentProfileId:
                profile.id,
            },

            select: {
              id: true,
              name: true,
              platform: true,
              status: true,
              lastSeenAt: true,
              lastSyncAt: true,
            },
          }),

        this.database
          .dataConnector
          .findMany({
            where: {
              studentProfileId:
                profile.id,
            },

            select: {
              id: true,
              type: true,
              status: true,
              displayName: true,
              lastSyncAt: true,
              lastSuccessfulSyncAt:
                true,
            },
          }),

        this.database
          .lectureSession
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              startedAt: {
                gte:
                  from,
              },
            },

            orderBy: {
              lastProgressAt:
                "desc",
            },

            take: 20,
          }),
      ]);

    return {
      monitoring: {
        enabled:
          privacy
            ?.monitoringEnabled ??
          false,

        background:
          privacy
            ?.backgroundMonitoring ??
          false,

        pausedAt:
          privacy?.pausedAt ??
          null,

        connectedDevices:
          devices.length,

        activeDevices:
          devices.filter(
            (device) =>
              device.status ===
              DeviceStatus.ACTIVE,
          ).length,

        connectors:
          connectors.length,

        activeConnectors:
          connectors.filter(
            (connector) =>
              connector.status ===
              DataConnectorStatus.ACTIVE,
          ).length,
      },

      period: {
        days:
          query.days,
        from,
        to:
          new Date(),
      },

      eventCount,
      recentEvents,
      devices,
      connectors,
      recentLectures,
    };
  }

  async upsertLectureProgress(
    userId: string,
    dto:
      UpsertLectureProgressDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.requireMonitoringEnabled(
      profile.id,
    );

    await this.consentService
      .assertScopeActiveForProfile(
        profile.id,
        ConsentScope.LECTURE_PROGRESS,
      );

    await this.assertOwnedDevices(
      profile.id,
      dto.connectedDeviceId
        ? [
            dto.connectedDeviceId,
          ]
        : [],
    );

    const connectors =
      await this.assertOwnedConnectors(
        profile.id,
        dto.dataConnectorId
          ? [
              dto.dataConnectorId,
            ]
          : [],
      );

    const connector =
      dto.dataConnectorId
        ? connectors.get(
            dto.dataConnectorId,
          )
        : undefined;

    if (
      dto.confidence ===
        DataConfidenceLevel.EXACT &&
      (
        !connector ||
        !EXACT_LECTURE_CONNECTORS.has(
          connector.type,
        )
      )
    ) {
      throw new BadRequestException(
        "Exact lecture progress requires an approved lecture-platform connector.",
      );
    }

    const platformName =
      dto.platformName.trim();

    const externalLectureId =
      dto.externalLectureId.trim();

    const existing =
      await this.database
        .lectureSession
        .findFirst({
          where: {
            studentProfileId:
              profile.id,

            platformName,

            externalLectureId,
          },

          orderBy: {
            updatedAt:
              "desc",
          },
        });

    const totalDurationSeconds =
      dto.totalDurationSeconds ??
      existing
        ?.totalDurationSeconds ??
      null;

    const watchedSeconds =
      Math.max(
        existing
          ?.watchedSeconds ??
          0,
        dto.watchedSeconds,
      );

    const focusedSeconds =
      Math.max(
        existing
          ?.focusedSeconds ??
          0,
        dto.focusedSeconds ??
          0,
      );

    const playbackPositionSeconds =
      Math.max(
        existing
          ?.playbackPositionSeconds ??
          0,
        dto.playbackPositionSeconds,
      );

    const completionPercent =
      totalDurationSeconds
        ? Math.min(
            100,
            (
              watchedSeconds /
              totalDurationSeconds
            ) *
              100,
          )
        : existing
            ?.completionPercent ??
          0;

    const verifiedCompletion =
      dto.confidence ===
        DataConfidenceLevel.EXACT ||
      dto.confidence ===
        DataConfidenceLevel.VERIFIED;

    const completed =
      Boolean(
        existing?.completed ||
        (
          verifiedCompletion &&
          (
            dto.completed ===
              true ||
            completionPercent >=
              95
          )
        ),
      );

    const requestedStart =
      new Date(
        dto.startedAt,
      );

    const startedAt =
      existing &&
      existing.startedAt <
        requestedStart
        ? existing.startedAt
        : requestedStart;

    const requestedProgressAt =
      dto.lastProgressAt
        ? new Date(
            dto.lastProgressAt,
          )
        : new Date();

    const lastProgressAt =
      existing
        ?.lastProgressAt &&
      existing.lastProgressAt >
        requestedProgressAt
        ? existing.lastProgressAt
        : requestedProgressAt;

    const updateData = {
      connectedDeviceId:
        dto.connectedDeviceId,

      dataConnectorId:
        dto.dataConnectorId,

      courseTitle:
        dto.courseTitle
          ?.trim(),

      lectureTitle:
        dto.lectureTitle
          .trim(),

      subjectId:
        dto.subjectId,

      chapterId:
        dto.chapterId,

      topicId:
        dto.topicId,

      totalDurationSeconds,
      watchedSeconds,
      focusedSeconds,
      playbackPositionSeconds,
      completionPercent,
      completed,

      confidence:
        dto.confidence,

      startedAt,
      lastProgressAt,

      completedAt:
        completed
          ? existing
              ?.completedAt ??
            new Date()
          : null,
    };

    const lecture =
      existing
        ? await this.database
            .lectureSession
            .update({
              where: {
                id:
                  existing.id,
              },

              data:
                updateData,
            })
        : await this.database
            .lectureSession
            .create({
              data: {
                studentProfileId:
                  profile.id,

                externalLectureId,
                platformName,
                ...updateData,
              },
            });

    return {
      success: true,

      progressClassification:
        verifiedCompletion
          ? "VERIFIED_PROGRESS"
          : "OBSERVED_OR_ESTIMATED_PROGRESS",

      lecture,
    };
  }

  async listLectures(
    userId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    return this.database
      .lectureSession
      .findMany({
        where: {
          studentProfileId:
            profile.id,
        },

        orderBy: {
          lastProgressAt:
            "desc",
        },

        take: 100,
      });
  }

  private async requireMonitoringEnabled(
    studentProfileId: string,
  ) {
    const privacy =
      await this.database
        .privacyPreference
        .findUnique({
          where: {
            studentProfileId,
          },
        });

    if (
      !privacy
        ?.monitoringEnabled ||
      privacy.pausedAt
    ) {
      throw new ForbiddenException(
        "Digital Activity monitoring is paused or disabled.",
      );
    }

    return privacy;
  }

  private eventScope(
    event:
      CreateActivityEventDto,
  ): ConsentScope {
    if (
      event.type ===
        ActivityEventType.LECTURE_STARTED ||
      event.type ===
        ActivityEventType.LECTURE_PROGRESS ||
      event.type ===
        ActivityEventType.LECTURE_PAUSED ||
      event.type ===
        ActivityEventType.LECTURE_COMPLETED ||
      event.source ===
        ActivitySource.LECTURE
    ) {
      return ConsentScope.LECTURE_PROGRESS;
    }

    switch (event.source) {
      case ActivitySource.APP:
        return ConsentScope.APP_USAGE;

      case ActivitySource.WEBSITE:
      case ActivitySource.BROWSER:
        return ConsentScope.BROWSER_ACTIVITY;

      case ActivitySource.IMPORTED:
        return ConsentScope.BROWSER_HISTORY_IMPORT;

      case ActivitySource.STUDY_SESSION:
      case ActivitySource.DEVICE:
      case ActivitySource.IDLE:
      default:
        return ConsentScope.DIGITAL_ACTIVITY_MONITORING;
    }
  }

  private async assertOwnedDevices(
    studentProfileId: string,
    deviceIds: string[],
  ) {
    if (
      deviceIds.length === 0
    ) {
      return new Map();
    }

    const devices =
      await this.database
        .connectedDevice
        .findMany({
          where: {
            studentProfileId,

            id: {
              in:
                deviceIds,
            },

            status: {
              in: [
                DeviceStatus.ACTIVE,
                DeviceStatus.OFFLINE,
              ],
            },
          },
        });

    if (
      devices.length !==
      deviceIds.length
    ) {
      throw new NotFoundException(
        "One or more devices were not found, paused, or revoked.",
      );
    }

    return new Map(
      devices.map(
        (device) => [
          device.id,
          device,
        ],
      ),
    );
  }

  private async assertOwnedConnectors(
    studentProfileId: string,
    connectorIds: string[],
  ) {
    if (
      connectorIds.length === 0
    ) {
      return new Map();
    }

    const connectors =
      await this.database
        .dataConnector
        .findMany({
          where: {
            studentProfileId,

            id: {
              in:
                connectorIds,
            },

            status:
              DataConnectorStatus.ACTIVE,
          },
        });

    if (
      connectors.length !==
      connectorIds.length
    ) {
      throw new NotFoundException(
        "One or more data connectors were not found or are inactive.",
      );
    }

    return new Map(
      connectors.map(
        (connector) => [
          connector.id,
          connector,
        ],
      ),
    );
  }

  private normalizeDomain(
    value?: string,
  ): string | undefined {
    const cleaned =
      value
        ?.trim()
        .toLowerCase();

    if (!cleaned) {
      return undefined;
    }

    try {
      const url =
        cleaned.includes(
          "://",
        )
          ? new URL(cleaned)
          : new URL(
              `https://${cleaned}`,
            );

      return url.hostname
        .replace(
          /^www\./,
          "",
        )
        .slice(
          0,
          320,
        );
    } catch {
      throw new BadRequestException(
        "Activity domain must be a valid hostname or URL.",
      );
    }
  }
}
