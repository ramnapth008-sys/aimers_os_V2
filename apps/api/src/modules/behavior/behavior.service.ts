import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  ActivityCategory,
  ActivitySource,
  BehaviorSeverity,
  BehaviorSignalType,
  ConsentScope,
  DataConfidenceLevel,
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import type {
  AnalyzeBehaviorDto,
} from "./dto/analyze-behavior.dto";

import type {
  BehaviorOverviewQueryDto,
} from "./dto/behavior-overview-query.dto";

import type {
  BehaviorSignalsQueryDto,
} from "./dto/behavior-signals-query.dto";

interface Interval {
  start: Date;
  end: Date;
}

interface NormalizedSession {
  studentProfileId: string;
  connectedDeviceId:
    string | null;
  source: ActivitySource;
  category: ActivityCategory;
  confidence:
    DataConfidenceLevel;
  appName:
    string | null;
  domain:
    string | null;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  focusedSeconds: number;
  interruptionCount: number;
  concurrentDistractionSeconds:
    number;
  metadata?:
    Prisma.InputJsonValue;
}

interface DailyMetrics {
  summaryDate: Date;
  timezone: string;
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
  lateNightDistractionSeconds:
    number;
  concurrentDistractionSeconds:
    number;
}

interface SignalDefinition {
  type:
    BehaviorSignalType;
  severity:
    BehaviorSeverity;
  confidenceScore: number;
  dataConfidence:
    DataConfidenceLevel;
  title: string;
  description: string;
  evidence:
    Prisma.InputJsonValue;
  recommendedAction?: string;
}

const DISTRACTION_CATEGORIES =
  new Set<ActivityCategory>([
    ActivityCategory.SOCIAL,
    ActivityCategory.ENTERTAINMENT,
    ActivityCategory.COMMUNICATION,
  ]);

