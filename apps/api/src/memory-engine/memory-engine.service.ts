import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  FlashcardLearningState,
  FlashcardReviewRating,
  FlashcardStatus,
  MockTestAttemptStatus,
  QuestionPracticeItemStatus,
  StudentStatus,
  TopicMasteryLevel,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

type RiskBand =
  | "CRITICAL"
  | "HIGH"
  | "MODERATE"
  | "STABLE"
  | "UNASSESSED";

interface TopicIdentity {
  id: string;
  code: string;
  name: string;
  chapterId: string;
  chapterCode: string;
  chapterName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
}

interface TopicEvidence {
  identity: TopicIdentity;

  mastery: {
    level: TopicMasteryLevel;
    masteryScore: number;
    confidenceScore: number;
    attempts: number;
    correctAnswers: number;
    lastAssessedAt: Date | null;
    nextReviewAt: Date | null;
  } | null;

  chapter: {
    completionPercent: number;
    revisionCount: number;
    questionAttempts: number;
    correctAnswers: number;
    lastStudiedAt: Date | null;
  } | null;

  practice: {
    attempts: number;
    correct: number;
    incorrect: number;
    totalSeconds: number;
  };

  mockTests: {
    attempts: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    weakSignals: number;
  };

  flashcards: {
    cards: number;
    reviews: number;
    strongReviews: number;
    againReviews: number;
    dueNow: number;
    nextDueAt: Date | null;
    lapseCount: number;
    repetitions: number;
    stateCounts:
      Record<
        FlashcardLearningState,
        number
      >;
  };

  lastEvidenceAt: Date | null;
}

interface WeightedScore {
  value: number;
  weight: number;
}

