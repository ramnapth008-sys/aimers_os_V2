import {
  getMockTestWorkspace,
} from "../mock-tests/mock-tests.service";

import type {
  MockTestWorkspace,
} from "../mock-tests/mock-tests.types";

import {
  getPlannerWorkspace,
} from "../planner/planner.service";

import type {
  PlannerWorkspace,
} from "../planner/planner.types";

import {
  buildPredictionWorkspace,
} from "../prediction/prediction.service";

import {
  getAcademicWorkspace,
} from "../subjects/subjects.service";

import type {
  AcademicWorkspace,
  ApiFetch,
  TopicMastery,
} from "../subjects/subjects.types";

import type {
  AnalyticsDataQuality,
  AnalyticsSessionDistribution,
  AnalyticsSubject,
  AnalyticsTimelineItem,
  AnalyticsWorkspace,
} from "./analytics.types";

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  );
}

function average(
  values: readonly number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length
  );
}

function assessed(
  mastery:
    TopicMastery | undefined,
): boolean {
  return Boolean(
    mastery &&
    (
      mastery.level !==
        "NOT_ASSESSED" ||
      mastery.attempts > 0 ||
      mastery.lastAssessedAt
    ),
  );
}

function normalized(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "",
    );
}

function dateKeyInTimeZone(
  value: string,
  timeZone: string,
): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(value),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value ?? "0000";

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value ?? "00";

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function dateLabel(
  dateKey: string,
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      weekday: "short",
    },
  ).format(
    new Date(
      `${dateKey}T00:00:00`,
    ),
  );
}

function hourInTimeZone(
  value: string,
  timeZone: string,
): number {
  const formatted =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        hour: "2-digit",
        hourCycle: "h23",
      },
    ).format(
      new Date(value),
    );

  const hour =
    Number.parseInt(
      formatted,
      10,
    );

  return Number.isFinite(hour)
    ? hour
    : 0;
}

function quality(
  key: string,
  label: string,
  status:
    AnalyticsDataQuality["status"],
  detail: string,
): AnalyticsDataQuality {
  return {
    key,
    label,
    status,
    detail,
  };
}

function buildSessionDistribution(
  planner: PlannerWorkspace,
): AnalyticsSessionDistribution[] {
  const buckets = [
    {
      key: "morning",
      label: "Morning",
      sessionCount: 0,
      totalMinutes: 0,
    },
    {
      key: "afternoon",
      label: "Afternoon",
      sessionCount: 0,
      totalMinutes: 0,
    },
    {
      key: "evening",
      label: "Evening",
      sessionCount: 0,
      totalMinutes: 0,
    },
    {
      key: "night",
      label: "Night",
      sessionCount: 0,
      totalMinutes: 0,
    },
  ];

  const completed =
    planner.sessions.filter(
      (session) =>
        session.status ===
        "COMPLETED",
    );

  for (
    const session
    of completed
  ) {
    const timestamp =
      session.startedAt ??
      session.endedAt ??
      session.updatedAt;

    const hour =
      hourInTimeZone(
        timestamp,
        planner.activity.timeZone,
      );

    const bucket =
      hour >= 6 && hour < 12
        ? buckets[0]
        : hour >= 12 && hour < 17
          ? buckets[1]
          : hour >= 17 && hour < 22
            ? buckets[2]
            : buckets[3];

    bucket.sessionCount += 1;

    bucket.totalMinutes +=
      session.durationMinutes;
  }

  const totalSessions =
    completed.length;

  return buckets.map(
    (bucket) => ({
      ...bucket,

      sharePercent:
        totalSessions === 0
          ? 0
          : clamp(
              (
                bucket.sessionCount /
                totalSessions
              ) *
              100,
            ),
    }),
  );
}

