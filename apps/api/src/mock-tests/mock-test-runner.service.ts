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
  Prisma,
  QuestionStatus,
  QuestionType,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  SaveMockTestResponseDto,
} from "./dto/save-mock-test-response.dto";

import type {
  SubmitMockTestRunnerAttemptDto,
} from "./dto/submit-mock-test-runner-attempt.dto";

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

const runnerAttemptInclude = {
  mockTest: true,

  questionResponses: {
    include: {
      selectedOption: true,

      mockTestQuestion: {
        include: {
          mockTestSection: {
            include: {
              subject: true,
            },
          },

          question: {
            include: {
              subject: true,
              chapter: true,
              topic: true,

              options: {
                orderBy: {
                  sequenceNumber:
                    "asc" as const,
                },
              },
            },
          },
        },
      },
    },
  },

  sectionResults: {
    orderBy: {
      createdAt:
        "asc" as const,
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
    orderBy: {
      createdAt:
        "asc" as const,
    },

    include: {
      topic: {
        include: {
          chapter: true,
        },
      },
    },
  },
} satisfies Prisma.MockTestAttemptInclude;

type RunnerAttemptRecord =
  Prisma.MockTestAttemptGetPayload<{
    include:
      typeof runnerAttemptInclude;
  }>;

interface SectionAggregate {
  sectionId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  maxScore: number;
  timeSpentSeconds: number;
}

interface TopicAggregate {
  topicId: string;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
}

@Injectable()
export class MockTestRunnerService {
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

  private async getPublishedRunnerTest(
    mockTestId: string,
    syllabusVersionId: string,
  ) {
    const test =
      await this.database.mockTest
        .findFirst({
          where: {
            id: mockTestId,

            status:
              MockTestStatus
                .PUBLISHED,

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
            sections: {
              orderBy: {
                sequenceNumber:
                  "asc",
              },

              include: {
                subject: true,

                questions: {
                  orderBy: {
                    sequenceNumber:
                      "asc",
                  },

                  include: {
                    question: {
                      include: {
                        options: {
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
        });

    if (!test) {
      throw new NotFoundException(
        "The published mock test was not found for the active syllabus.",
      );
    }

    return test;
  }

  private validateRunnableTest(
    test: Awaited<
      ReturnType<
        MockTestRunnerService[
          "getPublishedRunnerTest"
        ]
      >
    >,
  ) {
    const assignedQuestions =
      test.sections.flatMap(
        (section) =>
          section.questions,
      );

    if (
      assignedQuestions.length ===
      0
    ) {
      throw new BadRequestException(
        "This mock test does not have assigned runner questions yet.",
      );
    }

    if (
      assignedQuestions.length !==
      test.totalQuestions
    ) {
      throw new BadRequestException(
        "This mock test has an incomplete question assignment.",
      );
    }

    const assignedMarks =
      assignedQuestions.reduce(
        (
          total,
          question,
        ) =>
          total +
          question.marks,
        0,
      );

    if (
      assignedMarks !==
      test.totalMarks
    ) {
      throw new BadRequestException(
        "The assigned question marks do not match the mock-test total.",
      );
    }

    for (
      const assigned
      of assignedQuestions
    ) {
      if (
        assigned.question.status !==
        QuestionStatus.PUBLISHED
      ) {
        throw new BadRequestException(
          "Every assigned runner question must be published.",
        );
      }

      if (
        assigned.question.type !==
        QuestionType.SINGLE_CORRECT
      ) {
        throw new BadRequestException(
          "The current mock-test runner supports single-correct questions only.",
        );
      }

      const correctOptionCount =
        assigned.question.options
          .filter(
            (option) =>
              option.isCorrect,
          )
          .length;

      if (
        correctOptionCount !== 1
      ) {
        throw new BadRequestException(
          "Every assigned runner question must have exactly one correct option.",
        );
      }
    }

    return assignedQuestions;
  }

  private async getOwnedAttemptRecord(
    studentProfileId: string,
    attemptId: string,
  ) {
    const attempt =
      await this.database
        .mockTestAttempt
        .findFirst({
          where: {
            id: attemptId,

            studentProfileId,
          },

          include:
            runnerAttemptInclude,
        });

    if (!attempt) {
      throw new NotFoundException(
        "The mock-test runner attempt was not found.",
      );
    }

    return attempt;
  }

  private isExpired(
    attempt:
      RunnerAttemptRecord,
  ): boolean {
    if (
      attempt.status !==
        MockTestAttemptStatus
          .IN_PROGRESS ||
      !attempt.startedAt
    ) {
      return false;
    }

    const expiresAt =
      attempt.startedAt
        .getTime() +
      attempt.mockTest
        .durationMinutes *
        60 *
        1000;

    return Date.now() >= expiresAt;
  }

  private serializeAttempt(
    attempt:
      RunnerAttemptRecord,
  ) {
    const evaluated =
      attempt.status ===
      MockTestAttemptStatus
        .EVALUATED;

    const sortedResponses =
      [
        ...attempt
          .questionResponses,
      ].sort(
        (
          left,
          right,
        ) =>
          left
            .mockTestQuestion
            .mockTestSection
            .sequenceNumber -
            right
              .mockTestQuestion
              .mockTestSection
              .sequenceNumber ||
          left
            .mockTestQuestion
            .sequenceNumber -
            right
              .mockTestQuestion
              .sequenceNumber,
      );

    const sectionMap =
      new Map<
        string,
        {
          id: string;
          name: string;
          sequenceNumber: number;
          subject:
            RunnerAttemptRecord[
              "questionResponses"
            ][number][
              "mockTestQuestion"
            ][
              "mockTestSection"
            ]["subject"];
          questions: Array<{
            mockTestQuestionId:
              string;
            globalSequenceNumber:
              number;
            sequenceNumber:
              number;
            marks: number;
            negativeMarks: number;
            response: {
              selectedOptionId:
                string | null;
              isMarkedForReview:
                boolean;
              timeSpentSeconds:
                number;
              answeredAt:
                Date | null;
              isCorrect:
                boolean | null;
              awardedMarks:
                number;
            };
            question: {
              id: string;
              code: string;
              type: QuestionType;
              difficulty:
                RunnerAttemptRecord[
                  "questionResponses"
                ][number][
                  "mockTestQuestion"
                ]["question"][
                  "difficulty"
                ];
              stem: string;
              explanation:
                string | null;
              subject:
                RunnerAttemptRecord[
                  "questionResponses"
                ][number][
                  "mockTestQuestion"
                ]["question"][
                  "subject"
                ];
              chapter:
                RunnerAttemptRecord[
                  "questionResponses"
                ][number][
                  "mockTestQuestion"
                ]["question"][
                  "chapter"
                ];
              topic:
                RunnerAttemptRecord[
                  "questionResponses"
                ][number][
                  "mockTestQuestion"
                ]["question"][
                  "topic"
                ];
              options: Array<{
                id: string;
                label: string;
                text: string;
                sequenceNumber:
                  number;
              }>;
              correctOptionId:
                string | null;
            };
          }>;
        }
      >();

    sortedResponses.forEach(
      (
        response,
        globalIndex,
      ) => {
        const assigned =
          response
            .mockTestQuestion;

        const section =
          assigned
            .mockTestSection;

        const question =
          assigned.question;

        const existing =
          sectionMap.get(
            section.id,
          ) ?? {
            id: section.id,
            name: section.name,

            sequenceNumber:
              section
                .sequenceNumber,

            subject:
              section.subject,

            questions: [],
          };

        const correctOption =
          evaluated
            ? question.options
                .find(
                  (option) =>
                    option
                      .isCorrect,
                ) ?? null
            : null;

        existing.questions.push({
          mockTestQuestionId:
            assigned.id,

          globalSequenceNumber:
            globalIndex + 1,

          sequenceNumber:
            assigned
              .sequenceNumber,

          marks:
            assigned.marks,

          negativeMarks:
            assigned
              .negativeMarks,

          response: {
            selectedOptionId:
              response
                .selectedOptionId,

            isMarkedForReview:
              response
                .isMarkedForReview,

            timeSpentSeconds:
              response
                .timeSpentSeconds,

            answeredAt:
              response.answeredAt,

            isCorrect:
              evaluated
                ? response
                    .isCorrect
                : null,

            awardedMarks:
              evaluated
                ? response
                    .awardedMarks
                : 0,
          },

          question: {
            id: question.id,
            code: question.code,
            type: question.type,

            difficulty:
              question
                .difficulty,

            stem:
              question.stem,

            explanation:
              evaluated
                ? question
                    .explanation
                : null,

            subject:
              question.subject,

            chapter:
              question.chapter,

            topic:
              question.topic,

            options:
              question.options.map(
                (option) => ({
                  id: option.id,
                  label:
                    option.label,
                  text: option.text,

                  sequenceNumber:
                    option
                      .sequenceNumber,
                }),
              ),

            correctOptionId:
              correctOption?.id ??
              null,
          },
        });

        sectionMap.set(
          section.id,
          existing,
        );
      },
    );

    const expiresAt =
      attempt.startedAt
        ? new Date(
            attempt.startedAt
              .getTime() +
            attempt.mockTest
              .durationMinutes *
              60 *
              1000,
          )
        : null;

    const remainingSeconds =
      expiresAt &&
      attempt.status ===
        MockTestAttemptStatus
          .IN_PROGRESS
        ? Math.max(
            0,
            Math.ceil(
              (
                expiresAt
                  .getTime() -
                Date.now()
              ) /
                1000,
            ),
          )
        : 0;

    return {
      id: attempt.id,
      studentProfileId:
        attempt.studentProfileId,
      mockTestId:
        attempt.mockTestId,
      attemptNumber:
        attempt.attemptNumber,
      status:
        attempt.status,
      startedAt:
        attempt.startedAt,
      submittedAt:
        attempt.submittedAt,
      evaluatedAt:
        attempt.evaluatedAt,
      expiresAt,
      remainingSeconds,
      durationSeconds:
        attempt.durationSeconds,
      attemptedQuestions:
        attempt.attemptedQuestions,
      correctAnswers:
        attempt.correctAnswers,
      incorrectAnswers:
        attempt.incorrectAnswers,
      unansweredQuestions:
        attempt.unansweredQuestions,
      rawScore:
        attempt.rawScore,
      percentage:
        attempt.percentage,
      accuracyPercent:
        attempt.accuracyPercent,
      notes:
        attempt.notes,

      mockTest: {
        id:
          attempt.mockTest.id,
        code:
          attempt.mockTest.code,
        title:
          attempt.mockTest.title,
        description:
          attempt.mockTest.description,
        instructions:
          attempt.mockTest.instructions,
        scope:
          attempt.mockTest.scope,
        totalQuestions:
          attempt.mockTest.totalQuestions,
        totalMarks:
          attempt.mockTest.totalMarks,
        durationMinutes:
          attempt.mockTest.durationMinutes,
      },

      sections:
        Array.from(
          sectionMap.values(),
        ).sort(
          (
            left,
            right,
          ) =>
            left.sequenceNumber -
            right.sequenceNumber,
        ),

      sectionResults:
        evaluated
          ? attempt.sectionResults
          : [],

      topicResults:
        evaluated
          ? attempt.topicResults
          : [],
    };
  }

  private async evaluateAttempt(
    studentProfileId: string,
    attemptId: string,
    input?: {
      durationSeconds?:
        number;
      notes?: string;
    },
  ) {
    const attempt =
      await this.getOwnedAttemptRecord(
        studentProfileId,
        attemptId,
      );

    if (
      attempt.status ===
      MockTestAttemptStatus
        .EVALUATED
    ) {
      return;
    }

    if (
      attempt.status !==
      MockTestAttemptStatus
        .IN_PROGRESS
    ) {
      throw new BadRequestException(
        "Only an in-progress runner attempt can be submitted.",
      );
    }

    const sectionAggregates =
      new Map<
        string,
        SectionAggregate
      >();

    const topicAggregates =
      new Map<
        string,
        TopicAggregate
      >();

    const responseUpdates:
      Array<{
        responseId: string;
        isCorrect:
          boolean | null;
        awardedMarks:
          number;
      }> = [];

    for (
      const response
      of attempt.questionResponses
    ) {
      const assigned =
        response.mockTestQuestion;

      const question =
        assigned.question;

      const section =
        assigned.mockTestSection;

      const correctOption =
        question.options.find(
          (option) =>
            option.isCorrect,
        );

      if (!correctOption) {
        throw new BadRequestException(
          `Question ${question.code} does not have a valid correct option.`,
        );
      }

      const attempted =
        response.selectedOptionId !==
        null;

      const isCorrect =
        attempted
          ? response.selectedOptionId ===
            correctOption.id
          : null;

      const awardedMarks =
        !attempted
          ? 0
          : isCorrect
            ? assigned.marks
            : -assigned.negativeMarks;

      responseUpdates.push({
        responseId:
          response.id,
        isCorrect,
        awardedMarks,
      });

      const sectionAggregate =
        sectionAggregates.get(
          section.id,
        ) ?? {
          sectionId:
            section.id,
          totalQuestions: 0,
          attemptedQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          unansweredQuestions: 0,
          score: 0,
          maxScore: 0,
          timeSpentSeconds: 0,
        };

      sectionAggregate.totalQuestions +=
        1;
      sectionAggregate.maxScore +=
        assigned.marks;
      sectionAggregate.timeSpentSeconds +=
        response.timeSpentSeconds;

      if (!attempted) {
        sectionAggregate.unansweredQuestions +=
          1;
      } else {
        sectionAggregate.attemptedQuestions +=
          1;

        if (isCorrect) {
          sectionAggregate.correctAnswers +=
            1;
        } else {
          sectionAggregate.incorrectAnswers +=
            1;
        }
      }

      sectionAggregate.score +=
        awardedMarks;

      sectionAggregates.set(
        section.id,
        sectionAggregate,
      );

      if (question.topicId) {
        const topicAggregate =
          topicAggregates.get(
            question.topicId,
          ) ?? {
            topicId:
              question.topicId,
            attemptedQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            unansweredQuestions: 0,
            score: 0,
          };

        if (!attempted) {
          topicAggregate.unansweredQuestions +=
            1;
        } else {
          topicAggregate.attemptedQuestions +=
            1;

          if (isCorrect) {
            topicAggregate.correctAnswers +=
              1;
          } else {
            topicAggregate.incorrectAnswers +=
              1;
          }
        }

        topicAggregate.score +=
          awardedMarks;

        topicAggregates.set(
          question.topicId,
          topicAggregate,
        );
      }
    }

    const sections =
      Array.from(
        sectionAggregates.values(),
      );

    const attemptedQuestions =
      sections.reduce(
        (
          total,
          section,
        ) =>
          total +
          section.attemptedQuestions,
        0,
      );

    const correctAnswers =
      sections.reduce(
        (
          total,
          section,
        ) =>
          total +
          section.correctAnswers,
        0,
      );

    const incorrectAnswers =
      sections.reduce(
        (
          total,
          section,
        ) =>
          total +
          section.incorrectAnswers,
        0,
      );

    const unansweredQuestions =
      sections.reduce(
        (
          total,
          section,
        ) =>
          total +
          section.unansweredQuestions,
        0,
      );

    const rawScore =
      sections.reduce(
        (
          total,
          section,
        ) =>
          total +
          section.score,
        0,
      );

    const percentage =
      attempt.mockTest.totalMarks ===
      0
        ? 0
        : clampPercent(
            (
              rawScore /
              attempt.mockTest.totalMarks
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

    const elapsedSeconds =
      attempt.startedAt
        ? Math.max(
            0,
            Math.round(
              (
                Date.now() -
                attempt.startedAt.getTime()
              ) /
                1000,
            ),
          )
        : 0;

    const maxDurationSeconds =
      attempt.mockTest.durationMinutes *
      60;

    const durationSeconds =
      Math.min(
        maxDurationSeconds,
        Math.max(
          0,
          input?.durationSeconds ??
            elapsedSeconds,
        ),
      );

    const submittedAt =
      new Date();

    await this.database.$transaction(
      async (transaction) => {
        for (
          const update
          of responseUpdates
        ) {
          await transaction
            .mockTestQuestionResponse
            .update({
              where: {
                id:
                  update.responseId,
              },

              data: {
                isCorrect:
                  update.isCorrect,
                awardedMarks:
                  update.awardedMarks,
              },
            });
        }

        await transaction
          .mockTestSectionResult
          .deleteMany({
            where: {
              mockTestAttemptId:
                attempt.id,
            },
          });

        await transaction
          .mockTestTopicResult
          .deleteMany({
            where: {
              mockTestAttemptId:
                attempt.id,
            },
          });

        for (
          const section
          of sections
        ) {
          const accuracy =
            section.attemptedQuestions ===
            0
              ? 0
              : clampPercent(
                  (
                    section.correctAnswers /
                    section.attemptedQuestions
                  ) *
                    100,
                );

          await transaction
            .mockTestSectionResult
            .create({
              data: {
                mockTestAttemptId:
                  attempt.id,
                mockTestSectionId:
                  section.sectionId,
                attemptedQuestions:
                  section.attemptedQuestions,
                correctAnswers:
                  section.correctAnswers,
                incorrectAnswers:
                  section.incorrectAnswers,
                unansweredQuestions:
                  section.unansweredQuestions,
                score:
                  section.score,
                maxScore:
                  section.maxScore,
                accuracyPercent:
                  accuracy,
                timeSpentSeconds:
                  section.timeSpentSeconds,
              },
            });
        }

        for (
          const topic
          of topicAggregates.values()
        ) {
          const accuracy =
            topic.attemptedQuestions ===
            0
              ? 0
              : clampPercent(
                  (
                    topic.correctAnswers /
                    topic.attemptedQuestions
                  ) *
                    100,
                );

          await transaction
            .mockTestTopicResult
            .create({
              data: {
                mockTestAttemptId:
                  attempt.id,
                topicId:
                  topic.topicId,
                attemptedQuestions:
                  topic.attemptedQuestions,
                correctAnswers:
                  topic.correctAnswers,
                incorrectAnswers:
                  topic.incorrectAnswers,
                unansweredQuestions:
                  topic.unansweredQuestions,
                score:
                  topic.score,
                accuracyPercent:
                  accuracy,
                isWeak:
                  topic.attemptedQuestions >
                    0 &&
                  accuracy < 60,
              },
            });
        }

        await transaction
          .mockTestAttempt
          .update({
            where: {
              id: attempt.id,
            },

            data: {
              status:
                MockTestAttemptStatus
                  .EVALUATED,
              submittedAt,
              evaluatedAt:
                submittedAt,
              durationSeconds,
              attemptedQuestions,
              correctAnswers,
              incorrectAnswers,
              unansweredQuestions,
              rawScore,
              percentage,
              accuracyPercent,
              notes:
                input?.notes
                  ?.trim() ||
                attempt.notes,
            },
          });
      },
    );
  }

  async getRunnerCatalogue(
    userId: string,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const tests =
      await this.database.mockTest
        .findMany({
          where: {
            status:
              MockTestStatus.PUBLISHED,

            OR: [
              {
                syllabusVersionId:
                  enrollment.syllabusVersionId,
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

                questions: {
                  orderBy: {
                    sequenceNumber:
                      "asc",
                  },

                  include: {
                    question: {
                      include: {
                        options: {
                          select: {
                            isCorrect:
                              true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },

            attempts: {
              where: {
                studentProfileId:
                  profile.id,

                status: {
                  in: [
                    MockTestAttemptStatus
                      .IN_PROGRESS,
                    MockTestAttemptStatus
                      .EVALUATED,
                  ],
                },
              },

              orderBy: {
                updatedAt: "desc",
              },

              take: 10,

              include: {
                questionResponses: {
                  select: {
                    selectedOptionId:
                      true,
                    isMarkedForReview:
                      true,
                  },
                },
              },
            },
          },
        });

    return {
      tests:
        tests.map(
          (test) => {
            const assigned =
              test.sections.flatMap(
                (section) =>
                  section.questions,
              );

            const assignedMarks =
              assigned.reduce(
                (
                  total,
                  question,
                ) =>
                  total +
                  question.marks,
                0,
              );

            const validQuestions =
              assigned.every(
                (item) =>
                  item.question.status ===
                    QuestionStatus
                      .PUBLISHED &&
                  item.question.type ===
                    QuestionType
                      .SINGLE_CORRECT &&
                  item.question.options.filter(
                    (option) =>
                      option.isCorrect,
                  ).length === 1,
              );

            const runnable =
              assigned.length > 0 &&
              assigned.length ===
                test.totalQuestions &&
              assignedMarks ===
                test.totalMarks &&
              validQuestions;

            const activeAttempt =
              test.attempts.find(
                (attempt) =>
                  attempt.status ===
                  MockTestAttemptStatus
                    .IN_PROGRESS,
              );

            const latestEvaluated =
              test.attempts.find(
                (attempt) =>
                  attempt.status ===
                  MockTestAttemptStatus
                    .EVALUATED,
              );

            return {
              id: test.id,
              code: test.code,
              title: test.title,
              description:
                test.description,
              instructions:
                test.instructions,
              scope:
                test.scope,
              totalQuestions:
                test.totalQuestions,
              totalMarks:
                test.totalMarks,
              durationMinutes:
                test.durationMinutes,
              assignedQuestionCount:
                assigned.length,
              runnable,
              runnerStatus:
                runnable
                  ? activeAttempt
                    ? "RESUMABLE"
                    : "READY"
                  : "UNAVAILABLE",

              activeAttempt:
                activeAttempt
                  ? {
                      id:
                        activeAttempt.id,
                      startedAt:
                        activeAttempt.startedAt,
                      answeredQuestions:
                        activeAttempt.questionResponses.filter(
                          (response) =>
                            response.selectedOptionId !==
                            null,
                        ).length,
                      markedForReview:
                        activeAttempt.questionResponses.filter(
                          (response) =>
                            response.isMarkedForReview,
                        ).length,
                    }
                  : null,

              latestEvaluatedAttempt:
                latestEvaluated
                  ? {
                      id:
                        latestEvaluated.id,
                      attemptNumber:
                        latestEvaluated.attemptNumber,
                      submittedAt:
                        latestEvaluated.submittedAt,
                      rawScore:
                        latestEvaluated.rawScore,
                      percentage:
                        latestEvaluated.percentage,
                      accuracyPercent:
                        latestEvaluated.accuracyPercent,
                    }
                  : null,

              sections:
                test.sections.map(
                  (section) => ({
                    id: section.id,
                    name:
                      section.name,
                    sequenceNumber:
                      section.sequenceNumber,
                    totalQuestions:
                      section.totalQuestions,
                    totalMarks:
                      section.totalMarks,
                    subject:
                      section.subject,
                    assignedQuestionCount:
                      section.questions.length,
                  }),
                ),
            };
          },
        ),
    };
  }

  async startOrResumeAttempt(
    userId: string,
    mockTestId: string,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const test =
      await this
        .getPublishedRunnerTest(
          mockTestId,
          enrollment.syllabusVersionId,
        );

    const assignedQuestions =
      this.validateRunnableTest(
        test,
      );

    const existing =
      await this.database
        .mockTestAttempt
        .findFirst({
          where: {
            studentProfileId:
              profile.id,
            mockTestId:
              test.id,
            status:
              MockTestAttemptStatus
                .IN_PROGRESS,
          },

          orderBy: {
            updatedAt: "desc",
          },
        });

    if (existing) {
      return this.getRunnerAttempt(
        userId,
        existing.id,
      );
    }

    const attempt =
      await this.database.$transaction(
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

          return transaction
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
                    .IN_PROGRESS,
                startedAt:
                  new Date(),
                unansweredQuestions:
                  assignedQuestions.length,

                questionResponses: {
                  create:
                    assignedQuestions.map(
                      (assigned) => ({
                        mockTestQuestionId:
                          assigned.id,
                      }),
                    ),
                },
              },
            });
        },
      );

    return this.getRunnerAttempt(
      userId,
      attempt.id,
    );
  }

  async getRunnerAttempt(
    userId: string,
    attemptId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    let attempt =
      await this.getOwnedAttemptRecord(
        profile.id,
        attemptId,
      );

    if (
      this.isExpired(attempt)
    ) {
      await this.evaluateAttempt(
        profile.id,
        attempt.id,
      );

      attempt =
        await this.getOwnedAttemptRecord(
          profile.id,
          attempt.id,
        );
    }

    return this.serializeAttempt(
      attempt,
    );
  }

  async saveResponse(
    userId: string,
    attemptId: string,
    mockTestQuestionId: string,
    dto:
      SaveMockTestResponseDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    let attempt =
      await this.getOwnedAttemptRecord(
        profile.id,
        attemptId,
      );

    if (
      this.isExpired(attempt)
    ) {
      await this.evaluateAttempt(
        profile.id,
        attempt.id,
      );

      attempt =
        await this.getOwnedAttemptRecord(
          profile.id,
          attempt.id,
        );

      return this.serializeAttempt(
        attempt,
      );
    }

    if (
      attempt.status !==
      MockTestAttemptStatus
        .IN_PROGRESS
    ) {
      throw new BadRequestException(
        "Responses can only be changed while the runner attempt is in progress.",
      );
    }

    const response =
      attempt.questionResponses.find(
        (item) =>
          item.mockTestQuestionId ===
          mockTestQuestionId,
      );

    if (!response) {
      throw new NotFoundException(
        "The assigned mock-test question was not found in this attempt.",
      );
    }

    const hasSelectedOption =
      Object.prototype
        .hasOwnProperty.call(
          dto,
          "selectedOptionId",
        );

    const hasReviewFlag =
      Object.prototype
        .hasOwnProperty.call(
          dto,
          "isMarkedForReview",
        );

    const hasTime =
      Object.prototype
        .hasOwnProperty.call(
          dto,
          "timeSpentSeconds",
        );

    if (
      !hasSelectedOption &&
      !hasReviewFlag &&
      !hasTime
    ) {
      throw new BadRequestException(
        "Provide an answer, review flag or time update.",
      );
    }

    if (
      hasSelectedOption &&
      dto.selectedOptionId
    ) {
      const optionBelongs =
        response
          .mockTestQuestion
          .question
          .options
          .some(
            (option) =>
              option.id ===
              dto.selectedOptionId,
          );

      if (!optionBelongs) {
        throw new BadRequestException(
          "The selected option does not belong to this mock-test question.",
        );
      }
    }

    const data:
      Prisma.MockTestQuestionResponseUpdateInput =
      {};

    if (hasSelectedOption) {
      data.selectedOption =
        dto.selectedOptionId
          ? {
              connect: {
                id:
                  dto.selectedOptionId,
              },
            }
          : {
              disconnect: true,
            };

      data.answeredAt =
        dto.selectedOptionId
          ? new Date()
          : null;

      data.isCorrect = null;
      data.awardedMarks = 0;
    }

    if (hasReviewFlag) {
      data.isMarkedForReview =
        dto.isMarkedForReview ??
        false;
    }

    if (hasTime) {
      data.timeSpentSeconds =
        dto.timeSpentSeconds ??
        0;
    }

    await this.database
      .mockTestQuestionResponse
      .update({
        where: {
          id: response.id,
        },

        data,
      });

    return this.getRunnerAttempt(
      userId,
      attemptId,
    );
  }

  async submitAttempt(
    userId: string,
    attemptId: string,
    dto:
      SubmitMockTestRunnerAttemptDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.evaluateAttempt(
      profile.id,
      attemptId,
      {
        durationSeconds:
          dto.durationSeconds,
        notes:
          dto.notes,
      },
    );

    return this.getRunnerAttempt(
      userId,
      attemptId,
    );
  }
}
