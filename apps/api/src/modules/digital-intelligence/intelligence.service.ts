import {
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  BehaviorSeverity,
  ConsentScope,
  DataConfidenceLevel,
  DeviceStatus,
  DataConnectorStatus,
  InterventionStatus,
  LearningProgressState,
  StudyTaskPriority,
  StudyTaskStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import type {
  IntelligenceQueryDto,
} from "./dto/intelligence-query.dto";

interface SubjectAccumulator {
  subjectId: string;
  code: string | null;
  name: string;
  chaptersTotal: number;
  chaptersCompleted: number;
  chapterCompletionTotal: number;
  topicsTotal: number;
  topicMasteryTotal: number;
  lectureCount: number;
  lectureCompletionTotal: number;
  focusedLectureSeconds: number;
  pendingTasks: number;
  urgentTasks: number;
}

const OPEN_INTERVENTION_STATUSES:
  InterventionStatus[] = [
    InterventionStatus.SUGGESTED,
    InterventionStatus.ACCEPTED,
    InterventionStatus.ACTIVE,
  ];

const CONFIDENCE_RANK:
  Record<
    DataConfidenceLevel,
    number
  > = {
    [DataConfidenceLevel.MISSING]:
      0,
    [DataConfidenceLevel.ESTIMATED]:
      1,
    [DataConfidenceLevel.OBSERVED]:
      2,
    [DataConfidenceLevel.VERIFIED]:
      3,
    [DataConfidenceLevel.EXACT]:
      4,
  };

@Injectable()
export class IntelligenceService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async dashboard(
    userId: string,
    query:
      IntelligenceQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const from =
      this.fromDays(
        query.days,
      );

    const [
      privacy,
      activeScopes,
      snapshots,
      summaries,
      activeSignals,
      openInterventions,
      devices,
      connectors,
      incompleteLectures,
      pendingTasks,
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

        this.consentService
          .activeScopesForProfile(
            profile.id,
          ),

        this.database
          .studentIntelligenceSnapshot
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              generatedAt: {
                gte:
                  from,
              },
            },

            orderBy: {
              generatedAt:
                "desc",
            },

            take:
              Math.min(
                query.limit,
                30,
              ),
          }),

        this.database
          .dailyActivitySummary
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              summaryDate: {
                gte:
                  from,
              },
            },

            orderBy: {
              summaryDate:
                "asc",
            },
          }),

        this.database
          .behaviorSignal
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              resolvedAt:
                null,
            },

            orderBy: {
              detectedAt:
                "desc",
            },

            take:
              query.limit,
          }),

        this.database
          .intervention
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status: {
                in:
                  OPEN_INTERVENTION_STATUSES,
              },
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

            take:
              query.limit,
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
              displayName: true,
              status: true,
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

              completed:
                false,

              completionPercent: {
                lt: 95,
              },
            },

            orderBy: {
              lastProgressAt:
                "asc",
            },

            take:
              query.limit,
          }),

        this.database
          .studyTask
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status: {
                in: [
                  StudyTaskStatus.TODO,
                  StudyTaskStatus.IN_PROGRESS,
                ],
              },
            },

            include: {
              subject:
                true,
              chapter:
                true,
              topic:
                true,
            },

            orderBy: [
              {
                dueAt:
                  "asc",
              },
              {
                scheduledFor:
                  "asc",
              },
            ],

            take:
              query.limit,
          }),
      ]);

    const aggregate =
      this.aggregateSummaries(
        summaries,
      );

    return {
      generatedAt:
        new Date(),

      period: {
        days:
          query.days,
        from,
        to:
          new Date(),
      },

      privacy: {
        monitoringEnabled:
          Boolean(
            privacy
              ?.monitoringEnabled &&
            activeScopes.has(
              ConsentScope.DIGITAL_ACTIVITY_MONITORING,
            ),
          ),

        paused:
          Boolean(
            privacy?.pausedAt,
          ),

        behaviorAnalysisEnabled:
          Boolean(
            privacy
              ?.allowBehaviorAnalysis &&
            activeScopes.has(
              ConsentScope.BEHAVIOR_ANALYSIS,
            ),
          ),

        aiContextEnabled:
          Boolean(
            privacy
              ?.allowAiContext &&
            activeScopes.has(
              ConsentScope.AI_CONTEXT_SHARING,
            ),
          ),

        notificationEnabled:
          Boolean(
            privacy
              ?.allowNotifications &&
            activeScopes.has(
              ConsentScope.NOTIFICATIONS,
            ),
          ),

        focusControlsEnabled:
          Boolean(
            privacy
              ?.allowFocusControls &&
            activeScopes.has(
              ConsentScope.FOCUS_CONTROLS,
            ),
          ),
      },

      connectivity: {
        devices:
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

        devicesDetail:
          devices,

        connectorsDetail:
          connectors,
      },

      intelligence: {
        latestSnapshot:
          snapshots[0] ??
          null,

        trend:
          this.snapshotTrend(
            snapshots,
          ),

        activity:
          aggregate,

        activeSignalCount:
          activeSignals.length,

        openInterventionCount:
          openInterventions.length,

        incompleteLectureCount:
          incompleteLectures.length,

        pendingTaskCount:
          pendingTasks.length,
      },

      activeSignals,
      openInterventions,
      incompleteLectures,
      pendingTasks,
    };
  }

  async mentorContext(
    userId: string,
    query:
      IntelligenceQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.requireAiContext(
      profile.id,
    );

    const from =
      this.fromDays(
        query.days,
      );

    const [
      latestSnapshot,
      signals,
      interventions,
      tasks,
      lectures,
      subjectInsights,
    ] =
      await Promise.all([
        this.database
          .studentIntelligenceSnapshot
          .findFirst({
            where: {
              studentProfileId:
                profile.id,
            },

            orderBy: {
              generatedAt:
                "desc",
            },
          }),

        this.database
          .behaviorSignal
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              resolvedAt:
                null,

              detectedAt: {
                gte:
                  from,
              },
            },

            orderBy: {
              detectedAt:
                "desc",
            },

            take:
              query.limit,
          }),

        this.database
          .intervention
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status: {
                in:
                  OPEN_INTERVENTION_STATUSES,
              },
            },

            include: {
              behaviorSignal:
                true,
            },

            orderBy: {
              createdAt:
                "desc",
            },

            take:
              query.limit,
          }),

        this.database
          .studyTask
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status: {
                in: [
                  StudyTaskStatus.TODO,
                  StudyTaskStatus.IN_PROGRESS,
                ],
              },
            },

            include: {
              subject:
                true,
              chapter:
                true,
              topic:
                true,
            },

            orderBy: [
              {
                dueAt:
                  "asc",
              },
              {
                priority:
                  "desc",
              },
            ],

            take:
              query.limit,
          }),

        this.database
          .lectureSession
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              completed:
                false,

              completionPercent: {
                lt: 95,
              },
            },

            orderBy: {
              lastProgressAt:
                "asc",
            },

            take:
              query.limit,
          }),

        this.buildSubjectInsights(
          profile.id,
          from,
        ),
      ]);

    return {
      generatedAt:
        new Date(),

      period: {
        days:
          query.days,
        from,
        to:
          new Date(),
      },

      contextPolicy: {
        explicitAiContextConsent:
          true,

        rawActivityIncluded:
          false,

        fullUrlsIncluded:
          false,

        privateExternalChatsIncluded:
          false,

        purpose:
          "Provide structured academic and behavior context to the AIMERS AI Mentor.",
      },

      studentIntelligence: {
        latestSnapshot,

        activeSignals:
          signals,

        openInterventions:
          interventions,

        subjectInsights:
          subjectInsights.slice(
            0,
            query.limit,
          ),

        pendingTasks:
          tasks,

        incompleteLectures:
          lectures,
      },

      priorities:
        this.buildMentorPriorities(
          interventions,
          tasks,
          lectures,
        ),

      guidanceRules: {
        distinguishMeasuredFromEstimated:
          true,

        avoidMedicalDiagnosis:
          true,

        avoidPunitiveLanguage:
          true,

        requireUserConfirmationForFocusControls:
          true,

        doNotClaimRankPredictionWithoutAcademicEvidence:
          true,
      },
    };
  }

  async subjects(
    userId: string,
    query:
      IntelligenceQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.requireBehaviorAnalysis(
      profile.id,
    );

    const insights =
      await this.buildSubjectInsights(
        profile.id,
        this.fromDays(
          query.days,
        ),
      );

    return {
      generatedAt:
        new Date(),

      period: {
        days:
          query.days,
      },

      subjects:
        insights.slice(
          0,
          query.limit,
        ),
    };
  }

  async plannerContext(
    userId: string,
    query:
      IntelligenceQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.requireBehaviorAnalysis(
      profile.id,
    );

    const now =
      new Date();

    const from =
      this.fromDays(
        query.days,
      );

    const [
      tasks,
      interventions,
      summaries,
      incompleteLectures,
    ] =
      await Promise.all([
        this.database
          .studyTask
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status: {
                in: [
                  StudyTaskStatus.TODO,
                  StudyTaskStatus.IN_PROGRESS,
                ],
              },
            },

            include: {
              subject:
                true,
              chapter:
                true,
              topic:
                true,
            },

            orderBy: [
              {
                dueAt:
                  "asc",
              },
              {
                scheduledFor:
                  "asc",
              },
            ],

            take:
              query.limit,
          }),

        this.database
          .intervention
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status: {
                in:
                  OPEN_INTERVENTION_STATUSES,
              },
            },

            include: {
              behaviorSignal:
                true,
            },

            orderBy: {
              createdAt:
                "desc",
            },

            take:
              query.limit,
          }),

        this.database
          .dailyActivitySummary
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              summaryDate: {
                gte:
                  from,
              },
            },

            orderBy: {
              summaryDate:
                "desc",
            },
          }),

        this.database
          .lectureSession
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              completed:
                false,

              completionPercent: {
                lt: 95,
              },
            },

            orderBy: {
              lastProgressAt:
                "asc",
            },

            take:
              query.limit,
          }),
      ]);

    const aggregate =
      this.aggregateSummaries(
        summaries,
      );

    const taskRecommendations =
      tasks.map(
        (task) => ({
          kind:
            "EXISTING_TASK",

          taskId:
            task.id,

          title:
            task.title,

          priority:
            task.priority,

          overdue:
            Boolean(
              task.dueAt &&
              task.dueAt <
                now,
            ),

          scheduledFor:
            task.scheduledFor,

          dueAt:
            task.dueAt,

          estimatedMinutes:
            task.estimatedMinutes,

          completionPercent:
            task.completionPercent,

          subject:
            task.subject
              ? {
                  id:
                    task
                      .subject
                      .id,

                  code:
                    task
                      .subject
                      .code,

                  name:
                    task
                      .subject
                      .name,
                }
              : null,

          chapter:
            task.chapter
              ? {
                  id:
                    task
                      .chapter
                      .id,

                  name:
                    task
                      .chapter
                      .name,
                }
              : null,

          topic:
            task.topic
              ? {
                  id:
                    task
                      .topic
                      .id,

                  name:
                    task
                      .topic
                      .name,
                }
              : null,
        }),
      );

    const interventionRecommendations =
      interventions.map(
        (intervention) => ({
          kind:
            "INTERVENTION",

          interventionId:
            intervention.id,

          type:
            intervention.type,

          title:
            intervention.title,

          message:
            intervention.message,

          actionConfig:
            intervention
              .actionConfig,

          signal:
            intervention
              .behaviorSignal,
        }),
      );

    const lectureRecommendations =
      incompleteLectures.map(
        (lecture) => ({
          kind:
            "INCOMPLETE_LECTURE",

          lectureId:
            lecture.id,

          title:
            lecture
              .lectureTitle,

          platform:
            lecture
              .platformName,

          completionPercent:
            lecture
              .completionPercent,

          confidence:
            lecture
              .confidence,

          lastProgressAt:
            lecture
              .lastProgressAt,
        }),
      );

    return {
      generatedAt:
        now,

      period: {
        days:
          query.days,
        from,
        to:
          now,
      },

      capacityContext: {
        recentFocusedStudySeconds:
          aggregate
            .focusedStudySeconds,

        recentDistractionSeconds:
          aggregate
            .distractionSeconds,

        recentLongestFocusSeconds:
          aggregate
            .longestFocusSeconds,

        recentOverloadRisk:
          aggregate
            .monitoredSeconds >=
          12 *
            60 *
            60,
      },

      recommendations: [
        ...interventionRecommendations,
        ...taskRecommendations,
        ...lectureRecommendations,
      ].slice(
        0,
        query.limit,
      ),

      policy: {
        plannerMutationPerformed:
          false,

        userConfirmationRequiredBeforeRescheduling:
          true,

        userConfirmationRequiredBeforeCreatingTasks:
          true,
      },
    };
  }

  async predictions(
    userId: string,
    query:
      IntelligenceQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.requireBehaviorAnalysis(
      profile.id,
    );

    const snapshots =
      await this.database
        .studentIntelligenceSnapshot
        .findMany({
          where: {
            studentProfileId:
              profile.id,

            generatedAt: {
              gte:
                this.fromDays(
                  query.days,
                ),
            },
          },

          orderBy: {
            generatedAt:
              "desc",
          },

          take:
            query.limit,
        });

    const latest =
      snapshots[0] ??
      null;

    const trend =
      this.snapshotTrend(
        snapshots,
      );

    const confidence =
      latest
        ?.predictionConfidence ??
      DataConfidenceLevel.MISSING;

    const sufficientCoverage =
      Boolean(
        latest &&
        latest.coveragePercent >=
          20 &&
        CONFIDENCE_RANK[
          confidence
        ] >=
          CONFIDENCE_RANK[
            DataConfidenceLevel.OBSERVED
          ],
      );

    return {
      generatedAt:
        new Date(),

      period: {
        days:
          query.days,
      },

      latestSnapshot:
        latest,

      trend,

      predictionReadiness: {
        confidence,

        coveragePercent:
          latest
            ?.coveragePercent ??
          0,

        sufficientForBehaviorTrend:
          sufficientCoverage,

        sufficientForExamRankPrediction:
          false,
      },

      supportedPredictions: {
        focusDirection:
          trend.focusScore,

        distractionRiskDirection:
          trend
            .distractionRiskScore,

        overloadRiskDirection:
          trend
            .overloadRiskScore,

        academicReadinessDirection:
          trend
            .academicReadinessScore,
      },

      limitations: [
        "This endpoint reports trends from measured Digital Intelligence snapshots.",
        "It does not calculate a NEET rank or examination score.",
        "Academic rank prediction requires validated mock-test, syllabus-completion, accuracy, revision, and historical-performance evidence.",
        "Estimated or low-coverage activity data must not be presented as an exact prediction.",
      ],
    };
  }

  private async buildSubjectInsights(
    studentProfileId: string,
    from: Date,
  ) {
    const [
      chapterProgress,
      topicMastery,
      lectures,
      pendingTasks,
    ] =
      await Promise.all([
        this.database
          .chapterProgress
          .findMany({
            where: {
              studentEnrollment: {
                studentProfileId,
              },
            },

            include: {
              chapter: {
                include: {
                  unit: {
                    include: {
                      syllabusSubject: {
                        include: {
                          subject:
                            true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),

        this.database
          .topicMastery
          .findMany({
            where: {
              studentEnrollment: {
                studentProfileId,
              },
            },

            include: {
              topic: {
                include: {
                  chapter: {
                    include: {
                      unit: {
                        include: {
                          syllabusSubject: {
                            include: {
                              subject:
                                true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),

        this.database
          .lectureSession
          .findMany({
            where: {
              studentProfileId,

              startedAt: {
                gte:
                  from,
              },

              subjectId: {
                not:
                  null,
              },
            },
          }),

        this.database
          .studyTask
          .findMany({
            where: {
              studentProfileId,

              status: {
                in: [
                  StudyTaskStatus.TODO,
                  StudyTaskStatus.IN_PROGRESS,
                ],
              },

              subjectId: {
                not:
                  null,
              },
            },
          }),
      ]);

    const subjectIds =
      new Set<string>();

    for (
      const lecture
      of lectures
    ) {
      if (
        lecture.subjectId
      ) {
        subjectIds.add(
          lecture.subjectId,
        );
      }
    }

    for (
      const task
      of pendingTasks
    ) {
      if (
        task.subjectId
      ) {
        subjectIds.add(
          task.subjectId,
        );
      }
    }

    const extraSubjects =
      subjectIds.size > 0
        ? await this.database
            .subject
            .findMany({
              where: {
                id: {
                  in: [
                    ...subjectIds,
                  ],
                },
              },
            })
        : [];

    const accumulators =
      new Map<
        string,
        SubjectAccumulator
      >();

    const ensure =
      (
        subjectId: string,
        name: string,
        code:
          string | null,
      ) => {
        const existing =
          accumulators.get(
            subjectId,
          );

        if (existing) {
          return existing;
        }

        const created:
          SubjectAccumulator = {
          subjectId,
          code,
          name,
          chaptersTotal:
            0,
          chaptersCompleted:
            0,
          chapterCompletionTotal:
            0,
          topicsTotal:
            0,
          topicMasteryTotal:
            0,
          lectureCount:
            0,
          lectureCompletionTotal:
            0,
          focusedLectureSeconds:
            0,
          pendingTasks:
            0,
          urgentTasks:
            0,
        };

        accumulators.set(
          subjectId,
          created,
        );

        return created;
      };

    for (
      const subject
      of extraSubjects
    ) {
      ensure(
        subject.id,
        subject.name,
        subject.code,
      );
    }

    for (
      const progress
      of chapterProgress
    ) {
      const subject =
        progress
          .chapter
          .unit
          .syllabusSubject
          .subject;

      const item =
        ensure(
          subject.id,
          subject.name,
          subject.code,
        );

      item.chaptersTotal +=
        1;

      item.chapterCompletionTotal +=
        progress
          .completionPercent;

      if (
        progress.state ===
        LearningProgressState.COMPLETED
      ) {
        item.chaptersCompleted +=
          1;
      }
    }

    for (
      const mastery
      of topicMastery
    ) {
      const subject =
        mastery
          .topic
          .chapter
          .unit
          .syllabusSubject
          .subject;

      const item =
        ensure(
          subject.id,
          subject.name,
          subject.code,
        );

      item.topicsTotal +=
        1;

      item.topicMasteryTotal +=
        mastery
          .masteryScore;
    }

    for (
      const lecture
      of lectures
    ) {
      if (
        !lecture.subjectId
      ) {
        continue;
      }

      const item =
        ensure(
          lecture.subjectId,
          `Subject ${lecture.subjectId.slice(
            0,
            8,
          )}`,
          null,
        );

      item.lectureCount +=
        1;

      item.lectureCompletionTotal +=
        lecture
          .completionPercent;

      item.focusedLectureSeconds +=
        lecture
          .focusedSeconds;
    }

    for (
      const task
      of pendingTasks
    ) {
      if (!task.subjectId) {
        continue;
      }

      const item =
        ensure(
          task.subjectId,
          `Subject ${task.subjectId.slice(
            0,
            8,
          )}`,
          null,
        );

      item.pendingTasks +=
        1;

      if (
        task.priority ===
          StudyTaskPriority.URGENT ||
        task.priority ===
          StudyTaskPriority.HIGH
      ) {
        item.urgentTasks +=
          1;
      }
    }

    return [
      ...accumulators.values(),
    ]
      .map(
        (item) => {
          const chapterCompletionPercent =
            item.chaptersTotal >
            0
              ? item
                  .chapterCompletionTotal /
                item.chaptersTotal
              : null;

          const topicMasteryScore =
            item.topicsTotal >
            0
              ? item
                  .topicMasteryTotal /
                item.topicsTotal
              : null;

          const lectureCompletionPercent =
            item.lectureCount >
            0
              ? item
                  .lectureCompletionTotal /
                item.lectureCount
              : null;

          const evidenceScores = [
            chapterCompletionPercent,
            topicMasteryScore,
            lectureCompletionPercent,
          ].filter(
            (
              value,
            ): value is number =>
              value !== null,
          );

          const readinessScore =
            evidenceScores.length >
            0
              ? evidenceScores.reduce(
                  (
                    total,
                    value,
                  ) =>
                    total +
                    value,
                  0,
                ) /
                evidenceScores.length
              : null;

          const attentionScore =
            Math.min(
              100,
              (
                readinessScore ===
                null
                  ? 50
                  : 100 -
                    readinessScore
              ) +
                item
                  .urgentTasks *
                  12 +
                item
                  .pendingTasks *
                  3,
            );

          return {
            subjectId:
              item.subjectId,

            code:
              item.code,

            name:
              item.name,

            readinessScore:
              this.roundNullable(
                readinessScore,
              ),

            attentionScore:
              this.round(
                attentionScore,
              ),

            chapters: {
              total:
                item
                  .chaptersTotal,

              completed:
                item
                  .chaptersCompleted,

              completionPercent:
                this.roundNullable(
                  chapterCompletionPercent,
                ),
            },

            topics: {
              assessed:
                item
                  .topicsTotal,

              averageMasteryScore:
                this.roundNullable(
                  topicMasteryScore,
                ),
            },

            lectures: {
              count:
                item
                  .lectureCount,

              averageCompletionPercent:
                this.roundNullable(
                  lectureCompletionPercent,
                ),

              focusedSeconds:
                item
                  .focusedLectureSeconds,
            },

            planner: {
              pendingTasks:
                item
                  .pendingTasks,

              urgentTasks:
                item
                  .urgentTasks,
            },
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          right
            .attentionScore -
          left
            .attentionScore,
      );
  }

  private buildMentorPriorities(
    interventions:
      Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        actionConfig:
          unknown;
      }>,
    tasks:
      Array<{
        id: string;
        title: string;
        priority:
          StudyTaskPriority;
        dueAt:
          Date | null;
        scheduledFor:
          Date | null;
      }>,
    lectures:
      Array<{
        id: string;
        lectureTitle: string;
        completionPercent: number;
        confidence:
          DataConfidenceLevel;
      }>,
  ) {
    const interventionPriorities =
      interventions.map(
        (
          intervention,
          index,
        ) => ({
          order:
            index + 1,

          source:
            "INTERVENTION",

          id:
            intervention.id,

          type:
            intervention.type,

          title:
            intervention.title,

          reason:
            intervention.message,

          action:
            intervention
              .actionConfig,
        }),
      );

    const taskPriorities =
      tasks
        .filter(
          (task) =>
            task.priority ===
              StudyTaskPriority.URGENT ||
            task.priority ===
              StudyTaskPriority.HIGH ||
            Boolean(
              task.dueAt &&
              task.dueAt <
                new Date(),
            ),
        )
        .map(
          (
            task,
            index,
          ) => ({
            order:
              interventionPriorities
                .length +
              index +
              1,

            source:
              "PLANNER_TASK",

            id:
              task.id,

            type:
              task.priority,

            title:
              task.title,

            reason:
              task.dueAt &&
              task.dueAt <
                new Date()
                ? "This task is overdue."
                : "This task has high academic priority.",

            action: {
              scheduledFor:
                task
                  .scheduledFor,

              dueAt:
                task.dueAt,
            },
          }),
        );

    const lecturePriorities =
      lectures
        .slice(
          0,
          5,
        )
        .map(
          (
            lecture,
            index,
          ) => ({
            order:
              interventionPriorities
                .length +
              taskPriorities
                .length +
              index +
              1,

            source:
              "LECTURE_PROGRESS",

            id:
              lecture.id,

            type:
              "INCOMPLETE_LECTURE",

            title:
              lecture
                .lectureTitle,

            reason:
              `Lecture completion is ${this.round(
                lecture
                  .completionPercent,
              )}%.`,

            action: {
              confidence:
                lecture
                  .confidence,

              resumeLecture:
                true,
            },
          }),
        );

    return [
      ...interventionPriorities,
      ...taskPriorities,
      ...lecturePriorities,
    ].slice(
      0,
      15,
    );
  }

  private aggregateSummaries(
    summaries:
      Array<{
        monitoredSeconds: number;
        studySeconds: number;
        productiveSeconds: number;
        distractionSeconds: number;
        idleSeconds: number;
        focusedStudySeconds: number;
        lectureSeconds: number;
        revisionSeconds: number;
        socialSeconds: number;
        entertainmentSeconds: number;
        contextSwitches: number;
        longestFocusSeconds: number;
        coveragePercent: number;
        confidence:
          DataConfidenceLevel;
      }>,
  ) {
    const total =
      summaries.reduce(
        (
          aggregate,
          summary,
        ) => ({
          monitoredSeconds:
            aggregate
              .monitoredSeconds +
            summary
              .monitoredSeconds,

          studySeconds:
            aggregate
              .studySeconds +
            summary
              .studySeconds,

          productiveSeconds:
            aggregate
              .productiveSeconds +
            summary
              .productiveSeconds,

          distractionSeconds:
            aggregate
              .distractionSeconds +
            summary
              .distractionSeconds,

          idleSeconds:
            aggregate
              .idleSeconds +
            summary
              .idleSeconds,

          focusedStudySeconds:
            aggregate
              .focusedStudySeconds +
            summary
              .focusedStudySeconds,

          lectureSeconds:
            aggregate
              .lectureSeconds +
            summary
              .lectureSeconds,

          revisionSeconds:
            aggregate
              .revisionSeconds +
            summary
              .revisionSeconds,

          socialSeconds:
            aggregate
              .socialSeconds +
            summary
              .socialSeconds,

          entertainmentSeconds:
            aggregate
              .entertainmentSeconds +
            summary
              .entertainmentSeconds,

          contextSwitches:
            aggregate
              .contextSwitches +
            summary
              .contextSwitches,

          longestFocusSeconds:
            Math.max(
              aggregate
                .longestFocusSeconds,
              summary
                .longestFocusSeconds,
            ),

          coveragePercent:
            aggregate
              .coveragePercent +
            summary
              .coveragePercent,
        }),
        {
          monitoredSeconds:
            0,
          studySeconds:
            0,
          productiveSeconds:
            0,
          distractionSeconds:
            0,
          idleSeconds:
            0,
          focusedStudySeconds:
            0,
          lectureSeconds:
            0,
          revisionSeconds:
            0,
          socialSeconds:
            0,
          entertainmentSeconds:
            0,
          contextSwitches:
            0,
          longestFocusSeconds:
            0,
          coveragePercent:
            0,
        },
      );

    const confidence =
      summaries.length >
      0
        ? summaries.reduce<
            DataConfidenceLevel
          >(
            (
              lowest,
              summary,
            ) =>
              CONFIDENCE_RANK[
                summary
                  .confidence
              ] <
              CONFIDENCE_RANK[
                lowest
              ]
                ? summary
                    .confidence
                : lowest,
            DataConfidenceLevel.EXACT,
          )
        : DataConfidenceLevel.MISSING;

    return {
      ...total,

      averageCoveragePercent:
        summaries.length >
        0
          ? this.round(
              total
                .coveragePercent /
                summaries.length,
            )
          : 0,

      confidence,
    };
  }

  private snapshotTrend(
    snapshots:
      Array<{
        generatedAt: Date;
        academicReadinessScore:
          number | null;
        focusScore:
          number | null;
        distractionRiskScore:
          number | null;
        overloadRiskScore:
          number | null;
      }>,
  ) {
    const latest =
      snapshots[0];

    const previous =
      snapshots[1];

    return {
      sampleCount:
        snapshots.length,

      latestGeneratedAt:
        latest
          ?.generatedAt ??
        null,

      previousGeneratedAt:
        previous
          ?.generatedAt ??
        null,

      academicReadinessScore:
        this.scoreTrend(
          latest
            ?.academicReadinessScore,
          previous
            ?.academicReadinessScore,
        ),

      focusScore:
        this.scoreTrend(
          latest
            ?.focusScore,
          previous
            ?.focusScore,
        ),

      distractionRiskScore:
        this.scoreTrend(
          latest
            ?.distractionRiskScore,
          previous
            ?.distractionRiskScore,
        ),

      overloadRiskScore:
        this.scoreTrend(
          latest
            ?.overloadRiskScore,
          previous
            ?.overloadRiskScore,
        ),
    };
  }

  private scoreTrend(
    latest:
      number | null | undefined,
    previous:
      number | null | undefined,
  ) {
    if (
      latest ===
        null ||
      latest ===
        undefined ||
      previous ===
        null ||
      previous ===
        undefined
    ) {
      return {
        latest:
          latest ??
          null,

        previous:
          previous ??
          null,

        delta:
          null,

        direction:
          "INSUFFICIENT_DATA",
      };
    }

    const delta =
      this.round(
        latest -
        previous,
      );

    return {
      latest:
        this.round(
          latest,
        ),

      previous:
        this.round(
          previous,
        ),

      delta,

      direction:
        delta > 0
          ? "UP"
          : delta < 0
            ? "DOWN"
            : "STABLE",
    };
  }

  private async requireBehaviorAnalysis(
    studentProfileId: string,
  ) {
    await this.consentService
      .assertScopeActiveForProfile(
        studentProfileId,
        ConsentScope.BEHAVIOR_ANALYSIS,
      );

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
        "Digital Intelligence analysis is disabled or monitoring is paused.",
      );
    }

    return privacy;
  }

  private async requireAiContext(
    studentProfileId: string,
  ) {
    const privacy =
      await this.requireBehaviorAnalysis(
        studentProfileId,
      );

    await this.consentService
      .assertScopeActiveForProfile(
        studentProfileId,
        ConsentScope.AI_CONTEXT_SHARING,
      );

    if (
      !privacy
        .allowAiContext
    ) {
      throw new ForbiddenException(
        "AI context sharing is disabled in Privacy settings.",
      );
    }

    return privacy;
  }

  private fromDays(
    days: number,
  ) {
    const from =
      new Date();

    from.setUTCDate(
      from.getUTCDate() -
        days +
        1,
    );

    from.setUTCHours(
      0,
      0,
      0,
      0,
    );

    return from;
  }

  private round(
    value: number,
  ) {
    return Math.round(
      value *
        100,
    ) /
      100;
  }

  private roundNullable(
    value:
      number | null,
  ) {
    return value ===
      null
      ? null
      : this.round(
          value,
        );
  }
}
