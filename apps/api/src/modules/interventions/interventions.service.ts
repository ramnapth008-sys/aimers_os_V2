import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  BehaviorSeverity,
  BehaviorSignalType,
  ConsentScope,
  ConsentStatus,
  InterventionResponseType,
  InterventionStatus,
  InterventionType,
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import type {
  GenerateInterventionsDto,
} from "./dto/generate-interventions.dto";

import type {
  ListInterventionsQueryDto,
} from "./dto/list-interventions-query.dto";

import type {
  RespondToInterventionDto,
} from "./dto/respond-to-intervention.dto";

interface InterventionBlueprint {
  type:
    InterventionType;
  title: string;
  message: string;
  expiryMinutes: number;
  action:
    Prisma.InputJsonObject;
}

const OPEN_STATUSES:
  InterventionStatus[] = [
    InterventionStatus.SUGGESTED,
    InterventionStatus.ACCEPTED,
    InterventionStatus.ACTIVE,
  ];

const CLOSED_STATUSES =
  new Set<InterventionStatus>([
    InterventionStatus.DISMISSED,
    InterventionStatus.COMPLETED,
    InterventionStatus.EXPIRED,
  ]);

@Injectable()
export class InterventionsService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async generate(
    userId: string,
    dto:
      GenerateInterventionsDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.consentService
      .assertScopeActiveForProfile(
        profile.id,
        ConsentScope.BEHAVIOR_ANALYSIS,
      );

    const privacy =
      await this.requireInterventionsEnabled(
        profile.id,
      );

    await this.expireStale(
      profile.id,
    );

    const [
      signals,
      notificationConsent,
      focusControlConsent,
    ] =
      await Promise.all([
        this.database
          .behaviorSignal
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              resolvedAt:
                null,
            },

            orderBy: [
              {
                severity:
                  "desc",
              },
              {
                detectedAt:
                  "desc",
              },
            ],

            take:
              dto.limit,
          }),

        this.hasActiveConsent(
          profile.id,
          ConsentScope.NOTIFICATIONS,
        ),

        this.hasActiveConsent(
          profile.id,
          ConsentScope.FOCUS_CONTROLS,
        ),
      ]);

    const notificationEligible =
      privacy
        .allowNotifications &&
      notificationConsent;

    const focusControlsEligible =
      privacy
        .allowFocusControls &&
      focusControlConsent;

    const created =
      [];

    let existingCount =
      0;

    for (const signal of signals) {
      const blueprint =
        this.blueprintForSignal(
          signal.type,
          signal.severity,
          signal.title,
          signal.description,
          signal
            .recommendedAction,
        );

      const existing =
        await this.database
          .intervention
          .findFirst({
            where: {
              studentProfileId:
                profile.id,

              behaviorSignalId:
                signal.id,

              type:
                blueprint.type,

              status: {
                in:
                  OPEN_STATUSES,
              },
            },

            orderBy: {
              createdAt:
                "desc",
            },
          });

      if (existing) {
        existingCount += 1;
        continue;
      }

      const now =
        new Date();

      const expiresAt =
        new Date(
          now.getTime() +
            blueprint
              .expiryMinutes *
              60 *
              1000,
        );

      const actionConfig:
        Prisma.InputJsonValue = {
        version:
          "intervention-engine-v1",

        sourceSignal: {
          id:
            signal.id,
          type:
            signal.type,
          severity:
            signal.severity,
          confidenceScore:
            signal
              .confidenceScore,
          dataConfidence:
            signal
              .dataConfidence,
        },

        proposedAction:
          blueprint.action,

        recommendedAction:
          signal
            .recommendedAction,

        requiresExplicitUserAction:
          true,

        automaticBlocking:
          false,

        delivery: {
          inApp:
            true,

          notificationsEligible:
            notificationEligible,
        },

        focusControls: {
          eligible:
            focusControlsEligible,

          requiresSeparateConfirmation:
            true,
        },
      };

      const intervention =
        await this.database
          .intervention
          .create({
            data: {
              studentProfileId:
                profile.id,

              behaviorSignalId:
                signal.id,

              type:
                blueprint.type,

              status:
                InterventionStatus.SUGGESTED,

              title:
                blueprint.title,

              message:
                blueprint.message,

              actionConfig,

              scheduledAt:
                now,

              deliveredAt:
                now,

              expiresAt,
            },

            include: {
              behaviorSignal:
                true,

              responses: {
                orderBy: {
                  createdAt:
                    "desc",
                },
              },
            },
          });

      created.push(
        intervention,
      );
    }

    return {
      success: true,

      eligibleSignals:
        signals.length,

      created:
        created.length,

      alreadyOpen:
        existingCount,

      capabilities: {
        inApp:
          true,

        notificationsEligible:
          notificationEligible,

        focusControlsEligible,

        automaticBlocking:
          false,
      },

      interventions:
        created,
    };
  }

  async list(
    userId: string,
    query:
      ListInterventionsQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.expireStale(
      profile.id,
    );

    return this.database
      .intervention
      .findMany({
        where: {
          studentProfileId:
            profile.id,

          ...(query.status
            ? {
                status:
                  query.status,
              }
            : query.includeClosed
              ? {}
              : {
                  status: {
                    in:
                      OPEN_STATUSES,
                  },
                }),
        },

        include: {
          behaviorSignal:
            true,

          responses: {
            orderBy: {
              createdAt:
                "desc",
            },

            take: 10,
          },
        },

        orderBy: [
          {
            scheduledAt:
              "desc",
          },
          {
            createdAt:
              "desc",
          },
        ],

        take:
          query.limit,
      });
  }

  async overview(
    userId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.expireStale(
      profile.id,
    );

    const [
      suggested,
      accepted,
      active,
      completed,
      dismissed,
      expired,
      recent,
    ] =
      await Promise.all([
        this.countStatus(
          profile.id,
          InterventionStatus.SUGGESTED,
        ),

        this.countStatus(
          profile.id,
          InterventionStatus.ACCEPTED,
        ),

        this.countStatus(
          profile.id,
          InterventionStatus.ACTIVE,
        ),

        this.countStatus(
          profile.id,
          InterventionStatus.COMPLETED,
        ),

        this.countStatus(
          profile.id,
          InterventionStatus.DISMISSED,
        ),

        this.countStatus(
          profile.id,
          InterventionStatus.EXPIRED,
        ),

        this.database
          .intervention
          .findMany({
            where: {
              studentProfileId:
                profile.id,
            },

            include: {
              behaviorSignal:
                true,

              responses: {
                orderBy: {
                  createdAt:
                    "desc",
                },

                take: 3,
              },
            },

            orderBy: {
              createdAt:
                "desc",
            },

            take: 10,
          }),
      ]);

    return {
      counts: {
        suggested,
        accepted,
        active,
        completed,
        dismissed,
        expired,
        open:
          suggested +
          accepted +
          active,
      },

      recent,
    };
  }

  async getOne(
    userId: string,
    interventionId: string,
  ) {
    const intervention =
      await this.getOwned(
        userId,
        interventionId,
      );

    if (
      intervention
        .expiresAt &&
      intervention
        .expiresAt <
        new Date() &&
      OPEN_STATUSES.includes(
        intervention.status,
      )
    ) {
      return this.database
        .intervention
        .update({
          where: {
            id:
              intervention.id,
          },

          data: {
            status:
              InterventionStatus.EXPIRED,
          },

          include: {
            behaviorSignal:
              true,

            responses: {
              orderBy: {
                createdAt:
                  "desc",
              },
            },
          },
        });
    }

    return intervention;
  }

  async respond(
    userId: string,
    interventionId: string,
    dto:
      RespondToInterventionDto,
  ) {
    const intervention =
      await this.getOwned(
        userId,
        interventionId,
      );

    const now =
      new Date();

    if (
      intervention
        .expiresAt &&
      intervention
        .expiresAt <
        now &&
      OPEN_STATUSES.includes(
        intervention.status,
      )
    ) {
      await this.database
        .intervention
        .update({
          where: {
            id:
              intervention.id,
          },

          data: {
            status:
              InterventionStatus.EXPIRED,
          },
        });

      throw new BadRequestException(
        "This intervention has expired.",
      );
    }

    const feedbackOnly =
      dto.responseType ===
        InterventionResponseType.HELPFUL ||
      dto.responseType ===
        InterventionResponseType.NOT_HELPFUL;

    if (
      CLOSED_STATUSES.has(
        intervention.status,
      ) &&
      !feedbackOnly
    ) {
      throw new BadRequestException(
        "This intervention is already closed.",
      );
    }

    if (
      dto.responseType ===
        InterventionResponseType.SNOOZED &&
      !dto.snoozeMinutes
    ) {
      throw new BadRequestException(
        "snoozeMinutes is required when snoozing an intervention.",
      );
    }

    const state =
      this.responseState(
        intervention.status,
        dto,
        now,
      );

    const updated =
      await this.database
        .$transaction(
          async (transaction) => {
            await transaction
              .interventionResponse
              .create({
                data: {
                  interventionId:
                    intervention.id,

                  responseType:
                    dto.responseType,

                  note:
                    dto.note
                      ?.trim(),
                },
              });

            const saved =
              await transaction
                .intervention
                .update({
                  where: {
                    id:
                      intervention.id,
                  },

                  data:
                    state,

                  include: {
                    behaviorSignal:
                      true,

                    responses: {
                      orderBy: {
                        createdAt:
                          "desc",
                      },
                    },
                  },
                });

            if (
              dto.responseType ===
                InterventionResponseType.COMPLETED &&
              intervention
                .behaviorSignalId
            ) {
              await transaction
                .behaviorSignal
                .updateMany({
                  where: {
                    id:
                      intervention
                        .behaviorSignalId,

                    studentProfileId:
                      intervention
                        .studentProfileId,

                    resolvedAt:
                      null,
                  },

                  data: {
                    resolvedAt:
                      now,
                  },
                });
            }

            return saved;
          },
        );

    return {
      success: true,

      intervention:
        updated,
    };
  }

  private responseState(
    currentStatus:
      InterventionStatus,
    dto:
      RespondToInterventionDto,
    now: Date,
  ): Prisma.InterventionUpdateInput {
    switch (
      dto.responseType
    ) {
      case InterventionResponseType.ACCEPTED:
        return {
          status:
            currentStatus ===
              InterventionStatus.ACTIVE
              ? InterventionStatus.ACTIVE
              : InterventionStatus.ACCEPTED,

          respondedAt:
            now,
        };

      case InterventionResponseType.DISMISSED:
        return {
          status:
            InterventionStatus.DISMISSED,

          respondedAt:
            now,
        };

      case InterventionResponseType.SNOOZED: {
        const scheduledAt =
          new Date(
            now.getTime() +
              (
                dto
                  .snoozeMinutes ??
                30
              ) *
                60 *
                1000,
          );

        return {
          status:
            InterventionStatus.SUGGESTED,

          scheduledAt,

          respondedAt:
            now,

          expiresAt:
            new Date(
              scheduledAt.getTime() +
                12 *
                  60 *
                  60 *
                  1000,
            ),
        };
      }

      case InterventionResponseType.COMPLETED:
        return {
          status:
            InterventionStatus.COMPLETED,

          respondedAt:
            now,

          completedAt:
            now,
        };

      case InterventionResponseType.HELPFUL:
      case InterventionResponseType.NOT_HELPFUL:
      default:
        return {
          respondedAt:
            now,
        };
    }
  }

  private blueprintForSignal(
    type:
      BehaviorSignalType,
    severity:
      BehaviorSeverity,
    signalTitle: string,
    signalDescription: string,
    recommendedAction:
      string | null,
  ): InterventionBlueprint {
    const severityLabel =
      severity
        .toLowerCase();

    switch (type) {
      case BehaviorSignalType.FOCUS_STREAK:
        return {
          type:
            InterventionType.GENTLE_NUDGE,

          title:
            "Protect your focus streak",

          message:
            "You created a strong focus block. Repeat the same setup before the pattern fades.",

          expiryMinutes:
            12 * 60,

          action: {
            kind:
              "REPEAT_FOCUS_PATTERN",

            suggestedMinutes:
              45,

            signalTitle,
          },
        };

      case BehaviorSignalType.CONTEXT_SWITCHING:
        return {
          type:
            InterventionType.FOCUS_SESSION,

          title:
            "Start a single-task focus block",

          message:
            "Frequent switching is reducing effective study time. Choose one subject and stay with it for one protected block.",

          expiryMinutes:
            4 * 60,

          action: {
            kind:
              "START_FOCUS_SESSION",

            suggestedMinutes:
              severity ===
                BehaviorSeverity.HIGH ||
              severity ===
                BehaviorSeverity.CRITICAL
                ? 45
                : 25,

            suppressOptionalNotifications:
              true,
          },
        };

      case BehaviorSignalType.PROCRASTINATION:
        return {
          type:
            InterventionType.FOCUS_SESSION,

          title:
            "Recover with one small study task",

          message:
            "Distraction is currently outweighing study activity. Begin with a small task that can be completed in one focus block.",

          expiryMinutes:
            4 * 60,

          action: {
            kind:
              "FOCUS_RECOVERY",

            suggestedMinutes:
              25,

            chooseSmallestPendingTask:
              true,
          },
        };

      case BehaviorSignalType.LATE_NIGHT_SCROLLING:
        return {
          type:
            InterventionType.RECOVERY_PLAN,

          title:
            "Protect tonight's recovery",

          message:
            "Late-night distracting activity was detected. Set a digital shutdown point and protect the next sleep window.",

          expiryMinutes:
            8 * 60,

          action: {
            kind:
              "NIGHT_RECOVERY",

            suggestDigitalShutdown:
              true,

            deferNonUrgentTasks:
              true,
          },
        };

      case BehaviorSignalType.MISSED_STUDY_BLOCK:
        return {
          type:
            InterventionType.RESCHEDULE_TASK,

          title:
            "Reschedule the missed study block",

          message:
            "A planned study block appears to have been missed. Move it to the nearest realistic free period instead of abandoning it.",

          expiryMinutes:
            24 * 60,

          action: {
            kind:
              "RESCHEDULE_MISSED_BLOCK",

            preservePriority:
              true,
          },
        };

      case BehaviorSignalType.REVISION_GAP:
        return {
          type:
            InterventionType.REVISION_REMINDER,

          title:
            "Close the revision gap",

          message:
            "A revision gap needs attention. Schedule a short active-recall review before adding more new content.",

          expiryMinutes:
            48 * 60,

          action: {
            kind:
              "SCHEDULE_REVISION",

            suggestedMinutes:
              30,

            useActiveRecall:
              true,
          },
        };

      case BehaviorSignalType.DISTRACTION_BURST:
        return {
          type:
            InterventionType.FOCUS_SESSION,

          title:
            "Stop the cross-device distraction burst",

          message:
            "Distracting activity overlapped with study or lecture time. Start a protected focus session and silence the secondary device.",

          expiryMinutes:
            3 * 60,

          action: {
            kind:
              "CROSS_DEVICE_FOCUS_RECOVERY",

            suggestedMinutes:
              30,

            proposeFocusControls:
              true,

            automaticBlocking:
              false,
          },
        };

      case BehaviorSignalType.OVERLOAD_RISK:
        return {
          type:
            InterventionType.RECOVERY_PLAN,

          title:
            "Reduce overload before performance drops",

          message:
            "Your monitored digital exposure is high. Recovery now is more useful than adding another exhausted study block.",

          expiryMinutes:
            12 * 60,

          action: {
            kind:
              "OVERLOAD_RECOVERY",

            screenFreeBreakMinutes:
              severity ===
                BehaviorSeverity.CRITICAL
                ? 60
                : 30,

            suggestSleepProtection:
              true,
          },
        };

      case BehaviorSignalType.RECOVERY_PATTERN:
        return {
          type:
            InterventionType.MENTOR_CHECK_IN,

          title:
            "Strengthen the recovery pattern",

          message:
            "Your recent activity shows signs of recovery. Review what changed and make the helpful routine repeatable.",

          expiryMinutes:
            24 * 60,

          action: {
            kind:
              "MENTOR_REFLECTION",

            prompt:
              "What changed before your focus improved?",
          },
        };

      case BehaviorSignalType.LECTURE_INCOMPLETE:
        return {
          type:
            InterventionType.GENTLE_NUDGE,

          title:
            "Finish the highest-priority lecture",

          message:
            "An incomplete lecture has not received recent progress. Resume the most important one in a protected session.",

          expiryMinutes:
            24 * 60,

          action: {
            kind:
              "RESUME_LECTURE",

            prioritizeLowestCompletion:
              false,

            prioritizeAcademicPriority:
              true,
          },
        };

      default:
        return {
          type:
            InterventionType.GENTLE_NUDGE,

          title:
            signalTitle,

          message:
            recommendedAction ??
            signalDescription,

          expiryMinutes:
            12 * 60,

          action: {
            kind:
              "REVIEW_SIGNAL",

            severity:
              severityLabel,
          },
        };
    }
  }

  private async requireInterventionsEnabled(
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
      privacy.pausedAt ||
      !privacy
        .allowBehaviorAnalysis
    ) {
      throw new ForbiddenException(
        "Interventions require active Digital Activity monitoring and Behavior Analysis.",
      );
    }

    return privacy;
  }

  private async hasActiveConsent(
    studentProfileId: string,
    scope:
      ConsentScope,
  ): Promise<boolean> {
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

            OR: [
              {
                expiresAt:
                  null,
              },
              {
                expiresAt: {
                  gt:
                    now,
                },
              },
            ],
          },

          select: {
            id: true,
          },

          orderBy: {
            grantedAt:
              "desc",
          },
        });

    return Boolean(
      grant,
    );
  }

  private async expireStale(
    studentProfileId: string,
  ) {
    await this.database
      .intervention
      .updateMany({
        where: {
          studentProfileId,

          status: {
            in:
              OPEN_STATUSES,
          },

          expiresAt: {
            lt:
              new Date(),
          },
        },

        data: {
          status:
            InterventionStatus.EXPIRED,
        },
      });
  }

  private countStatus(
    studentProfileId: string,
    status:
      InterventionStatus,
  ) {
    return this.database
      .intervention
      .count({
        where: {
          studentProfileId,
          status,
        },
      });
  }

  private async getOwned(
    userId: string,
    interventionId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const intervention =
      await this.database
        .intervention
        .findFirst({
          where: {
            id:
              interventionId,

            studentProfileId:
              profile.id,
          },

          include: {
            behaviorSignal:
              true,

            responses: {
              orderBy: {
                createdAt:
                  "desc",
              },
            },
          },
        });

    if (!intervention) {
      throw new NotFoundException(
        "The intervention was not found.",
      );
    }

    return intervention;
  }
}