function clampPercent(
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

function safeAccuracy(
  correct: number,
  attempted: number,
): number | null {
  if (attempted <= 0) {
    return null;
  }

  return clampPercent(
    (
      correct /
      attempted
    ) *
      100,
  );
}

function weightedAverage(
  scores: WeightedScore[],
): number | null {
  const usable =
    scores.filter(
      (score) =>
        Number.isFinite(
          score.value,
        ) &&
        score.weight > 0,
    );

  const totalWeight =
    usable.reduce(
      (
        total,
        score,
      ) =>
        total +
        score.weight,
      0,
    );

  if (totalWeight <= 0) {
    return null;
  }

  return clampPercent(
    usable.reduce(
      (
        total,
        score,
      ) =>
        total +
        score.value *
          score.weight,
      0,
    ) /
      totalWeight,
  );
}

function laterDate(
  current: Date | null,
  candidate: Date | null,
): Date | null {
  if (!candidate) {
    return current;
  }

  if (
    !current ||
    candidate > current
  ) {
    return candidate;
  }

  return current;
}

function earlierDate(
  current: Date | null,
  candidate: Date | null,
): Date | null {
  if (!candidate) {
    return current;
  }

  if (
    !current ||
    candidate < current
  ) {
    return candidate;
  }

  return current;
}

function emptyStateCounts():
  Record<
    FlashcardLearningState,
    number
  > {
  return {
    [FlashcardLearningState.NEW]:
      0,

    [FlashcardLearningState.LEARNING]:
      0,

    [FlashcardLearningState.REVIEW]:
      0,

    [FlashcardLearningState.RELEARNING]:
      0,

    [FlashcardLearningState.MASTERED]:
      0,
  };
}

function riskBand(
  riskScore: number,
  hasEvidence: boolean,
): RiskBand {
  if (!hasEvidence) {
    return "UNASSESSED";
  }

  if (riskScore >= 75) {
    return "CRITICAL";
  }

  if (riskScore >= 60) {
    return "HIGH";
  }

  if (riskScore >= 40) {
    return "MODERATE";
  }

  return "STABLE";
}

function addDays(
  date: Date,
  days: number,
): Date {
  return new Date(
    date.getTime() +
      days *
        24 *
        60 *
        60 *
        1000,
  );
}

function toDayKey(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

@Injectable()
export class MemoryEngineService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  private async getStudentContext(
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

          orderBy: {
            createdAt: "asc",
          },
        });

    if (!profile) {
      throw new NotFoundException(
        "Complete student onboarding before using the Memory Engine.",
      );
    }

    const enrollment =
      await this.database
        .studentEnrollment
        .findFirst({
          where: {
            studentProfileId:
              profile.id,

            status:
              AcademicEnrollmentStatus
                .ACTIVE,
          },

          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              enrolledAt: "desc",
            },
          ],
        });

    if (!enrollment) {
      throw new NotFoundException(
        "An active academic enrollment is required before using the Memory Engine.",
      );
    }

    return {
      profile,
      enrollment,
    };
  }

  async getWorkspace(
    userId: string,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const now = new Date();

    const [
      syllabusVersion,
      masteryRecords,
      chapterProgress,
      practiceItems,
      mockTopicResults,
      flashcardSchedules,
      flashcardReviews,
    ] = await Promise.all([
      this.database
        .syllabusVersion
        .findUnique({
          where: {
            id:
              enrollment
                .syllabusVersionId,
          },

          include: {
            programme: true,

            subjects: {
              orderBy: {
                sequenceNumber:
                  "asc",
              },

              include: {
                subject: true,

                units: {
                  orderBy: {
                    sequenceNumber:
                      "asc",
                  },

                  include: {
                    chapters: {
                      orderBy: {
                        sequenceNumber:
                          "asc",
                      },

                      include: {
                        topics: {
                          orderBy: {
                            sequenceNumber:
                              "asc",
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
        .topicMastery
        .findMany({
          where: {
            studentEnrollmentId:
              enrollment.id,
          },
        }),

      this.database
        .chapterProgress
        .findMany({
          where: {
            studentEnrollmentId:
              enrollment.id,
          },
        }),

      this.database
        .questionPracticeItem
        .findMany({
          where: {
            questionPracticeSession: {
              studentProfileId:
                profile.id,
            },

            status: {
              in: [
                QuestionPracticeItemStatus
                  .CORRECT,

                QuestionPracticeItemStatus
                  .INCORRECT,
              ],
            },

            question: {
              topicId: {
                not: null,
              },

              subject: {
                syllabi: {
                  some: {
                    syllabusVersionId:
                      enrollment
                        .syllabusVersionId,
                  },
                },
              },
            },
          },

          select: {
            status: true,
            isCorrect: true,
            timeSpentSeconds:
              true,
            answeredAt: true,

            question: {
              select: {
                topicId: true,
              },
            },
          },
        }),

      this.database
        .mockTestTopicResult
        .findMany({
          where: {
            mockTestAttempt: {
              studentProfileId:
                profile.id,

              status:
                MockTestAttemptStatus
                  .EVALUATED,

              mockTest: {
                OR: [
                  {
                    syllabusVersionId:
                      enrollment
                        .syllabusVersionId,
                  },
                  {
                    syllabusVersionId:
                      null,
                  },
                ],
              },
            },
          },

          select: {
            topicId: true,

            attemptedQuestions:
              true,

            correctAnswers:
              true,

            incorrectAnswers:
              true,

            unansweredQuestions:
              true,

            isWeak: true,

            createdAt: true,
          },
        }),

      this.database
        .flashcardSchedule
        .findMany({
          where: {
            flashcard: {
              studentProfileId:
                profile.id,

              status:
                FlashcardStatus
                  .ACTIVE,

              subject: {
                syllabi: {
                  some: {
                    syllabusVersionId:
                      enrollment
                        .syllabusVersionId,
                  },
                },
              },
            },
          },

          select: {
            state: true,
            dueAt: true,
            repetitions: true,
            lapseCount: true,
            lastReviewedAt: true,

            flashcard: {
              select: {
                topicId: true,
              },
            },
          },
        }),

      this.database
        .flashcardReview
        .findMany({
          where: {
            reviewSession: {
              studentProfileId:
                profile.id,
            },

            flashcard: {
              status:
                FlashcardStatus
                  .ACTIVE,

              subject: {
                syllabi: {
                  some: {
                    syllabusVersionId:
                      enrollment
                        .syllabusVersionId,
                  },
                },
              },
            },
          },

          select: {
            rating: true,
            reviewedAt: true,

            flashcard: {
              select: {
                topicId: true,
              },
            },
          },

          orderBy: {
            reviewedAt:
              "asc",
          },
        }),
    ]);

    if (!syllabusVersion) {
      throw new NotFoundException(
        "The active syllabus version was not found.",
      );
    }

    const topicEvidence =
      new Map<
        string,
        TopicEvidence
      >();

    for (
      const syllabusSubject
      of syllabusVersion.subjects
    ) {
      for (
        const unit
        of syllabusSubject.units
      ) {
        for (
          const chapter
          of unit.chapters
        ) {
          for (
            const topic
            of chapter.topics
          ) {
            topicEvidence.set(
              topic.id,
              {
                identity: {
                  id: topic.id,
                  code:
                    topic.code,
                  name:
                    topic.name,
                  chapterId:
                    chapter.id,
                  chapterCode:
                    chapter.code,
                  chapterName:
                    chapter.name,
                  subjectId:
                    syllabusSubject
                      .subject.id,
                  subjectCode:
                    syllabusSubject
                      .subject.code,
                  subjectName:
                    syllabusSubject
                      .subject.name,
                },

                mastery: null,
                chapter: null,

                practice: {
                  attempts: 0,
                  correct: 0,
                  incorrect: 0,
                  totalSeconds: 0,
                },

                mockTests: {
                  attempts: 0,
                  correct: 0,
                  incorrect: 0,
                  unanswered: 0,
                  weakSignals: 0,
                },

                flashcards: {
                  cards: 0,
                  reviews: 0,
                  strongReviews: 0,
                  againReviews: 0,
                  dueNow: 0,
                  nextDueAt:
                    null,
                  lapseCount: 0,
                  repetitions: 0,
                  stateCounts:
                    emptyStateCounts(),
                },

                lastEvidenceAt:
                  null,
              },
            );
          }
        }
      }
    }

    const masteryByTopic =
      new Map(
        masteryRecords.map(
          (record) => [
            record.topicId,
            record,
          ],
        ),
      );

    const progressByChapter =
      new Map(
        chapterProgress.map(
          (record) => [
            record.chapterId,
            record,
          ],
        ),
      );

    for (
      const evidence
      of topicEvidence.values()
    ) {
      const mastery =
        masteryByTopic.get(
          evidence.identity.id,
        );

      if (mastery) {
        evidence.mastery = {
          level:
            mastery.level,

          masteryScore:
            mastery.masteryScore,

          confidenceScore:
            mastery.confidenceScore,

          attempts:
            mastery.attempts,

          correctAnswers:
            mastery.correctAnswers,

          lastAssessedAt:
            mastery.lastAssessedAt,

          nextReviewAt:
            mastery.nextReviewAt,
        };

        evidence.lastEvidenceAt =
          laterDate(
            evidence
              .lastEvidenceAt,

            mastery
              .lastAssessedAt,
          );
      }

      const progress =
        progressByChapter.get(
          evidence.identity
            .chapterId,
        );

      if (progress) {
        evidence.chapter = {
          completionPercent:
            progress
              .completionPercent,

          revisionCount:
            progress
              .revisionCount,

          questionAttempts:
            progress
              .questionAttempts,

          correctAnswers:
            progress
              .correctAnswers,

          lastStudiedAt:
            progress
              .lastStudiedAt,
        };

        evidence.lastEvidenceAt =
          laterDate(
            evidence
              .lastEvidenceAt,

            progress
              .lastStudiedAt,
          );
      }
    }

    for (
      const item
      of practiceItems
    ) {
      const topicId =
        item.question
          .topicId;

      if (!topicId) {
        continue;
      }

      const evidence =
        topicEvidence.get(
          topicId,
        );

      if (!evidence) {
        continue;
      }

      evidence.practice
        .attempts += 1;

      evidence.practice
        .totalSeconds +=
        item.timeSpentSeconds;

      if (
        item.isCorrect ===
        true
      ) {
        evidence.practice
          .correct += 1;
      } else {
        evidence.practice
          .incorrect += 1;
      }

      evidence.lastEvidenceAt =
        laterDate(
          evidence
            .lastEvidenceAt,

          item.answeredAt,
        );
    }

    for (
      const result
      of mockTopicResults
    ) {
      const evidence =
        topicEvidence.get(
          result.topicId,
        );

      if (!evidence) {
        continue;
      }

      evidence.mockTests
        .attempts +=
        result
          .attemptedQuestions;

      evidence.mockTests
        .correct +=
        result
          .correctAnswers;

      evidence.mockTests
        .incorrect +=
        result
          .incorrectAnswers;

      evidence.mockTests
        .unanswered +=
        result
          .unansweredQuestions;

      if (result.isWeak) {
        evidence.mockTests
          .weakSignals += 1;
      }

      evidence.lastEvidenceAt =
        laterDate(
          evidence
            .lastEvidenceAt,

          result.createdAt,
        );
    }

    const globalStateCounts =
      emptyStateCounts();

    let totalDueNow = 0;

    let nextDueAt:
      Date | null = null;

    let dueNext24Hours = 0;
    let dueNext7Days = 0;
    let dueLater = 0;

    const next24Hours =
      addDays(
        now,
        1,
      );

    const next7Days =
      addDays(
        now,
        7,
      );

    for (
      const schedule
      of flashcardSchedules
    ) {
      globalStateCounts[
        schedule.state
      ] += 1;

      if (
        schedule.dueAt <=
        now
      ) {
        totalDueNow += 1;
      } else if (
        schedule.dueAt <=
        next24Hours
      ) {
        dueNext24Hours += 1;
      } else if (
        schedule.dueAt <=
        next7Days
      ) {
        dueNext7Days += 1;
      } else {
        dueLater += 1;
      }

      nextDueAt =
        earlierDate(
          nextDueAt,
          schedule.dueAt,
        );

      const topicId =
        schedule
          .flashcard.topicId;

      if (!topicId) {
        continue;
      }

      const evidence =
        topicEvidence.get(
          topicId,
        );

      if (!evidence) {
        continue;
      }

      evidence.flashcards
        .cards += 1;

      evidence.flashcards
        .stateCounts[
          schedule.state
        ] += 1;

      evidence.flashcards
        .repetitions +=
        schedule.repetitions;

      evidence.flashcards
        .lapseCount +=
        schedule.lapseCount;

      evidence.flashcards
        .nextDueAt =
        earlierDate(
          evidence
            .flashcards
            .nextDueAt,

          schedule.dueAt,
        );

      if (
        schedule.dueAt <=
        now
      ) {
        evidence.flashcards
          .dueNow += 1;
      }

      evidence.lastEvidenceAt =
        laterDate(
          evidence
            .lastEvidenceAt,

          schedule
            .lastReviewedAt,
        );
    }

    const globalRatingCounts:
      Record<
        FlashcardReviewRating,
        number
      > = {
        [FlashcardReviewRating.AGAIN]:
          0,

        [FlashcardReviewRating.HARD]:
          0,

        [FlashcardReviewRating.GOOD]:
          0,

        [FlashcardReviewRating.EASY]:
          0,
      };

    const reviewTrend =
      new Map<
        string,
        {
          reviews: number;
          strongReviews: number;
          againReviews: number;
        }
      >();

    for (
      const review
      of flashcardReviews
    ) {
      globalRatingCounts[
        review.rating
      ] += 1;

      const dayKey =
        toDayKey(
          review.reviewedAt,
        );

      const day =
        reviewTrend.get(
          dayKey,
        ) ?? {
          reviews: 0,
          strongReviews: 0,
          againReviews: 0,
        };

      day.reviews += 1;

      if (
        review.rating ===
          FlashcardReviewRating
            .GOOD ||
        review.rating ===
          FlashcardReviewRating
            .EASY
      ) {
        day.strongReviews +=
          1;
      }

      if (
        review.rating ===
        FlashcardReviewRating
          .AGAIN
      ) {
        day.againReviews +=
          1;
      }

      reviewTrend.set(
        dayKey,
        day,
      );

      const topicId =
        review.flashcard
          .topicId;

      if (!topicId) {
        continue;
      }

      const evidence =
        topicEvidence.get(
          topicId,
        );

      if (!evidence) {
        continue;
      }

      evidence.flashcards
        .reviews += 1;

      if (
        review.rating ===
          FlashcardReviewRating
            .GOOD ||
        review.rating ===
          FlashcardReviewRating
            .EASY
      ) {
        evidence.flashcards
          .strongReviews +=
          1;
      }

      if (
        review.rating ===
          FlashcardReviewRating
            .AGAIN
      ) {
        evidence.flashcards
          .againReviews +=
          1;
      }

      evidence.lastEvidenceAt =
        laterDate(
          evidence
            .lastEvidenceAt,

          review.reviewedAt,
        );
    }

    const priorities =
      Array.from(
        topicEvidence.values(),
      ).map(
        (evidence) => {
          const practiceAccuracy =
            safeAccuracy(
              evidence
                .practice.correct,

              evidence
                .practice.attempts,
            );

          const mockAccuracy =
            safeAccuracy(
              evidence
                .mockTests.correct,

              evidence
                .mockTests.attempts,
            );

          const flashcardRecall =
            safeAccuracy(
              evidence
                .flashcards
                .strongReviews,

              evidence
                .flashcards
                .reviews,
            );

          const masteryAssessed =
            Boolean(
              evidence.mastery &&
              (
                evidence
                  .mastery
                  .level !==
                  TopicMasteryLevel
                    .NOT_ASSESSED ||
                evidence
                  .mastery
                  .attempts >
                  0 ||
                evidence
                  .mastery
                  .lastAssessedAt
              ),
            );

          const retentionScore =
            weightedAverage(
              [
                ...(masteryAssessed &&
                evidence.mastery
                  ? [
                      {
                        value:
                          evidence
                            .mastery
                            .masteryScore,

                        weight:
                          0.35,
                      },
                    ]
                  : []),

                ...(practiceAccuracy !==
                null
                  ? [
                      {
                        value:
                          practiceAccuracy,

                        weight:
                          0.25,
                      },
                    ]
                  : []),

                ...(mockAccuracy !==
                null
                  ? [
                      {
                        value:
                          mockAccuracy,

                        weight:
                          0.25,
                      },
                    ]
                  : []),

                ...(flashcardRecall !==
                null
                  ? [
                      {
                        value:
                          flashcardRecall,

                        weight:
                          0.15,
                      },
                    ]
                  : []),
              ],
            );

          const hasEvidence =
            retentionScore !==
              null ||
            evidence.flashcards
              .cards >
              0 ||
            (
              evidence.chapter
                ?.completionPercent ??
              0
            ) >
              0;

          const overdueMastery =
            Boolean(
              evidence.mastery
                ?.nextReviewAt &&
              evidence.mastery
                .nextReviewAt <=
                now,
            );

          const duePenalty =
            Math.min(
              20,
              evidence
                .flashcards
                .dueNow *
                5,
            );

          const lapsePenalty =
            Math.min(
              15,
              evidence
                .flashcards
                .lapseCount *
                3,
            );

          const mockPenalty =
            Math.min(
              12,
              evidence
                .mockTests
                .weakSignals *
                6,
            );

          const masteryPenalty =
            overdueMastery
              ? 10
              : 0;

          const baseRisk =
            retentionScore ===
            null
              ? 35
              : 100 -
                retentionScore;

          const riskScore =
            clampPercent(
              baseRisk +
                duePenalty +
                lapsePenalty +
                mockPenalty +
                masteryPenalty,
            );

          const reasons:
            string[] = [];

          if (
            evidence.flashcards
              .dueNow >
            0
          ) {
            reasons.push(
              `${evidence.flashcards.dueNow} flashcard${evidence.flashcards.dueNow === 1 ? "" : "s"} due now`,
            );
          }

          if (
            practiceAccuracy !==
              null &&
            practiceAccuracy <
              60
          ) {
            reasons.push(
              `Question Bank accuracy is ${practiceAccuracy}%`,
            );
          }

          if (
            mockAccuracy !==
              null &&
            mockAccuracy <
              60
          ) {
            reasons.push(
              `Mock-test accuracy is ${mockAccuracy}%`,
            );
          }

          if (
            evidence.mockTests
              .weakSignals >
            0
          ) {
            reasons.push(
              "Detected as weak in an evaluated mock test",
            );
          }

          if (
            evidence.flashcards
              .againReviews >
            0
          ) {
            reasons.push(
              `${evidence.flashcards.againReviews} failed recall${evidence.flashcards.againReviews === 1 ? "" : "s"}`,
            );
          }

          if (
            overdueMastery
          ) {
            reasons.push(
              "Mastery review date is overdue",
            );
          }

          if (
            reasons.length ===
            0
          ) {
            reasons.push(
              hasEvidence
                ? "Current evidence is stable"
                : "No assessed evidence yet",
            );
          }

          const action =
            evidence.flashcards
              .dueNow >
            0
              ? "Review due flashcards"
              : practiceAccuracy !==
                    null &&
                  practiceAccuracy <
                    60
                ? "Start targeted Question Bank practice"
                : mockAccuracy !==
                      null &&
                    mockAccuracy <
                      60
                  ? "Relearn the concept and retest"
                  : overdueMastery
                    ? "Schedule a focused revision"
                    : hasEvidence
                      ? "Maintain with regular review"
                      : "Complete a first assessment";

          return {
            topic:
              evidence.identity,

            riskScore,

            riskBand:
              riskBand(
                riskScore,
                hasEvidence,
              ),

            retentionScore,

            hasEvidence,
            reasons,
            action,

            nextReviewAt:
              earlierDate(
                evidence
                  .flashcards
                  .nextDueAt,

                evidence.mastery
                  ?.nextReviewAt ??
                  null,
              ),

            lastEvidenceAt:
              evidence
                .lastEvidenceAt,

            evidence: {
              mastery:
                evidence.mastery,

              chapter:
                evidence.chapter,

              questionBank: {
                attempts:
                  evidence
                    .practice
                    .attempts,

                correct:
                  evidence
                    .practice
                    .correct,

                incorrect:
                  evidence
                    .practice
                    .incorrect,

                accuracyPercent:
                  practiceAccuracy,

                averageSeconds:
                  evidence
                    .practice
                    .attempts ===
                  0
                    ? null
                    : Math.round(
                        evidence
                          .practice
                          .totalSeconds /
                          evidence
                            .practice
                            .attempts,
                      ),
              },

              mockTests: {
                attemptedQuestions:
                  evidence
                    .mockTests
                    .attempts,

                correctAnswers:
                  evidence
                    .mockTests
                    .correct,

                incorrectAnswers:
                  evidence
                    .mockTests
                    .incorrect,

                unansweredQuestions:
                  evidence
                    .mockTests
                    .unanswered,

                accuracyPercent:
                  mockAccuracy,

                weakSignals:
                  evidence
                    .mockTests
                    .weakSignals,
              },

              flashcards: {
                cards:
                  evidence
                    .flashcards
                    .cards,

                reviews:
                  evidence
                    .flashcards
                    .reviews,

                strongReviews:
                  evidence
                    .flashcards
                    .strongReviews,

                againReviews:
                  evidence
                    .flashcards
                    .againReviews,

                strongRecallPercent:
                  flashcardRecall,

                dueNow:
                  evidence
                    .flashcards
                    .dueNow,

                nextDueAt:
                  evidence
                    .flashcards
                    .nextDueAt,

                lapseCount:
                  evidence
                    .flashcards
                    .lapseCount,

                repetitions:
                  evidence
                    .flashcards
                    .repetitions,

                stateCounts:
                  evidence
                    .flashcards
                    .stateCounts,
              },
            },
          };
        },
      );

    priorities.sort(
      (
        left,
        right,
      ) => {
        if (
          left.hasEvidence !==
          right.hasEvidence
        ) {
          return left
            .hasEvidence
            ? -1
            : 1;
        }

        if (
          right.riskScore !==
          left.riskScore
        ) {
          return (
            right.riskScore -
            left.riskScore
          );
        }

        return left
          .topic.name
          .localeCompare(
            right.topic.name,
          );
      },
    );

    const assessedTopics =
      priorities.filter(
        (item) =>
          item.retentionScore !==
          null,
      );

    const memoryScore =
      assessedTopics.length ===
      0
        ? 0
        : clampPercent(
            assessedTopics.reduce(
              (
                total,
                item,
              ) =>
                total +
                (
                  item.retentionScore ??
                  0
                ),
              0,
            ) /
              assessedTopics.length,
          );

    const subjectMap =
      new Map<
        string,
        {
          subject: {
            id: string;
            code: string;
            name: string;
          };
          topics: typeof priorities;
        }
      >();

    for (
      const priority
      of priorities
    ) {
      const current =
        subjectMap.get(
          priority
            .topic.subjectId,
        ) ?? {
          subject: {
            id:
              priority
                .topic.subjectId,

            code:
              priority
                .topic.subjectCode,

            name:
              priority
                .topic.subjectName,
          },

          topics: [],
        };

      current.topics.push(
        priority,
      );

      subjectMap.set(
        current.subject.id,
        current,
      );
    }

    const subjects =
      Array.from(
        subjectMap.values(),
      ).map(
        (entry) => {
          const assessed =
            entry.topics.filter(
              (item) =>
                item
                  .retentionScore !==
                null,
            );

          const dueCards =
            entry.topics.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.evidence
                  .flashcards
                  .dueNow,
              0,
            );

          const riskTopics =
            entry.topics.filter(
              (item) =>
                item.riskBand ===
                  "CRITICAL" ||
                item.riskBand ===
                  "HIGH",
            ).length;

          const averageRisk =
            entry.topics.length ===
            0
              ? 0
              : clampPercent(
                  entry.topics.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      item.riskScore,
                    0,
                  ) /
                    entry.topics
                      .length,
                );

          const retentionScore =
            assessed.length ===
            0
              ? null
              : clampPercent(
                  assessed.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      (
                        item.retentionScore ??
                        0
                      ),
                    0,
                  ) /
                    assessed.length,
                );

          return {
            subject:
              entry.subject,

            topicCount:
              entry.topics
                .length,

            assessedTopicCount:
              assessed.length,

            criticalOrHighRiskTopics:
              riskTopics,

            dueCards,

            averageRisk,

            retentionScore,
          };
        },
      )
        .sort(
          (
            left,
            right,
          ) =>
            right.averageRisk -
            left.averageRisk,
        );

    const totalReviews =
      flashcardReviews.length;

    const strongReviews =
      globalRatingCounts[
        FlashcardReviewRating
          .GOOD
      ] +
      globalRatingCounts[
        FlashcardReviewRating
          .EASY
      ];

    const totalPracticeAttempts =
      practiceItems.length;

    const totalPracticeCorrect =
      practiceItems.filter(
        (item) =>
          item.isCorrect ===
          true,
      ).length;

    const totalMockAttempts =
      mockTopicResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result
            .attemptedQuestions,
        0,
      );

    const totalMockCorrect =
      mockTopicResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result
            .correctAnswers,
        0,
      );

    const trendStart =
      addDays(
        now,
        -13,
      );

    const retentionTrend =
      Array.from(
        {
          length: 14,
        },
        (
          _,
          index,
        ) => {
          const date =
            addDays(
              trendStart,
              index,
            );

          const key =
            toDayKey(
              date,
            );

          const day =
            reviewTrend.get(
              key,
            ) ?? {
              reviews: 0,
              strongReviews: 0,
              againReviews: 0,
            };

          return {
            date: key,
            reviews:
              day.reviews,

            strongReviews:
              day
                .strongReviews,

            againReviews:
              day.againReviews,

            strongRecallPercent:
              day.reviews ===
              0
                ? null
                : clampPercent(
                    (
                      day
                        .strongReviews /
                      day.reviews
                    ) *
                      100,
                  ),
          };
        },
      );

    return {
      generatedAt:
        now,

      studentProfileId:
        profile.id,

      syllabusVersion: {
        id:
          syllabusVersion.id,

        versionCode:
          syllabusVersion
            .versionCode,

        name:
          syllabusVersion.name,

        programme:
          syllabusVersion
            .programme,
      },

      summary: {
        memoryScore,

        retentionBand:
          memoryScore >= 80
            ? "STRONG"
            : memoryScore >=
                60
              ? "BUILDING"
              : memoryScore >
                  0
                ? "FRAGILE"
                : "UNASSESSED",

        totalTopics:
          priorities.length,

        assessedTopics:
          assessedTopics.length,

        criticalTopics:
          priorities.filter(
            (item) =>
              item.riskBand ===
              "CRITICAL",
          ).length,

        highRiskTopics:
          priorities.filter(
            (item) =>
              item.riskBand ===
              "HIGH",
          ).length,

        dueNow:
          totalDueNow,

        nextDueAt,

        totalFlashcards:
          flashcardSchedules
            .length,

        totalReviews,

        strongRecallPercent:
          totalReviews ===
          0
            ? 0
            : clampPercent(
                (
                  strongReviews /
                  totalReviews
                ) *
                  100,
              ),

        questionBankAccuracyPercent:
          safeAccuracy(
            totalPracticeCorrect,
            totalPracticeAttempts,
          ),

        mockTestAccuracyPercent:
          safeAccuracy(
            totalMockCorrect,
            totalMockAttempts,
          ),
      },

      reviewLoad: {
        overdueOrDueNow:
          totalDueNow,

        dueNext24Hours,
        dueNext7Days,
        dueLater,

        learningStateCounts:
          globalStateCounts,

        ratingCounts:
          globalRatingCounts,
      },

      subjects,

      priorities:
        priorities.slice(
          0,
          20,
        ),

      retentionTrend,
    };
  }
}