function buildSubjects(
  academic:
    AcademicWorkspace,
  mockTests:
    MockTestWorkspace,
): AnalyticsSubject[] {
  const progressByChapter =
    new Map(
      academic.chapterProgress.map(
        (progress) => [
          progress.chapterId,
          progress,
        ],
      ),
    );

  const masteryByTopic =
    new Map(
      academic.topicMastery.map(
        (mastery) => [
          mastery.topicId,
          mastery,
        ],
      ),
    );

  const prediction =
    buildPredictionWorkspace(
      mockTests,
    );

  return academic.syllabusVersion
    .subjects.map(
      (subject) => {
        const chapters =
          subject.units.flatMap(
            (unit) =>
              unit.chapters,
          );

        const topics =
          chapters.flatMap(
            (chapter) =>
              chapter.topics,
          );

        const assessedMastery =
          topics
            .map(
              (topic) =>
                masteryByTopic.get(
                  topic.id,
                ),
            )
            .filter(
              (
                item,
              ): item is TopicMastery =>
                assessed(item),
            );

        const progress =
          chapters.length === 0
            ? 0
            : clamp(
                chapters.reduce(
                  (
                    total,
                    chapter,
                  ) =>
                    total +
                    (
                      progressByChapter
                        .get(
                          chapter.id,
                        )
                        ?.completionPercent ??
                      0
                    ),
                  0,
                ) /
                chapters.length,
              );

        const completedChapters =
          chapters.filter(
            (chapter) =>
              progressByChapter.get(
                chapter.id,
              )?.state ===
              "COMPLETED",
          ).length;

        const masteryScore =
          assessedMastery.length === 0
            ? 0
            : clamp(
                average(
                  assessedMastery.map(
                    (item) =>
                      item.masteryScore,
                  ),
                ),
              );

        const mockSubject =
          prediction.subjects.find(
            (item) =>
              normalized(item.name) ===
              normalized(
                subject.subject.name,
              ),
          );

        return {
          id: subject.id,
          code:
            subject.subject.code,
          name:
            subject.subject.name,
          syllabusProgressPercent:
            progress,
          completedChapters,
          totalChapters:
            chapters.length,
          assessedTopics:
            assessedMastery.length,
          masteryScore,
          mockScorePercent:
            mockSubject
              ?.scorePercent ??
            null,
          mockAccuracyPercent:
            mockSubject
              ?.accuracyPercent ??
            null,
          mockMovement:
            mockSubject
              ?.movement ??
            null,
          risk:
            mockSubject?.risk ??
            "NO_DATA",
        };
      },
    );
}

function buildTimeline(
  academic:
    AcademicWorkspace,
  planner:
    PlannerWorkspace,
  mockTests:
    MockTestWorkspace,
): AnalyticsTimelineItem[] {
  const chapters =
    academic.syllabusVersion
      .subjects.flatMap(
        (subject) =>
          subject.units.flatMap(
            (unit) =>
              unit.chapters.map(
                (chapter) => ({
                  id:
                    chapter.id,
                  name:
                    chapter.name,
                  subject:
                    subject.subject.name,
                }),
              ),
          ),
      );

  const chapterById =
    new Map(
      chapters.map(
        (chapter) => [
          chapter.id,
          chapter,
        ],
      ),
    );

  const sessions:
    AnalyticsTimelineItem[] =
    planner.sessions
      .filter(
        (session) =>
          session.status ===
            "COMPLETED" &&
          Boolean(
            session.endedAt ??
            session.updatedAt,
          ),
      )
      .map(
        (session) => ({
          id:
            `session-${session.id}`,
          type:
            "STUDY_SESSION",
          title:
            session.studyTask
              ?.title ??
            session.chapter
              ?.name ??
            "Completed study session",
          detail:
            `${session.durationMinutes} min study · ${session.focusMinutes} min focus`,
          occurredAt:
            session.endedAt ??
            session.updatedAt,
          link:
            "/planner",
        }),
      );

  const attempts:
    AnalyticsTimelineItem[] =
    mockTests.attempts
      .filter(
        (attempt) =>
          Boolean(
            attempt.submittedAt,
          ),
      )
      .map(
        (attempt) => ({
          id:
            `test-${attempt.id}`,
          type:
            "MOCK_TEST",
          title:
            attempt.mockTest.title,
          detail:
            `${attempt.percentage}% score · ${attempt.accuracyPercent}% accuracy`,
          occurredAt:
            attempt.submittedAt!,
          link:
            "/mock-tests",
        }),
      );

  const progress:
    AnalyticsTimelineItem[] =
    academic.chapterProgress
      .filter(
        (item) =>
          Boolean(
            item.lastStudiedAt,
          ),
      )
      .map(
        (item) => {
          const chapter =
            chapterById.get(
              item.chapterId,
            );

          return {
            id:
              `chapter-${item.id}`,
            type:
              "CHAPTER_PROGRESS",
            title:
              chapter
                ? `${chapter.subject}: ${chapter.name}`
                : "Chapter progress updated",
            detail:
              `${item.completionPercent}% complete · ${item.revisionCount} revisions`,
            occurredAt:
              item.lastStudiedAt!,
            link:
              "/subjects",
          };
        },
      );

  return [
    ...sessions,
    ...attempts,
    ...progress,
  ]
    .sort(
      (
        left,
        right,
      ) =>
        new Date(
          right.occurredAt,
        ).getTime() -
        new Date(
          left.occurredAt,
        ).getTime(),
    )
    .slice(0, 10);
}

