import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  MockTestAttemptStatus,
  MockTestStatus,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  RecordMockTestAttemptDto,
} from "./dto/record-mock-test-attempt.dto";

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

@Injectable()
export class MockTestsService {
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
        "Complete student onboarding before using mock tests.",
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
        "An active academic enrollment is required before using mock tests.",
      );
    }

    return {
      profile,
      enrollment,
    };
  }

  private async getPublishedTest(
    mockTestId: string,
    syllabusVersionId: string,
  ) {
    const test =
      await this.database.mockTest
        .findFirst({
          where: {
            id: mockTestId,
            status:
              MockTestStatus.PUBLISHED,

            OR: [
              {
                syllabusVersionId,
              },
              {
                syllabusVersionId:
                  null,
              },
            ],
          },

          include: {
            syllabusVersion: {
              include: {
                programme: true,
              },
            },

            sections: {
              orderBy: {
                sequenceNumber:
                  "asc",
              },

              include: {
                subject: true,

                topicBlueprints: {
                  orderBy: {
                    createdAt:
                      "asc",
                  },

                  include: {
                    topic: {
                      include: {
                        chapter: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

    if (!test) {
      throw new NotFoundException(
        "The published mock test was not found for the active syllabus.",
      );
    }

    return test;
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

    const [
      availableTests,
      attempts,
      weakResults,
    ] = await Promise.all([
      this.database.mockTest
        .findMany({
          where: {
            status:
              MockTestStatus
                .PUBLISHED,

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

          orderBy: [
            {
              publishedAt:
                "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],

          include: {
            sections: {
              orderBy: {
                sequenceNumber:
                  "asc",
              },

              include: {
                subject: true,
              },
            },

            attempts: {
              where: {
                studentProfileId:
                  profile.id,

                status:
                  MockTestAttemptStatus
                    .EVALUATED,
              },

              orderBy: {
                evaluatedAt:
                  "desc",
              },

              take: 1,
            },
          },
        }),

      this.database
        .mockTestAttempt
        .findMany({
          where: {
            studentProfileId:
              profile.id,

            status:
              MockTestAttemptStatus
                .EVALUATED,
          },

          orderBy: {
            evaluatedAt: "desc",
          },

          take: 50,

          include: {
            mockTest: true,

            sectionResults: {
              orderBy: {
                createdAt: "asc",
              },

              include: {
                mockTestSection: {
                  include: {
                    subject: true,
                  },
                },
              },
            },

            topicResults: {
              where: {
                isWeak: true,
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
            },
          },
        }),

      this.database
        .mockTestTopicResult
        .findMany({
          where: {
            isWeak: true,

            mockTestAttempt: {
              studentProfileId:
                profile.id,

              status:
                MockTestAttemptStatus
                  .EVALUATED,
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 200,

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
    ]);

    const attemptCount =
      attempts.length;

    const averagePercentage =
      attemptCount === 0
        ? 0
        : clampPercent(
            attempts.reduce(
              (
                total,
                attempt,
              ) =>
                total +
                attempt
                  .percentage,
              0,
            ) /
            attemptCount,
          );

    const averageAccuracy =
      attemptCount === 0
        ? 0
        : clampPercent(
            attempts.reduce(
              (
                total,
                attempt,
              ) =>
                total +
                attempt
                  .accuracyPercent,
              0,
            ) /
            attemptCount,
          );

    const bestPercentage =
      attempts.reduce(
        (
          best,
          attempt,
        ) =>
          Math.max(
            best,
            attempt.percentage,
          ),
        0,
      );

    const weakTopicMap =
      new Map<
        string,
        {
          topicId: string;
          topic: string;
          chapter: string;
          subject: string;
          occurrences: number;
          totalAccuracy: number;
        }
      >();

    for (
      const result
      of weakResults
    ) {
      const existing =
        weakTopicMap.get(
          result.topicId,
        ) ?? {
          topicId:
            result.topicId,

          topic:
            result.topic.name,

          chapter:
            result.topic
              .chapter.name,

          subject:
            result.topic
              .chapter.unit
              .syllabusSubject
              .subject.name,

          occurrences: 0,
          totalAccuracy: 0,
        };

      existing.occurrences += 1;

      existing.totalAccuracy +=
        result.accuracyPercent;

      weakTopicMap.set(
        result.topicId,
        existing,
      );
    }

    const weakTopics =
      Array.from(
        weakTopicMap.values(),
      )
        .map((item) => ({
          topicId:
            item.topicId,

          topic:
            item.topic,

          chapter:
            item.chapter,

          subject:
            item.subject,

          occurrences:
            item.occurrences,

          averageAccuracy:
            clampPercent(
              item.totalAccuracy /
              item.occurrences,
            ),
        }))
        .sort(
          (
            left,
            right,
          ) =>
            right.occurrences -
              left.occurrences ||
            left.averageAccuracy -
              right.averageAccuracy,
        )
        .slice(0, 12);

    const trend =
      [...attempts]
        .reverse()
        .slice(-10)
        .map((attempt) => ({
          attemptId:
            attempt.id,

          mockTestId:
            attempt.mockTestId,

          title:
            attempt.mockTest.title,

          submittedAt:
            attempt.submittedAt,

          rawScore:
            attempt.rawScore,

          totalMarks:
            attempt.mockTest
              .totalMarks,

          percentage:
            attempt.percentage,

          accuracyPercent:
            attempt
              .accuracyPercent,

          percentile:
            attempt.percentile,

          rank:
            attempt.rank,

          rankOutOf:
            attempt.rankOutOf,
        }));

    return {
      availableTests,
      attempts,
      weakTopics,
      trend,

      summary: {
        availableTestCount:
          availableTests.length,

        attemptCount,

        averagePercentage,
        averageAccuracy,
        bestPercentage,

        latestAttempt:
          attempts[0] ?? null,

        predictionReady:
          attemptCount >= 3,
      },
    };
  }

  async getTest(
    userId: string,
    mockTestId: string,
  ) {
    const {
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    return this.getPublishedTest(
      mockTestId,
      enrollment
        .syllabusVersionId,
    );
  }

  async recordAttempt(
    userId: string,
    mockTestId: string,
    dto:
      RecordMockTestAttemptDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const test =
      await this.getPublishedTest(
        mockTestId,
        enrollment
          .syllabusVersionId,
      );

    if (
      dto.rank &&
      dto.rankOutOf &&
      dto.rank > dto.rankOutOf
    ) {
      throw new BadRequestException(
        "rank cannot be greater than rankOutOf.",
      );
    }

    const sectionMap =
      new Map(
        test.sections.map(
          (section) => [
            section.id,
            section,
          ],
        ),
      );

    if (
      dto.sections.length !==
      test.sections.length
    ) {
      throw new BadRequestException(
        "A result is required for every test section.",
      );
    }

    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unansweredQuestions = 0;
    let rawScore = 0;

    const normalizedSections =
      dto.sections.map(
        (sectionResult) => {
          const section =
            sectionMap.get(
              sectionResult
                .sectionId,
            );

          if (!section) {
            throw new BadRequestException(
              "A section result does not belong to this mock test.",
            );
          }

          if (
            sectionResult
              .attemptedQuestions !==
            sectionResult
                .correctAnswers +
              sectionResult
                .incorrectAnswers
          ) {
            throw new BadRequestException(
              `${section.name}: attemptedQuestions must equal correctAnswers plus incorrectAnswers.`,
            );
          }

          if (
            sectionResult
              .attemptedQuestions >
            section.totalQuestions
          ) {
            throw new BadRequestException(
              `${section.name}: attempted questions exceed the section total.`,
            );
          }

          const unanswered =
            section.totalQuestions -
            sectionResult
              .attemptedQuestions;

          const score =
            sectionResult
              .correctAnswers *
              section
                .marksPerCorrect -
            sectionResult
              .incorrectAnswers *
              section
                .negativeMarksPerWrong;

          const accuracy =
            sectionResult
              .attemptedQuestions === 0
              ? 0
              : clampPercent(
                  (
                    sectionResult
                      .correctAnswers /
                    sectionResult
                      .attemptedQuestions
                  ) *
                  100,
                );

          const topicResults =
            sectionResult
              .topicResults ?? [];

          for (
            const topicResult
            of topicResults
          ) {
            if (
              topicResult
                .attemptedQuestions !==
              topicResult
                  .correctAnswers +
                topicResult
                  .incorrectAnswers
            ) {
              throw new BadRequestException(
                "A topic result has inconsistent attempted, correct and incorrect counts.",
              );
            }

            const topicBelongs =
              test.sections.some(
                (testSection) =>
                  testSection
                    .topicBlueprints
                    .some(
                      (blueprint) =>
                        blueprint
                          .topicId ===
                        topicResult
                          .topicId,
                    ),
              );

            if (
              test.sections.some(
                (testSection) =>
                  testSection
                    .topicBlueprints
                    .length > 0,
              ) &&
              !topicBelongs
            ) {
              throw new BadRequestException(
                "A topic result does not belong to this mock-test blueprint.",
              );
            }
          }

          attemptedQuestions +=
            sectionResult
              .attemptedQuestions;

          correctAnswers +=
            sectionResult
              .correctAnswers;

          incorrectAnswers +=
            sectionResult
              .incorrectAnswers;

          unansweredQuestions +=
            unanswered;

          rawScore += score;

          return {
            section,
            sectionResult,
            unanswered,
            score,
            accuracy,
            topicResults,
          };
        },
      );

    if (
      attemptedQuestions >
      test.totalQuestions
    ) {
      throw new BadRequestException(
        "Attempted questions exceed the mock-test total.",
      );
    }

    const percentage =
      test.totalMarks === 0
        ? 0
        : clampPercent(
            (
              rawScore /
              test.totalMarks
            ) *
            100,
          );

    const accuracyPercent =
      attemptedQuestions === 0
        ? 0
        : clampPercent(
            (
              correctAnswers /
              attemptedQuestions
            ) *
            100,
          );

    const submittedAt =
      dto.submittedAt
        ? new Date(
            dto.submittedAt,
          )
        : new Date();

    return this.database
      .$transaction(
        async (transaction) => {
          const latestAttempt =
            await transaction
              .mockTestAttempt
              .findFirst({
                where: {
                  studentProfileId:
                    profile.id,

                  mockTestId:
                    test.id,
                },

                orderBy: {
                  attemptNumber:
                    "desc",
                },

                select: {
                  attemptNumber:
                    true,
                },
              });

          const attempt =
            await transaction
              .mockTestAttempt
              .create({
                data: {
                  studentProfileId:
                    profile.id,

                  mockTestId:
                    test.id,

                  attemptNumber:
                    (
                      latestAttempt
                        ?.attemptNumber ??
                      0
                    ) + 1,

                  status:
                    MockTestAttemptStatus
                      .EVALUATED,

                  startedAt:
                    new Date(
                      submittedAt
                        .getTime() -
                      dto
                        .durationSeconds *
                      1000,
                    ),

                  submittedAt,
                  evaluatedAt:
                    new Date(),

                  durationSeconds:
                    dto.durationSeconds,

                  attemptedQuestions,
                  correctAnswers,
                  incorrectAnswers,
                  unansweredQuestions,
                  rawScore,
                  percentage,
                  accuracyPercent,

                  percentile:
                    dto.percentile,

                  rank:
                    dto.rank,

                  rankOutOf:
                    dto.rankOutOf,

                  notes:
                    dto.notes
                      ?.trim() ||
                    null,
                },
              });

          for (
            const result
            of normalizedSections
          ) {
            await transaction
              .mockTestSectionResult
              .create({
                data: {
                  mockTestAttemptId:
                    attempt.id,

                  mockTestSectionId:
                    result.section.id,

                  attemptedQuestions:
                    result.sectionResult
                      .attemptedQuestions,

                  correctAnswers:
                    result.sectionResult
                      .correctAnswers,

                  incorrectAnswers:
                    result.sectionResult
                      .incorrectAnswers,

                  unansweredQuestions:
                    result.unanswered,

                  score:
                    result.score,

                  maxScore:
                    result.section
                      .totalMarks,

                  accuracyPercent:
                    result.accuracy,

                  timeSpentSeconds:
                    result.sectionResult
                      .timeSpentSeconds ??
                    0,
                },
              });

            for (
              const topicResult
              of result.topicResults
            ) {
              const topicAccuracy =
                topicResult
                  .attemptedQuestions ===
                0
                  ? 0
                  : clampPercent(
                      (
                        topicResult
                          .correctAnswers /
                        topicResult
                          .attemptedQuestions
                      ) *
                      100,
                    );

              const topicScore =
                topicResult
                  .correctAnswers *
                  result.section
                    .marksPerCorrect -
                topicResult
                  .incorrectAnswers *
                  result.section
                    .negativeMarksPerWrong;

              await transaction
                .mockTestTopicResult
                .create({
                  data: {
                    mockTestAttemptId:
                      attempt.id,

                    topicId:
                      topicResult
                        .topicId,

                    attemptedQuestions:
                      topicResult
                        .attemptedQuestions,

                    correctAnswers:
                      topicResult
                        .correctAnswers,

                    incorrectAnswers:
                      topicResult
                        .incorrectAnswers,

                    unansweredQuestions:
                      0,

                    score:
                      topicScore,

                    accuracyPercent:
                      topicAccuracy,

                    isWeak:
                      topicResult
                        .attemptedQuestions >
                        0 &&
                      topicAccuracy < 60,
                  },
                });
            }
          }

          return transaction
            .mockTestAttempt
            .findUniqueOrThrow({
              where: {
                id: attempt.id,
              },

              include: {
                mockTest: true,

                sectionResults: {
                  orderBy: {
                    createdAt:
                      "asc",
                  },

                  include: {
                    mockTestSection: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },

                topicResults: {
                  include: {
                    topic: {
                      include: {
                        chapter: true,
                      },
                    },
                  },
                },
              },
            });
        },
      );
  }

  async deleteAttempt(
    userId: string,
    attemptId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const attempt =
      await this.database
        .mockTestAttempt
        .findFirst({
          where: {
            id: attemptId,

            studentProfileId:
              profile.id,
          },
        });

    if (!attempt) {
      throw new NotFoundException(
        "The mock-test attempt was not found.",
      );
    }

    await this.database
      .mockTestAttempt
      .delete({
        where: {
          id: attempt.id,
        },
      });

    return {
      deleted: true,
      attemptId,
    };
  }
}