const GENERATED_SIGNAL_TYPES:
  BehaviorSignalType[] = [
    BehaviorSignalType.FOCUS_STREAK,
    BehaviorSignalType.CONTEXT_SWITCHING,
    BehaviorSignalType.PROCRASTINATION,
    BehaviorSignalType.LATE_NIGHT_SCROLLING,
    BehaviorSignalType.DISTRACTION_BURST,
    BehaviorSignalType.OVERLOAD_RISK,
    BehaviorSignalType.LECTURE_INCOMPLETE,
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
export class BehaviorService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async analyze(
    userId: string,
    dto: AnalyzeBehaviorDto,
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

    await this.requireBehaviorEnabled(
      profile.id,
    );

    this.validateTimezone(
      dto.timezone,
    );

    const {
      from,
      to,
    } =
      this.analysisWindow(
        dto.days,
      );

    const eventCount =
      await this.database
        .activityEvent
        .count({
          where: {
            studentProfileId:
              profile.id,

            startedAt: {
              gte:
                from,
              lt:
                to,
            },
          },
        });

    if (
      eventCount >
      20000
    ) {
      throw new BadRequestException(
        "This range contains too many raw events for synchronous processing. Use a smaller date range.",
      );
    }

    const [
      events,
      lectures,
    ] =
      await Promise.all([
        this.database
          .activityEvent
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              startedAt: {
                gte:
                  from,
                lt:
                  to,
              },
            },

            orderBy: [
              {
                startedAt:
                  "asc",
              },
              {
                createdAt:
                  "asc",
              },
            ],
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
                lt:
                  to,
              },
            },

            orderBy: {
              startedAt:
                "asc",
            },
          }),
      ]);

    const sessions =
      this.normalizeEvents(
        profile.id,
        events,
        from,
        to,
      );

    this.applyCrossDeviceDistraction(
      sessions,
    );

    const dailyMetrics =
      this.buildDailyMetrics(
        sessions,
        dto.timezone,
      );

    const signals =
      this.detectSignals(
        sessions,
        dailyMetrics,
        lectures,
      );

    const latestMetrics =
      dailyMetrics.at(-1) ??
      this.emptyDailyMetrics(
        new Date(),
        dto.timezone,
      );

    const aggregate =
      this.aggregateMetrics(
        dailyMetrics,
      );

    const scores =
      this.calculateScores(
        aggregate,
      );

    const result =
      await this.database
        .$transaction(
          async (transaction) => {
            await transaction
              .activitySession
              .deleteMany({
                where: {
                  studentProfileId:
                    profile.id,

                  startedAt: {
                    gte:
                      from,
                    lt:
                      to,
                  },
                },
              });

            if (
              sessions.length >
              0
            ) {
              await transaction
                .activitySession
                .createMany({
                  data:
                    sessions.map(
                      (
                        session,
                      ):
                        Prisma.ActivitySessionCreateManyInput => ({
                        studentProfileId:
                          session
                            .studentProfileId,

                        connectedDeviceId:
                          session
                            .connectedDeviceId,

                        source:
                          session.source,

                        category:
                          session.category,

                        confidence:
                          session.confidence,

                        appName:
                          session.appName,

                        domain:
                          session.domain,

                        startedAt:
                          session.startedAt,

                        endedAt:
                          session.endedAt,

                        durationSeconds:
                          session
                            .durationSeconds,

                        focusedSeconds:
                          session
                            .focusedSeconds,

                        interruptionCount:
                          session
                            .interruptionCount,

                        concurrentDistractionSeconds:
                          session
                            .concurrentDistractionSeconds,

                        metadata:
                          session.metadata,
                      }),
                    ),
                });
            }

            for (
              const metrics
              of dailyMetrics
            ) {
              await transaction
                .dailyActivitySummary
                .upsert({
                  where: {
                    studentProfileId_summaryDate_timezone: {
                      studentProfileId:
                        profile.id,

                      summaryDate:
                        metrics
                          .summaryDate,

                      timezone:
                        metrics.timezone,
                    },
                  },

                  create: {
                    studentProfileId:
                      profile.id,

                    summaryDate:
                      metrics
                        .summaryDate,

                    timezone:
                      metrics
                        .timezone,

                    monitoredSeconds:
                      metrics
                        .monitoredSeconds,

                    studySeconds:
                      metrics
                        .studySeconds,

                    productiveSeconds:
                      metrics
                        .productiveSeconds,

                    distractionSeconds:
                      metrics
                        .distractionSeconds,

                    idleSeconds:
                      metrics
                        .idleSeconds,

                    focusedStudySeconds:
                      metrics
                        .focusedStudySeconds,

                    lectureSeconds:
                      metrics
                        .lectureSeconds,

                    revisionSeconds:
                      metrics
                        .revisionSeconds,

                    socialSeconds:
                      metrics
                        .socialSeconds,

                    entertainmentSeconds:
                      metrics
                        .entertainmentSeconds,

                    contextSwitches:
                      metrics
                        .contextSwitches,

                    longestFocusSeconds:
                      metrics
                        .longestFocusSeconds,

                    coveragePercent:
                      metrics
                        .coveragePercent,

                    confidence:
                      metrics
                        .confidence,

                    metrics: {
                      lateNightDistractionSeconds:
                        metrics
                          .lateNightDistractionSeconds,

                      concurrentDistractionSeconds:
                        metrics
                          .concurrentDistractionSeconds,
                    },
                  },

                  update: {
                    monitoredSeconds:
                      metrics
                        .monitoredSeconds,

                    studySeconds:
                      metrics
                        .studySeconds,

                    productiveSeconds:
                      metrics
                        .productiveSeconds,

                    distractionSeconds:
                      metrics
                        .distractionSeconds,

                    idleSeconds:
                      metrics
                        .idleSeconds,

                    focusedStudySeconds:
                      metrics
                        .focusedStudySeconds,

                    lectureSeconds:
                      metrics
                        .lectureSeconds,

                    revisionSeconds:
                      metrics
                        .revisionSeconds,

                    socialSeconds:
                      metrics
                        .socialSeconds,

                    entertainmentSeconds:
                      metrics
                        .entertainmentSeconds,

                    contextSwitches:
                      metrics
                        .contextSwitches,

                    longestFocusSeconds:
                      metrics
                        .longestFocusSeconds,

                    coveragePercent:
                      metrics
                        .coveragePercent,

                    confidence:
                      metrics
                        .confidence,

                    metrics: {
                      lateNightDistractionSeconds:
                        metrics
                          .lateNightDistractionSeconds,

                      concurrentDistractionSeconds:
                        metrics
                          .concurrentDistractionSeconds,
                    },
                  },
                });
            }

            const persistedSignals =
              [];

            for (
              const signal
              of signals
            ) {
              const existing =
                await transaction
                  .behaviorSignal
                  .findFirst({
                    where: {
                      studentProfileId:
                        profile.id,

                      type:
                        signal.type,

                      periodStart:
                        from,

                      periodEnd:
                        to,
                    },

                    orderBy: {
                      detectedAt:
                        "desc",
                    },
                  });

              const data = {
                severity:
                  signal.severity,

                confidenceScore:
                  signal
                    .confidenceScore,

                dataConfidence:
                  signal
                    .dataConfidence,

                title:
                  signal.title,

                description:
                  signal.description,

                evidence:
                  signal.evidence,

                recommendedAction:
                  signal
                    .recommendedAction,

                periodStart:
                  from,

                periodEnd:
                  to,

                detectedAt:
                  new Date(),

                resolvedAt:
                  null,
              };

              const persisted =
                existing
                  ? await transaction
                      .behaviorSignal
                      .update({
                        where: {
                          id:
                            existing.id,
                        },

                        data,
                      })
                  : await transaction
                      .behaviorSignal
                      .create({
                        data: {
                          studentProfileId:
                            profile.id,

                          type:
                            signal.type,

                          ...data,
                        },
                      });

              persistedSignals.push(
                persisted,
              );
            }

            const triggeredTypes =
              new Set(
                signals.map(
                  (signal) =>
                    signal.type,
                ),
              );

            const staleTypes =
              GENERATED_SIGNAL_TYPES
                .filter(
                  (type) =>
                    !triggeredTypes
                      .has(type),
                );

            if (
              staleTypes.length >
              0
            ) {
              await transaction
                .behaviorSignal
                .updateMany({
                  where: {
                    studentProfileId:
                      profile.id,

                    type: {
                      in:
                        staleTypes,
                    },

                    periodStart:
                      from,

                    periodEnd:
                      to,

                    resolvedAt:
                      null,
                  },

                  data: {
                    resolvedAt:
                      new Date(),
                  },
                });
            }

            const snapshot =
              await transaction
                .studentIntelligenceSnapshot
                .create({
                  data: {
                    studentProfileId:
                      profile.id,

                    periodStart:
                      from,

                    periodEnd:
                      to,

                    coveragePercent:
                      aggregate
                        .coveragePercent,

                    predictionConfidence:
                      aggregate
                        .confidence,

                    academicReadinessScore:
                      scores
                        .academicReadinessScore,

                    focusScore:
                      scores
                        .focusScore,

                    revisionConsistencyScore:
                      null,

                    distractionRiskScore:
                      scores
                        .distractionRiskScore,

                    overloadRiskScore:
                      scores
                        .overloadRiskScore,

                    features: {
                      source:
                        "digital-intelligence-v1",

                      timezone:
                        dto.timezone,

                      rawEventCount:
                        eventCount,

                      normalizedSessionCount:
                        sessions.length,

                      analyzedLectureCount:
                        lectures.length,

                      signalTypes:
                        signals.map(
                          (signal) =>
                            signal.type,
                        ),

                      aggregate: {
                        monitoredSeconds:
                          aggregate
                            .monitoredSeconds,

                        studySeconds:
                          aggregate
                            .studySeconds,

                        focusedStudySeconds:
                          aggregate
                            .focusedStudySeconds,

                        distractionSeconds:
                          aggregate
                            .distractionSeconds,

                        concurrentDistractionSeconds:
                          aggregate
                            .concurrentDistractionSeconds,

                        contextSwitches:
                          aggregate
                            .contextSwitches,

                        longestFocusSeconds:
                          aggregate
                            .longestFocusSeconds,
                      },
                    },

                    sourceVersion:
                      "digital-intelligence-v1",
                  },
                });

            return {
              persistedSignals,
              snapshot,
            };
          },
        );

    return {
      success: true,

      period: {
        from,
        to,
        days:
          dto.days,
        timezone:
          dto.timezone,
      },

      processed: {
        rawEvents:
          eventCount,

        normalizedSessions:
          sessions.length,

        dailySummaries:
          dailyMetrics.length,

        lectures:
          lectures.length,

        behaviorSignals:
          result
            .persistedSignals
            .length,
      },

      scores,

      latestDay:
        latestMetrics,

      signals:
        result
          .persistedSignals,

      snapshot:
        result.snapshot,
    };
  }

  async overview(
    userId: string,
    query:
      BehaviorOverviewQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const {
      from,
    } =
      this.analysisWindow(
        query.days,
      );

    const [
      summaries,
      signals,
      latestSnapshot,
      recentSessions,
    ] =
      await Promise.all([
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

            take: 50,
          }),

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
          .activitySession
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

            take: 50,
          }),
      ]);

    return {
      period: {
        days:
          query.days,
        from,
        to:
          new Date(),
      },

      summaries,
      activeSignals:
        signals,

      latestSnapshot,
      recentSessions,
    };
  }

  async listSignals(
    userId: string,
    query:
      BehaviorSignalsQueryDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    return this.database
      .behaviorSignal
      .findMany({
        where: {
          studentProfileId:
            profile.id,

          ...(
            query.includeResolved
              ? {}
              : {
                  resolvedAt:
                    null,
                }
          ),
        },

        orderBy: {
          detectedAt:
            "desc",
        },

        take:
          query.limit,
      });
  }

  private normalizeEvents(
    studentProfileId: string,
    events:
      Array<{
        connectedDeviceId:
          string | null;
        source:
          ActivitySource;
        category:
          ActivityCategory;
        confidence:
          DataConfidenceLevel;
        appName:
          string | null;
        domain:
          string | null;
        startedAt: Date;
        endedAt:
          Date | null;
        durationSeconds:
          number | null;
        foreground: boolean;
      }>,
    from: Date,
    to: Date,
  ): NormalizedSession[] {
    const candidates:
      NormalizedSession[] = [];

    for (const event of events) {
      const start =
        event.startedAt <
        from
          ? from
          : event.startedAt;

      const inferredEnd =
        event.endedAt ??
        (
          event.durationSeconds !==
            null
            ? new Date(
                event
                  .startedAt
                  .getTime() +
                  event
                    .durationSeconds *
                    1000,
              )
            : null
        );

      if (!inferredEnd) {
        continue;
      }

      const end =
        inferredEnd > to
          ? to
          : inferredEnd;

      const durationSeconds =
        Math.max(
          0,
          Math.round(
            (
              end.getTime() -
              start.getTime()
            ) /
              1000,
          ),
        );

      if (
        durationSeconds === 0
      ) {
        continue;
      }

      const isFocused =
        event.foreground &&
        (
          event.category ===
            ActivityCategory.STUDY ||
          event.category ===
            ActivityCategory.PRODUCTIVITY ||
          event.source ===
            ActivitySource.LECTURE
        );

      const current:
        NormalizedSession = {
        studentProfileId,
        connectedDeviceId:
          event
            .connectedDeviceId,
        source:
          event.source,
        category:
          event.category,
        confidence:
          event.confidence,
        appName:
          event.appName,
        domain:
          event.domain,
        startedAt:
          start,
        endedAt:
          end,
        durationSeconds,
        focusedSeconds:
          isFocused
            ? durationSeconds
            : 0,
        interruptionCount:
          0,
        concurrentDistractionSeconds:
          0,
      };

      const previous =
        candidates.at(-1);

      if (
        previous &&
        this.canMerge(
          previous,
          current,
        )
      ) {
        previous.endedAt =
          previous.endedAt >
          current.endedAt
            ? previous.endedAt
            : current.endedAt;

        previous.durationSeconds =
          Math.max(
            0,
            Math.round(
              (
                previous
                  .endedAt
                  .getTime() -
                previous
                  .startedAt
                  .getTime()
              ) /
                1000,
            ),
          );

        previous.focusedSeconds =
          Math.min(
            previous
              .durationSeconds,

            previous
              .focusedSeconds +
              current
                .focusedSeconds,
          );

        previous.confidence =
          this.lowerConfidence(
            previous
              .confidence,
            current
              .confidence,
          );

        continue;
      }

      candidates.push(
        current,
      );
    }

    return candidates;
  }

  private canMerge(
    previous:
      NormalizedSession,
    current:
      NormalizedSession,
  ): boolean {
    const gapSeconds =
      (
        current
          .startedAt
          .getTime() -
        previous
          .endedAt
          .getTime()
      ) /
      1000;

    return (
      previous
        .connectedDeviceId ===
        current
          .connectedDeviceId &&
      previous.source ===
        current.source &&
      previous.category ===
        current.category &&
      previous.appName ===
        current.appName &&
      previous.domain ===
        current.domain &&
      gapSeconds >= 0 &&
      gapSeconds <= 60
    );
  }

  private applyCrossDeviceDistraction(
    sessions:
      NormalizedSession[],
  ) {
    const distractions =
      sessions.filter(
        (session) =>
          DISTRACTION_CATEGORIES
            .has(
              session.category,
            ),
      );

    for (const lecture of sessions) {
      if (
        lecture.source !==
        ActivitySource.LECTURE
      ) {
        continue;
      }

      if (
        !lecture
          .connectedDeviceId
      ) {
        continue;
      }

      let concurrentSeconds =
        0;

      let interruptions =
        0;

      for (
        const distraction
        of distractions
      ) {
        if (
          !distraction
            .connectedDeviceId ||
          distraction
            .connectedDeviceId ===
            lecture
              .connectedDeviceId
        ) {
          continue;
        }

        const overlap =
          this.overlapSeconds(
            lecture,
            distraction,
          );

        if (
          overlap > 0
        ) {
          concurrentSeconds +=
            overlap;

          interruptions += 1;
        }
      }

      lecture
        .concurrentDistractionSeconds =
        Math.min(
          lecture
            .durationSeconds,
          concurrentSeconds,
        );

      lecture
        .interruptionCount =
        interruptions;
    }
  }

  private buildDailyMetrics(
    sessions:
      NormalizedSession[],
    timezone: string,
  ): DailyMetrics[] {
    const grouped =
      new Map<
        string,
        NormalizedSession[]
      >();

    for (const session of sessions) {
      const dateKey =
        this.localDateKey(
          session.startedAt,
          timezone,
        );

      const daySessions =
        grouped.get(
          dateKey,
        ) ?? [];

      daySessions.push(
        session,
      );

      grouped.set(
        dateKey,
        daySessions,
      );
    }

    return [
      ...grouped.entries(),
    ]
      .sort(
        (
          [left],
          [right],
        ) =>
          left.localeCompare(
            right,
          ),
      )
      .map(
        (
          [
            dateKey,
            daySessions,
          ],
        ) => {
          const intervals =
            daySessions.map(
              (session) => ({
                start:
                  session
                    .startedAt,
                end:
                  session
                    .endedAt,
              }),
            );

          const studySessions =
            daySessions.filter(
              (session) =>
                session
                  .category ===
                  ActivityCategory.STUDY ||
                session
                  .source ===
                  ActivitySource.LECTURE,
            );

          const productiveSessions =
            daySessions.filter(
              (session) =>
                session
                  .category ===
                  ActivityCategory.PRODUCTIVITY,
            );

          const distractionSessions =
            daySessions.filter(
              (session) =>
                DISTRACTION_CATEGORIES
                  .has(
                    session.category,
                  ),
            );

          const idleSessions =
            daySessions.filter(
              (session) =>
                session
                  .category ===
                  ActivityCategory.IDLE ||
                session
                  .source ===
                  ActivitySource.IDLE,
            );

          const lectureSessions =
            daySessions.filter(
              (session) =>
                session.source ===
                ActivitySource.LECTURE,
            );

          const socialSessions =
            daySessions.filter(
              (session) =>
                session
                  .category ===
                  ActivityCategory.SOCIAL,
            );

          const entertainmentSessions =
            daySessions.filter(
              (session) =>
                session
                  .category ===
                  ActivityCategory.ENTERTAINMENT,
            );

          const studySeconds =
            this.unionSeconds(
              studySessions,
            );

          const focusedStudySeconds =
            Math.min(
              studySeconds,

              studySessions
                .reduce(
                  (
                    total,
                    session,
                  ) =>
                    total +
                    session
                      .focusedSeconds,
                  0,
                ),
            );

          const contextSwitches =
            this.countContextSwitches(
              daySessions,
            );

          const lateNightDistractionSeconds =
            distractionSessions
              .reduce(
                (
                  total,
                  session,
                ) => {
                  const hour =
                    this.localHour(
                      session
                        .startedAt,
                      timezone,
                    );

                  return (
                    hour >= 23 ||
                    hour < 5
                  )
                    ? total +
                        session
                          .durationSeconds
                    : total;
                },
                0,
              );

          const monitoredSeconds =
            this.unionSecondsFromIntervals(
              intervals,
            );

          return {
            summaryDate:
              new Date(
                `${dateKey}T00:00:00.000Z`,
              ),

            timezone,

            monitoredSeconds,

            studySeconds,

            productiveSeconds:
              studySeconds +
              this.unionSeconds(
                productiveSessions,
              ),

            distractionSeconds:
              this.unionSeconds(
                distractionSessions,
              ),

            idleSeconds:
              this.unionSeconds(
                idleSessions,
              ),

            focusedStudySeconds,

            lectureSeconds:
              this.unionSeconds(
                lectureSessions,
              ),

            revisionSeconds:
              0,

            socialSeconds:
              this.unionSeconds(
                socialSessions,
              ),

            entertainmentSeconds:
              this.unionSeconds(
                entertainmentSessions,
              ),

            contextSwitches,

            longestFocusSeconds:
              studySessions
                .reduce(
                  (
                    longest,
                    session,
                  ) =>
                    Math.max(
                      longest,
                      session
                        .focusedSeconds,
                    ),
                  0,
                ),

            coveragePercent:
              Math.min(
                100,
                (
                  monitoredSeconds /
                  86400
                ) *
                  100,
              ),

            confidence:
              this.weightedConfidence(
                daySessions,
              ),

            lateNightDistractionSeconds,

            concurrentDistractionSeconds:
              lectureSessions
                .reduce(
                  (
                    total,
                    session,
                  ) =>
                    total +
                    session
                      .concurrentDistractionSeconds,
                  0,
                ),
          };
        },
      );
  }

  private detectSignals(
    sessions:
      NormalizedSession[],
    daily:
      DailyMetrics[],
    lectures:
      Array<{
        id: string;
        lectureTitle: string;
        platformName: string;
        completionPercent: number;
        completed: boolean;
        lastProgressAt:
          Date | null;
        confidence:
          DataConfidenceLevel;
      }>,
  ): SignalDefinition[] {
    const aggregate =
      this.aggregateMetrics(
        daily,
      );

    const signals:
      SignalDefinition[] = [];

    if (
      aggregate
        .concurrentDistractionSeconds >=
      300
    ) {
      signals.push({
        type:
          BehaviorSignalType.DISTRACTION_BURST,

        severity:
          aggregate
            .concurrentDistractionSeconds >=
          1800
            ? BehaviorSeverity.HIGH
            : BehaviorSeverity.MEDIUM,

        confidenceScore:
          this.confidenceScore(
            aggregate
              .confidence,
          ),

        dataConfidence:
          aggregate
            .confidence,

        title:
          "Cross-device distraction detected",

        description:
          "Entertainment, social, or communication activity overlapped with lecture sessions on another connected device.",

        evidence: {
          concurrentDistractionSeconds:
            aggregate
              .concurrentDistractionSeconds,

          lectureSessionCount:
            sessions.filter(
              (session) =>
                session.source ===
                ActivitySource.LECTURE,
            ).length,
        },

        recommendedAction:
          "Start a focused lecture session and pause distracting apps on the other device.",
      });
    }

    if (
      aggregate
        .contextSwitches >=
      20
    ) {
      signals.push({
        type:
          BehaviorSignalType.CONTEXT_SWITCHING,

        severity:
          aggregate
            .contextSwitches >=
          60
            ? BehaviorSeverity.HIGH
            : BehaviorSeverity.MEDIUM,

        confidenceScore:
          this.confidenceScore(
            aggregate
              .confidence,
          ),

        dataConfidence:
          aggregate
            .confidence,

        title:
          "Frequent context switching",

        description:
          "The activity timeline shows repeated switching between study, productivity, and distracting categories.",

        evidence: {
          contextSwitches:
            aggregate
              .contextSwitches,

          monitoredSeconds:
            aggregate
              .monitoredSeconds,
        },

        recommendedAction:
          "Use a 25–45 minute single-task focus block before switching apps or subjects.",
      });
    }

    if (
      aggregate
        .distractionSeconds >=
        1800 &&
      aggregate
        .distractionSeconds >
        aggregate
          .studySeconds
    ) {
      signals.push({
        type:
          BehaviorSignalType.PROCRASTINATION,

        severity:
          aggregate
            .distractionSeconds >=
          7200
            ? BehaviorSeverity.HIGH
            : BehaviorSeverity.MEDIUM,

        confidenceScore:
          this.confidenceScore(
            aggregate
              .confidence,
          ),

        dataConfidence:
          aggregate
            .confidence,

        title:
          "Distraction exceeded study time",

        description:
          "Tracked social, entertainment, and communication activity exceeded tracked study activity during this analysis period.",

        evidence: {
          studySeconds:
            aggregate
              .studySeconds,

          distractionSeconds:
            aggregate
              .distractionSeconds,
        },

        recommendedAction:
          "Choose one small study task and complete a protected focus block before returning to optional apps.",
      });
    }

    if (
      aggregate
        .lateNightDistractionSeconds >=
      900
    ) {
      signals.push({
        type:
          BehaviorSignalType.LATE_NIGHT_SCROLLING,

        severity:
          aggregate
            .lateNightDistractionSeconds >=
          3600
            ? BehaviorSeverity.HIGH
            : BehaviorSeverity.MEDIUM,

        confidenceScore:
          this.confidenceScore(
            aggregate
              .confidence,
          ),

        dataConfidence:
          aggregate
            .confidence,

        title:
          "Late-night distraction pattern",

        description:
          "Distracting digital activity was detected between 11 PM and 5 AM in the selected timezone.",

        evidence: {
          lateNightDistractionSeconds:
            aggregate
              .lateNightDistractionSeconds,
        },

        recommendedAction:
          "Set a digital shutdown time and move the next study block earlier in the day.",
      });
    }

    if (
      aggregate
        .longestFocusSeconds >=
      2700
    ) {
      signals.push({
        type:
          BehaviorSignalType.FOCUS_STREAK,

        severity:
          BehaviorSeverity.LOW,

        confidenceScore:
          this.confidenceScore(
            aggregate
              .confidence,
          ),

        dataConfidence:
          aggregate
            .confidence,

        title:
          "Strong focus streak",

        description:
          "A sustained focused study session of at least 45 minutes was detected.",

        evidence: {
          longestFocusSeconds:
            aggregate
              .longestFocusSeconds,

          focusedStudySeconds:
            aggregate
              .focusedStudySeconds,
        },

        recommendedAction:
          "Repeat this focus pattern at the same time or in the same study environment.",
      });
    }

    if (
      aggregate
        .monitoredSeconds >=
      12 * 60 * 60
    ) {
      signals.push({
        type:
          BehaviorSignalType.OVERLOAD_RISK,

        severity:
          aggregate
            .monitoredSeconds >=
          16 * 60 * 60
            ? BehaviorSeverity.HIGH
            : BehaviorSeverity.MEDIUM,

        confidenceScore:
          this.confidenceScore(
            aggregate
              .confidence,
          ),

        dataConfidence:
          aggregate
            .confidence,

        title:
          "High monitored screen exposure",

        description:
          "Total monitored digital activity is high enough to increase fatigue and reduce recovery time.",

        evidence: {
          monitoredSeconds:
            aggregate
              .monitoredSeconds,
        },

        recommendedAction:
          "Add screen-free breaks, movement, hydration, and a fixed sleep window.",
      });
    }

    const staleLectureThreshold =
      new Date(
        Date.now() -
          12 * 60 * 60 * 1000,
      );

    const incompleteLectures =
      lectures.filter(
        (lecture) =>
          !lecture.completed &&
          lecture
            .completionPercent <
            80 &&
          (
            !lecture
              .lastProgressAt ||
            lecture
              .lastProgressAt <
              staleLectureThreshold
          ),
      );

    if (
      incompleteLectures.length >
      0
    ) {
      const confidence =
        this.weightedConfidence(
          incompleteLectures.map(
            (lecture) => ({
              durationSeconds:
                1,
              confidence:
                lecture.confidence,
            }),
          ),
        );

      signals.push({
        type:
          BehaviorSignalType.LECTURE_INCOMPLETE,

        severity:
          incompleteLectures
            .length >= 3
            ? BehaviorSeverity.HIGH
            : BehaviorSeverity.MEDIUM,

        confidenceScore:
          this.confidenceScore(
            confidence,
          ),

        dataConfidence:
          confidence,

        title:
          "Incomplete lectures need attention",

        description:
          "One or more lecture sessions remained below 80% completion without recent progress.",

        evidence: {
          count:
            incompleteLectures
              .length,

          lectures:
            incompleteLectures
              .slice(
                0,
                10,
              )
              .map(
                (lecture) => ({
                  id:
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
                }),
              ),
        },

        recommendedAction:
          "Resume the highest-priority incomplete lecture and finish it in one protected session.",
      });
    }

    return signals;
  }

  private aggregateMetrics(
    daily:
      DailyMetrics[],
  ) {
    const monitoredSeconds =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .monitoredSeconds,
        0,
      );

    const studySeconds =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .studySeconds,
        0,
      );

    const focusedStudySeconds =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .focusedStudySeconds,
        0,
      );

    const distractionSeconds =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .distractionSeconds,
        0,
      );

    const concurrentDistractionSeconds =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .concurrentDistractionSeconds,
        0,
      );

    const lateNightDistractionSeconds =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .lateNightDistractionSeconds,
        0,
      );

    const contextSwitches =
      daily.reduce(
        (
          total,
          item,
        ) =>
          total +
          item
            .contextSwitches,
        0,
      );

    const longestFocusSeconds =
      daily.reduce(
        (
          longest,
          item,
        ) =>
          Math.max(
            longest,
            item
              .longestFocusSeconds,
          ),
        0,
      );

    const coveragePercent =
      daily.length > 0
        ? daily.reduce(
            (
              total,
              item,
            ) =>
              total +
              item
                .coveragePercent,
            0,
          ) /
          daily.length
        : 0;

    return {
      monitoredSeconds,
      studySeconds,
      focusedStudySeconds,
      distractionSeconds,
      concurrentDistractionSeconds,
      lateNightDistractionSeconds,
      contextSwitches,
      longestFocusSeconds,
      coveragePercent,
      confidence:
        this.weightedConfidence(
          daily.map(
            (item) => ({
              durationSeconds:
                Math.max(
                  1,
                  item
                    .monitoredSeconds,
                ),

              confidence:
                item.confidence,
            }),
          ),
        ),
    };
  }

  private calculateScores(
    aggregate:
      ReturnType<
        BehaviorService[
          "aggregateMetrics"
        ]
      >,
  ) {
    const focusScore =
      aggregate
        .studySeconds >
      0
        ? Math.max(
            0,
            Math.min(
              100,
              (
                aggregate
                  .focusedStudySeconds /
                aggregate
                  .studySeconds
              ) *
                100 -
                Math.min(
                  25,
                  aggregate
                    .contextSwitches *
                    0.35,
                ),
            ),
          )
        : 0;

    const attentionTotal =
      aggregate
        .studySeconds +
      aggregate
        .distractionSeconds;

    const distractionRiskScore =
      attentionTotal > 0
        ? Math.min(
            100,
            (
              aggregate
                .distractionSeconds /
              attentionTotal
            ) *
              100 +
              Math.min(
                20,
                (
                  aggregate
                    .concurrentDistractionSeconds /
                  Math.max(
                    1,
                    aggregate
                      .studySeconds,
                  )
                ) *
                  100,
              ),
          )
        : 0;

    const overloadRiskScore =
      Math.min(
        100,
        (
          aggregate
            .monitoredSeconds /
          (
            16 *
            60 *
            60
          )
        ) *
          100,
      );

    const academicReadinessScore =
      aggregate
        .studySeconds >
      0
        ? Math.max(
            0,
            Math.min(
              100,
              focusScore *
                0.65 +
                (
                  100 -
                  distractionRiskScore
                ) *
                  0.35,
            ),
          )
        : null;

    return {
      academicReadinessScore:
        academicReadinessScore ===
        null
          ? null
          : this.roundScore(
              academicReadinessScore,
            ),

      focusScore:
        this.roundScore(
          focusScore,
        ),

      distractionRiskScore:
        this.roundScore(
          distractionRiskScore,
        ),

      overloadRiskScore:
        this.roundScore(
          overloadRiskScore,
        ),
    };
  }

  private countContextSwitches(
    sessions:
      NormalizedSession[],
  ): number {
    const byDevice =
      new Map<
        string,
        NormalizedSession[]
      >();

    for (const session of sessions) {
      const key =
        session
          .connectedDeviceId ??
        "unknown";

      const deviceSessions =
        byDevice.get(
          key,
        ) ?? [];

      deviceSessions.push(
        session,
      );

      byDevice.set(
        key,
        deviceSessions,
      );
    }

    let switches =
      0;

    for (
      const deviceSessions
      of byDevice.values()
    ) {
      deviceSessions.sort(
        (
          left,
          right,
        ) =>
          left
            .startedAt
            .getTime() -
          right
            .startedAt
            .getTime(),
      );

      for (
        let index = 1;
        index <
        deviceSessions.length;
        index += 1
      ) {
        if (
          deviceSessions[index]
            ?.category !==
          deviceSessions[
            index - 1
          ]?.category
        ) {
          switches += 1;
        }
      }
    }

    return switches;
  }

  private unionSeconds(
    sessions:
      Array<{
        startedAt: Date;
        endedAt: Date;
      }>,
  ): number {
    return this
      .unionSecondsFromIntervals(
        sessions.map(
          (session) => ({
            start:
              session.startedAt,
            end:
              session.endedAt,
          }),
        ),
      );
  }

  private unionSecondsFromIntervals(
    intervals:
      Interval[],
  ): number {
    if (
      intervals.length === 0
    ) {
      return 0;
    }

    const sorted =
      intervals
        .filter(
          (interval) =>
            interval.end >
            interval.start,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.start
              .getTime() -
            right.start
              .getTime(),
        );

    if (
      sorted.length === 0
    ) {
      return 0;
    }

    let currentStart =
      sorted[0]!.start;

    let currentEnd =
      sorted[0]!.end;

    let total =
      0;

    for (
      let index = 1;
      index <
      sorted.length;
      index += 1
    ) {
      const interval =
        sorted[index]!;

      if (
        interval.start <=
        currentEnd
      ) {
        if (
          interval.end >
          currentEnd
        ) {
          currentEnd =
            interval.end;
        }

        continue;
      }

      total +=
        currentEnd.getTime() -
        currentStart.getTime();

      currentStart =
        interval.start;

      currentEnd =
        interval.end;
    }

    total +=
      currentEnd.getTime() -
      currentStart.getTime();

    return Math.round(
      total /
        1000,
    );
  }

  private weightedConfidence(
    values:
      Array<{
        durationSeconds: number;
        confidence:
          DataConfidenceLevel;
      }>,
  ): DataConfidenceLevel {
    const totalWeight =
      values.reduce(
        (
          total,
          value,
        ) =>
          total +
          Math.max(
            1,
            value
              .durationSeconds,
          ),
        0,
      );

    if (
      totalWeight === 0
    ) {
      return DataConfidenceLevel.MISSING;
    }

    const weightedRank =
      values.reduce(
        (
          total,
          value,
        ) =>
          total +
          CONFIDENCE_RANK[
            value.confidence
          ] *
            Math.max(
              1,
              value
                .durationSeconds,
            ),
        0,
      ) /
      totalWeight;

    if (
      weightedRank >=
      3.5
    ) {
      return DataConfidenceLevel.EXACT;
    }

    if (
      weightedRank >=
      2.5
    ) {
      return DataConfidenceLevel.VERIFIED;
    }

    if (
      weightedRank >=
      1.5
    ) {
      return DataConfidenceLevel.OBSERVED;
    }

    if (
      weightedRank >=
      0.5
    ) {
      return DataConfidenceLevel.ESTIMATED;
    }

    return DataConfidenceLevel.MISSING;
  }

  private lowerConfidence(
    left:
      DataConfidenceLevel,
    right:
      DataConfidenceLevel,
  ): DataConfidenceLevel {
    return CONFIDENCE_RANK[
      left
    ] <=
      CONFIDENCE_RANK[
        right
      ]
      ? left
      : right;
  }

  private confidenceScore(
    confidence:
      DataConfidenceLevel,
  ): number {
    return {
      [DataConfidenceLevel.MISSING]:
        0,
      [DataConfidenceLevel.ESTIMATED]:
        0.45,
      [DataConfidenceLevel.OBSERVED]:
        0.65,
      [DataConfidenceLevel.VERIFIED]:
        0.85,
      [DataConfidenceLevel.EXACT]:
        0.98,
    }[confidence];
  }

  private overlapSeconds(
    left:
      NormalizedSession,
    right:
      NormalizedSession,
  ): number {
    const start =
      Math.max(
        left
          .startedAt
          .getTime(),
        right
          .startedAt
          .getTime(),
      );

    const end =
      Math.min(
        left
          .endedAt
          .getTime(),
        right
          .endedAt
          .getTime(),
      );

    return Math.max(
      0,
      Math.round(
        (
          end -
          start
        ) /
          1000,
      ),
    );
  }

  private localDateKey(
    date: Date,
    timezone: string,
  ): string {
    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            timezone,
          year:
            "numeric",
          month:
            "2-digit",
          day:
            "2-digit",
        },
      )
        .formatToParts(
          date,
        );

    const values =
      Object.fromEntries(
        parts.map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
      );

    return [
      values.year,
      values.month,
      values.day,
    ].join("-");
  }

  private localHour(
    date: Date,
    timezone: string,
  ): number {
    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone:
            timezone,
          hour:
            "2-digit",
          hourCycle:
            "h23",
        },
      )
        .formatToParts(
          date,
        );

    const hour =
      parts.find(
        (part) =>
          part.type ===
          "hour",
      )?.value;

    return Number(
      hour ?? 0,
    );
  }

  private validateTimezone(
    timezone: string,
  ) {
    try {
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone:
            timezone,
        },
      ).format(
        new Date(),
      );
    } catch {
      throw new BadRequestException(
        "A valid IANA timezone is required.",
      );
    }
  }

  private analysisWindow(
    days: number,
  ) {
    const to =
      new Date();

    to.setUTCHours(
      24,
      0,
      0,
      0,
    );

    const from =
      new Date(
        to,
      );

    from.setUTCDate(
      from.getUTCDate() -
        days,
    );

    return {
      from,
      to,
    };
  }

  private async requireBehaviorEnabled(
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
        "Behavior analysis is disabled or Digital Activity monitoring is paused.",
      );
    }

    return privacy;
  }

  private emptyDailyMetrics(
    date: Date,
    timezone: string,
  ): DailyMetrics {
    return {
      summaryDate:
        new Date(
          `${this.localDateKey(
            date,
            timezone,
          )}T00:00:00.000Z`,
        ),

      timezone,
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
      confidence:
        DataConfidenceLevel.MISSING,
      lateNightDistractionSeconds:
        0,
      concurrentDistractionSeconds:
        0,
    };
  }

  private roundScore(
    value: number,
  ): number {
    return Math.round(
      value *
        100,
    ) /
      100;
  }
}