export function buildAnalyticsWorkspace(
  academic:
    AcademicWorkspace,
  planner:
    PlannerWorkspace,
  mockTests:
    MockTestWorkspace,
): AnalyticsWorkspace {
  const prediction =
    buildPredictionWorkspace(
      mockTests,
    );

  const studyDays =
    planner.activity.dailyMinutes
      .map(
        (day) => ({
          ...day,
          label:
            day.dateKey ===
            planner.activity
              .todayDateKey
              ? "Today"
              : dateLabel(
                  day.dateKey,
                ),
          focusRate:
            day.durationMinutes === 0
              ? 0
              : clamp(
                  (
                    day.focusMinutes /
                    day.durationMinutes
                  ) *
                    100,
                ),
        }),
      );

  const totalStudy =
    studyDays.reduce(
      (
        total,
        day,
      ) =>
        total +
        day.durationMinutes,
      0,
    );

  const totalFocus =
    studyDays.reduce(
      (
        total,
        day,
      ) =>
        total +
        day.focusMinutes,
      0,
    );

  const assessedTopics =
    academic.topicMastery.filter(
      (item) =>
        assessed(item),
    );

  const averageMastery =
    assessedTopics.length === 0
      ? 0
      : clamp(
          average(
            assessedTopics.map(
              (item) =>
                item.masteryScore,
            ),
          ),
        );

  const questionOutcomes =
    mockTests.attempts.reduce(
      (
        totals,
        attempt,
      ) => ({
        attempted:
          totals.attempted +
          attempt
            .attemptedQuestions,
        correct:
          totals.correct +
          attempt.correctAnswers,
        incorrect:
          totals.incorrect +
          attempt
            .incorrectAnswers,
        unanswered:
          totals.unanswered +
          attempt
            .unansweredQuestions,
        accuracyPercent: 0,
      }),
      {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        accuracyPercent: 0,
      },
    );

  questionOutcomes.accuracyPercent =
    questionOutcomes.attempted === 0
      ? 0
      : clamp(
          (
            questionOutcomes.correct /
            questionOutcomes.attempted
          ) *
            100,
        );

  const scoresByDate =
    new Map<
      string,
      number[]
    >();

  for (
    const point
    of mockTests.trend
  ) {
    if (!point.submittedAt) {
      continue;
    }

    const key =
      dateKeyInTimeZone(
        point.submittedAt,
        planner.activity.timeZone,
      );

    const scores =
      scoresByDate.get(key) ??
      [];

    scores.push(
      point.percentage,
    );

    scoresByDate.set(
      key,
      scores,
    );
  }

  const studyScorePairs =
    studyDays.map(
      (day) => {
        const scores =
          scoresByDate.get(
            day.dateKey,
          ) ?? [];

        return {
          dateKey:
            day.dateKey,
          label:
            day.label,
          studyMinutes:
            day.durationMinutes,
          focusMinutes:
            day.focusMinutes,
          testScore:
            scores.length === 0
              ? null
              : clamp(
                  average(
                    scores,
                  ),
                ),
          testCount:
            scores.length,
        };
      },
    );

  const pairedStudyScoreDays =
    studyScorePairs.filter(
      (item) =>
        item.testScore !== null &&
        item.studyMinutes > 0,
    ).length;

  const subjects =
    buildSubjects(
      academic,
      mockTests,
    );

  const allChapters =
    academic.syllabusVersion
      .subjects.flatMap(
        (subject) =>
          subject.units.flatMap(
            (unit) =>
              unit.chapters,
          ),
      );

  const progressByChapter =
    new Map(
      academic.chapterProgress.map(
        (progress) => [
          progress.chapterId,
          progress,
        ],
      ),
    );

  const syllabusProgressPercent =
    allChapters.length === 0
      ? 0
      : clamp(
          allChapters.reduce(
            (
              total,
              chapter,
            ) =>
              total +
              (
                progressByChapter.get(
                  chapter.id,
                )?.completionPercent ??
                0
              ),
            0,
          ) /
          allChapters.length,
        );

  const sessionDistribution =
    buildSessionDistribution(
      planner,
    );

  const dataQuality = [
    quality(
      "academic",
      "Academic progress",
      academic.chapterProgress
        .length > 0
        ? "READY"
        : "MISSING",
      academic.chapterProgress
        .length > 0
        ? `${academic.chapterProgress.length} chapter progress records`
        : "No chapter progress has been recorded",
    ),

    quality(
      "planner",
      "Study sessions",
      planner.activity
        .completedSessionCount >= 3
        ? "READY"
        : planner.activity
              .completedSessionCount >
            0
          ? "PARTIAL"
          : "MISSING",
      `${planner.activity.completedSessionCount} completed session${planner.activity.completedSessionCount === 1 ? "" : "s"}`,
    ),

    quality(
      "mock-tests",
      "Mock-test evidence",
      mockTests.summary
        .attemptCount >= 3
        ? "READY"
        : mockTests.summary
              .attemptCount > 0
          ? "PARTIAL"
          : "MISSING",
      `${mockTests.summary.attemptCount} evaluated test${mockTests.summary.attemptCount === 1 ? "" : "s"}`,
    ),

    quality(
      "mastery",
      "Topic mastery",
      assessedTopics.length >= 3
        ? "READY"
        : assessedTopics.length > 0
          ? "PARTIAL"
          : "MISSING",
      `${assessedTopics.length} assessed topic${assessedTopics.length === 1 ? "" : "s"}`,
    ),

    quality(
      "paired-evidence",
      "Study/test pairing",
      pairedStudyScoreDays >= 3
        ? "READY"
        : pairedStudyScoreDays > 0
          ? "PARTIAL"
          : "MISSING",
      pairedStudyScoreDays > 0
        ? `${pairedStudyScoreDays} day${pairedStudyScoreDays === 1 ? " contains" : "s contain"} both study and test evidence`
        : "No same-day study and test evidence",
    ),
  ];

  return {
    programmeName:
      academic.syllabusVersion
        .programme.name,

    timeZone:
      planner.activity.timeZone,

    summary: {
      todayStudyMinutes:
        planner.activity
          .todayMinutes,

      weeklyStudyMinutes:
        planner.activity
          .weeklyMinutes,

      completedSessionCount:
        planner.activity
          .completedSessionCount,

      studyStreakDays:
        planner.activity
          .studyStreakDays,

      focusRate:
        totalStudy === 0
          ? 0
          : clamp(
              (
                totalFocus /
                totalStudy
              ) *
                100,
            ),

      syllabusProgressPercent,

      completedChapters:
        academic.summary
          .completedChapters,

      totalChapters:
        academic.summary
          .chapterCount,

      assessedTopics:
        assessedTopics.length,

      averageMastery,

      mockAttemptCount:
        mockTests.summary
          .attemptCount,

      averageTestScore:
        mockTests.summary
          .averagePercentage,

      averageTestAccuracy:
        mockTests.summary
          .averageAccuracy,

      questionAttempts:
        questionOutcomes
          .attempted,

      correctAnswers:
        questionOutcomes.correct,
    },

    studyDays,
    subjects,

    testTrend:
      mockTests.trend,

    questionOutcomes,

    sessionDistribution,
    studyScorePairs,
    pairedStudyScoreDays,

    weakTopics:
      mockTests.weakTopics,

    recentActivity:
      buildTimeline(
        academic,
        planner,
        mockTests,
      ),

    dataQuality,
    prediction,
  };
}

export async function getAnalyticsWorkspace(
  apiFetch: ApiFetch,
): Promise<AnalyticsWorkspace> {
  const [
    academic,
    planner,
    mockTests,
  ] = await Promise.all([
    getAcademicWorkspace(
      apiFetch,
    ),
    getPlannerWorkspace(
      apiFetch,
    ),
    getMockTestWorkspace(
      apiFetch,
    ),
  ]);

  return buildAnalyticsWorkspace(
    academic,
    planner,
    mockTests,
  );
}
