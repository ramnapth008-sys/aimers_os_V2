import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  Prisma,
  QuestionPracticeItemStatus,
  QuestionPracticeSessionStatus,
  QuestionStatus,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  AnswerPracticeItemDto,
} from "./dto/answer-practice-item.dto";

import type {
  CompletePracticeSessionDto,
} from "./dto/complete-practice-session.dto";

import type {
  CreatePracticeSessionDto,
} from "./dto/create-practice-session.dto";

import type {
  ListQuestionsQueryDto,
} from "./dto/list-questions-query.dto";

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

const questionInclude = {
  subject: true,

  chapter: true,

  topic: true,

  options: {
    orderBy: {
      sequenceNumber:
        "asc" as const,
    },
  },

  tagLinks: {
    orderBy: {
      createdAt:
        "asc" as const,
    },

    include: {
      questionTag: true,
    },
  },
} satisfies Prisma.QuestionInclude;

type QuestionRecord =
  Prisma.QuestionGetPayload<{
    include:
      typeof questionInclude;
  }>;

const practiceSessionInclude = {
  items: {
    orderBy: {
      sequenceNumber:
        "asc" as const,
    },

    include: {
      question: {
        include:
          questionInclude,
      },
    },
  },
} satisfies Prisma.QuestionPracticeSessionInclude;

type PracticeSessionRecord =
  Prisma.QuestionPracticeSessionGetPayload<{
    include:
      typeof practiceSessionInclude;
  }>;

@Injectable()
export class QuestionBankService {
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
        "Complete student onboarding before using the Question Bank.",
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
        "An active academic enrollment is required before using the Question Bank.",
      );
    }

    return {
      profile,
      enrollment,
    };
  }

  private buildQuestionWhere(
    studentProfileId: string,
    syllabusVersionId: string,
    filters: {
      subjectId?: string;
      chapterId?: string;
      topicId?: string;
      difficulty?:
        ListQuestionsQueryDto["difficulty"];
      search?: string;
      bookmarkedOnly?: boolean;
    },
  ): Prisma.QuestionWhereInput {
    const where:
      Prisma.QuestionWhereInput = {
        status:
          QuestionStatus.PUBLISHED,

        subject: {
          syllabi: {
            some: {
              syllabusVersionId,
            },
          },
        },
      };

    if (filters.subjectId) {
      where.subjectId =
        filters.subjectId;
    }

    if (filters.chapterId) {
      where.chapterId =
        filters.chapterId;
    }

    if (filters.topicId) {
      where.topicId =
        filters.topicId;
    }

    if (filters.difficulty) {
      where.difficulty =
        filters.difficulty;
    }

    if (
      filters.search?.trim()
    ) {
      const search =
        filters.search.trim();

      where.OR = [
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          stem: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          explanation: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (
      filters.bookmarkedOnly
    ) {
      where.bookmarks = {
        some: {
          studentProfileId,
        },
      };
    }

    return where;
  }

  private serializeQuestion(
    question: QuestionRecord,
    bookmarked: boolean,
    revealAnswer = false,
  ) {
    const correctOption =
      revealAnswer
        ? question.options.find(
            (option) =>
              option.isCorrect,
          ) ?? null
        : null;

    return {
      id: question.id,
      code: question.code,
      type: question.type,

      difficulty:
        question.difficulty,

      status: question.status,
      stem: question.stem,

      explanation:
        revealAnswer
          ? question.explanation
          : null,

      sourceType:
        question.sourceType,

      sourceName:
        question.sourceName,

      sourceYear:
        question.sourceYear,

      marks:
        question.marks,

      negativeMarks:
        question.negativeMarks,

      estimatedSeconds:
        question.estimatedSeconds,

      subject:
        question.subject,

      chapter:
        question.chapter,

      topic:
        question.topic,

      tags:
        question.tagLinks.map(
          (link) =>
            link.questionTag,
        ),

      bookmarked,

      options:
        question.options.map(
          (option) => ({
            id: option.id,
            label: option.label,
            text: option.text,

            explanation:
              revealAnswer
                ? option.explanation
                : null,

            sequenceNumber:
              option.sequenceNumber,
          }),
        ),

      correctOptionId:
        correctOption?.id ??
        null,

      publishedAt:
        question.publishedAt,

      createdAt:
        question.createdAt,

      updatedAt:
        question.updatedAt,
    };
  }

  private serializeSession(
    session:
      PracticeSessionRecord,
    bookmarkIds:
      Set<string>,
  ) {
    const sessionCompleted =
      session.status ===
      QuestionPracticeSessionStatus
        .COMPLETED;

    return {
      id: session.id,

      studentProfileId:
        session.studentProfileId,

      name: session.name,
      status: session.status,

      totalQuestions:
        session.totalQuestions,

      answeredQuestions:
        session.answeredQuestions,

      correctAnswers:
        session.correctAnswers,

      incorrectAnswers:
        session.incorrectAnswers,

      skippedQuestions:
        session.skippedQuestions,

      score:
        session.score,

      accuracyPercent:
        session.accuracyPercent,

      durationSeconds:
        session.durationSeconds,

      startedAt:
        session.startedAt,

      completedAt:
        session.completedAt,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt,

      items:
        session.items.map(
          (item) => {
            const answered =
              item.status ===
                QuestionPracticeItemStatus
                  .CORRECT ||
              item.status ===
                QuestionPracticeItemStatus
                  .INCORRECT;

            const revealAnswer =
              answered ||
              sessionCompleted;

            return {
              id: item.id,

              sequenceNumber:
                item.sequenceNumber,

              status:
                item.status,

              selectedOptionId:
                item.selectedOptionId,

              isCorrect:
                item.isCorrect,

              awardedMarks:
                item.awardedMarks,

              timeSpentSeconds:
                item.timeSpentSeconds,

              answeredAt:
                item.answeredAt,

              question:
                this.serializeQuestion(
                  item.question,
                  bookmarkIds.has(
                    item.questionId,
                  ),
                  revealAnswer,
                ),
            };
          },
        ),
    };
  }

  private async getOwnedSessionRecord(
    studentProfileId: string,
    sessionId: string,
  ) {
    const session =
      await this.database
        .questionPracticeSession
        .findFirst({
          where: {
            id: sessionId,

            studentProfileId,
          },

          include:
            practiceSessionInclude,
        });

    if (!session) {
      throw new NotFoundException(
        "The Question Bank practice session was not found.",
      );
    }

    return session;
  }

  private async getBookmarkIds(
    studentProfileId: string,
    questionIds:
      string[],
  ) {
    if (
      questionIds.length === 0
    ) {
      return new Set<string>();
    }

    const bookmarks =
      await this.database
        .questionBookmark
        .findMany({
          where: {
            studentProfileId,

            questionId: {
              in: questionIds,
            },
          },

          select: {
            questionId: true,
          },
        });

    return new Set(
      bookmarks.map(
        (bookmark) =>
          bookmark.questionId,
      ),
    );
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

    const baseWhere =
      this.buildQuestionWhere(
        profile.id,
        enrollment.syllabusVersionId,
        {},
      );

    const [
      syllabusVersion,
      totalQuestions,
      bookmarkedQuestions,
      difficultyGroups,
      recentSessions,
      completedAggregate,
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

      this.database.question.count({
        where: baseWhere,
      }),

      this.database
        .questionBookmark
        .count({
          where: {
            studentProfileId:
              profile.id,

            question: baseWhere,
          },
        }),

      this.database.question.groupBy({
        by: [
          "difficulty",
        ],

        where: baseWhere,

        _count: {
          _all: true,
        },
      }),

      this.database
        .questionPracticeSession
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 8,
        }),

      this.database
        .questionPracticeSession
        .aggregate({
          where: {
            studentProfileId:
              profile.id,

            status:
              QuestionPracticeSessionStatus
                .COMPLETED,
          },

          _count: {
            _all: true,
          },

          _sum: {
            totalQuestions: true,
            answeredQuestions: true,
            correctAnswers: true,
            incorrectAnswers: true,
            skippedQuestions: true,
            score: true,
            durationSeconds: true,
          },

          _avg: {
            accuracyPercent: true,
          },
        }),
    ]);

    if (!syllabusVersion) {
      throw new NotFoundException(
        "The active syllabus version was not found.",
      );
    }

    return {
      syllabusVersion,

      summary: {
        totalQuestions,
        bookmarkedQuestions,

        completedSessionCount:
          completedAggregate
            ._count._all,

        attemptedQuestions:
          completedAggregate
            ._sum
            .answeredQuestions ??
          0,

        correctAnswers:
          completedAggregate
            ._sum
            .correctAnswers ??
          0,

        incorrectAnswers:
          completedAggregate
            ._sum
            .incorrectAnswers ??
          0,

        skippedQuestions:
          completedAggregate
            ._sum
            .skippedQuestions ??
          0,

        totalScore:
          completedAggregate
            ._sum.score ??
          0,

        totalDurationSeconds:
          completedAggregate
            ._sum
            .durationSeconds ??
          0,

        averageAccuracy:
          clampPercent(
            completedAggregate
              ._avg
              .accuracyPercent ??
            0,
          ),

        byDifficulty:
          difficultyGroups.map(
            (group) => ({
              difficulty:
                group.difficulty,

              count:
                group._count._all,
            }),
          ),
      },

      recentSessions,
    };
  }

  async listQuestions(
    userId: string,
    query:
      ListQuestionsQueryDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const where =
      this.buildQuestionWhere(
        profile.id,
        enrollment.syllabusVersionId,
        {
          subjectId:
            query.subjectId,

          chapterId:
            query.chapterId,

          topicId:
            query.topicId,

          difficulty:
            query.difficulty,

          search:
            query.search,

          bookmarkedOnly:
            query.bookmarkedOnly ===
            "true",
        },
      );

    const [
      questions,
      total,
    ] = await Promise.all([
      this.database.question
        .findMany({
          where,

          orderBy: [
            {
              createdAt: "asc",
            },
            {
              code: "asc",
            },
          ],

          skip: query.offset,
          take: query.limit,

          include:
            questionInclude,
        }),

      this.database.question.count({
        where,
      }),
    ]);

    const bookmarkIds =
      await this.getBookmarkIds(
        profile.id,
        questions.map(
          (question) =>
            question.id,
        ),
      );

    return {
      items:
        questions.map(
          (question) =>
            this.serializeQuestion(
              question,
              bookmarkIds.has(
                question.id,
              ),
            ),
        ),

      pagination: {
        total,
        limit:
          query.limit,

        offset:
          query.offset,

        hasMore:
          query.offset +
            questions.length <
          total,
      },
    };
  }

  async getQuestion(
    userId: string,
    questionId: string,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const question =
      await this.database.question
        .findFirst({
          where: {
            id: questionId,

            ...this.buildQuestionWhere(
              profile.id,
              enrollment
                .syllabusVersionId,
              {},
            ),
          },

          include:
            questionInclude,
        });

    if (!question) {
      throw new NotFoundException(
        "The published question was not found for the active syllabus.",
      );
    }

    const bookmarkIds =
      await this.getBookmarkIds(
        profile.id,
        [
          question.id,
        ],
      );

    return this.serializeQuestion(
      question,
      bookmarkIds.has(
        question.id,
      ),
    );
  }

  async bookmarkQuestion(
    userId: string,
    questionId: string,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const question =
      await this.database.question
        .findFirst({
          where: {
            id: questionId,

            ...this.buildQuestionWhere(
              profile.id,
              enrollment
                .syllabusVersionId,
              {},
            ),
          },

          select: {
            id: true,
          },
        });

    if (!question) {
      throw new NotFoundException(
        "The published question was not found for the active syllabus.",
      );
    }

    const bookmark =
      await this.database
        .questionBookmark
        .upsert({
          where: {
            studentProfileId_questionId: {
              studentProfileId:
                profile.id,

              questionId:
                question.id,
            },
          },

          update: {},

          create: {
            studentProfileId:
              profile.id,

            questionId:
              question.id,
          },
        });

    return {
      bookmarked: true,
      bookmark,
    };
  }

  async removeBookmark(
    userId: string,
    questionId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.database
      .questionBookmark
      .deleteMany({
        where: {
          studentProfileId:
            profile.id,

          questionId,
        },
      });

    return {
      bookmarked: false,
      questionId,
    };
  }

  async createPracticeSession(
    userId: string,
    dto:
      CreatePracticeSessionDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const where =
      this.buildQuestionWhere(
        profile.id,
        enrollment.syllabusVersionId,
        {
          subjectId:
            dto.subjectId,

          chapterId:
            dto.chapterId,

          topicId:
            dto.topicId,

          difficulty:
            dto.difficulty,

          bookmarkedOnly:
            dto.bookmarkedOnly ??
            false,
        },
      );

    const eligibleQuestions =
      await this.database.question
        .findMany({
          where,

          select: {
            id: true,
          },

          orderBy: [
            {
              createdAt: "asc",
            },
            {
              code: "asc",
            },
          ],

          take: 200,
        });

    if (
      eligibleQuestions.length ===
      0
    ) {
      throw new BadRequestException(
        "No published questions match the selected practice filters.",
      );
    }

    const selectedQuestions =
      [...eligibleQuestions]
        .sort(
          () =>
            Math.random() -
            0.5,
        )
        .slice(
          0,
          Math.min(
            dto.questionCount,
            eligibleQuestions.length,
          ),
        );

    const session =
      await this.database
        .questionPracticeSession
        .create({
          data: {
            studentProfileId:
              profile.id,

            name:
              dto.name?.trim() ||
              "Question Bank Practice",

            totalQuestions:
              selectedQuestions.length,

            items: {
              create:
                selectedQuestions.map(
                  (
                    question,
                    index,
                  ) => ({
                    questionId:
                      question.id,

                    sequenceNumber:
                      index + 1,
                  }),
                ),
            },
          },
        });

    return this.getPracticeSession(
      userId,
      session.id,
    );
  }

  async getPracticeSession(
    userId: string,
    sessionId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const session =
      await this.getOwnedSessionRecord(
        profile.id,
        sessionId,
      );

    const bookmarkIds =
      await this.getBookmarkIds(
        profile.id,
        session.items.map(
          (item) =>
            item.questionId,
        ),
      );

    return this.serializeSession(
      session,
      bookmarkIds,
    );
  }

  async answerPracticeItem(
    userId: string,
    sessionId: string,
    itemId: string,
    dto:
      AnswerPracticeItemDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const item =
      await this.database
        .questionPracticeItem
        .findFirst({
          where: {
            id: itemId,

            questionPracticeSessionId:
              sessionId,

            questionPracticeSession: {
              studentProfileId:
                profile.id,

              status:
                QuestionPracticeSessionStatus
                  .ACTIVE,
            },
          },

          include: {
            question: {
              include: {
                options: true,
              },
            },

            questionPracticeSession:
              true,
          },
        });

    if (!item) {
      throw new NotFoundException(
        "The active practice question was not found.",
      );
    }

    if (
      item.status !==
      QuestionPracticeItemStatus
        .UNANSWERED
    ) {
      throw new BadRequestException(
        "This practice question has already been answered.",
      );
    }

    const selectedOption =
      item.question.options.find(
        (option) =>
          option.id ===
          dto.selectedOptionId,
      );

    if (!selectedOption) {
      throw new BadRequestException(
        "The selected option does not belong to this question.",
      );
    }

    const isCorrect =
      selectedOption.isCorrect;

    const status =
      isCorrect
        ? QuestionPracticeItemStatus
            .CORRECT
        : QuestionPracticeItemStatus
            .INCORRECT;

    const awardedMarks =
      isCorrect
        ? item.question.marks
        : -item.question
            .negativeMarks;

    await this.database.$transaction(
      async (transaction) => {
        await transaction
          .questionPracticeItem
          .update({
            where: {
              id: item.id,
            },

            data: {
              selectedOptionId:
                selectedOption.id,

              status,
              isCorrect,
              awardedMarks,

              timeSpentSeconds:
                dto.timeSpentSeconds ??
                0,

              answeredAt:
                new Date(),
            },
          });

        const items =
          await transaction
            .questionPracticeItem
            .findMany({
              where: {
                questionPracticeSessionId:
                  sessionId,
              },

              select: {
                status: true,
                awardedMarks: true,
              },
            });

        const correctAnswers =
          items.filter(
            (current) =>
              current.status ===
              QuestionPracticeItemStatus
                .CORRECT,
          ).length;

        const incorrectAnswers =
          items.filter(
            (current) =>
              current.status ===
              QuestionPracticeItemStatus
                .INCORRECT,
          ).length;

        const skippedQuestions =
          items.filter(
            (current) =>
              current.status ===
              QuestionPracticeItemStatus
                .SKIPPED,
          ).length;

        const answeredQuestions =
          correctAnswers +
          incorrectAnswers;

        const score =
          items.reduce(
            (
              total,
              current,
            ) =>
              total +
              current.awardedMarks,
            0,
          );

        await transaction
          .questionPracticeSession
          .update({
            where: {
              id: sessionId,
            },

            data: {
              answeredQuestions,
              correctAnswers,
              incorrectAnswers,
              skippedQuestions,
              score,

              accuracyPercent:
                answeredQuestions ===
                0
                  ? 0
                  : clampPercent(
                      (
                        correctAnswers /
                        answeredQuestions
                      ) *
                        100,
                    ),
            },
          });
      },
    );

    return this.getPracticeSession(
      userId,
      sessionId,
    );
  }

  async completePracticeSession(
    userId: string,
    sessionId: string,
    dto:
      CompletePracticeSessionDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const session =
      await this.database
        .questionPracticeSession
        .findFirst({
          where: {
            id: sessionId,

            studentProfileId:
              profile.id,
          },
        });

    if (!session) {
      throw new NotFoundException(
        "The Question Bank practice session was not found.",
      );
    }

    if (
      session.status ===
      QuestionPracticeSessionStatus
        .COMPLETED
    ) {
      return this.getPracticeSession(
        userId,
        sessionId,
      );
    }

    if (
      session.status !==
      QuestionPracticeSessionStatus
        .ACTIVE
    ) {
      throw new BadRequestException(
        "Only an active practice session can be completed.",
      );
    }

    await this.database.$transaction(
      async (transaction) => {
        await transaction
          .questionPracticeItem
          .updateMany({
            where: {
              questionPracticeSessionId:
                sessionId,

              status:
                QuestionPracticeItemStatus
                  .UNANSWERED,
            },

            data: {
              status:
                QuestionPracticeItemStatus
                  .SKIPPED,

              awardedMarks: 0,
            },
          });

        const items =
          await transaction
            .questionPracticeItem
            .findMany({
              where: {
                questionPracticeSessionId:
                  sessionId,
              },

              select: {
                status: true,
                awardedMarks: true,
                timeSpentSeconds:
                  true,
              },
            });

        const correctAnswers =
          items.filter(
            (item) =>
              item.status ===
              QuestionPracticeItemStatus
                .CORRECT,
          ).length;

        const incorrectAnswers =
          items.filter(
            (item) =>
              item.status ===
              QuestionPracticeItemStatus
                .INCORRECT,
          ).length;

        const skippedQuestions =
          items.filter(
            (item) =>
              item.status ===
              QuestionPracticeItemStatus
                .SKIPPED,
          ).length;

        const answeredQuestions =
          correctAnswers +
          incorrectAnswers;

        const score =
          items.reduce(
            (
              total,
              item,
            ) =>
              total +
              item.awardedMarks,
            0,
          );

        const measuredDuration =
          items.reduce(
            (
              total,
              item,
            ) =>
              total +
              item.timeSpentSeconds,
            0,
          );

        await transaction
          .questionPracticeSession
          .update({
            where: {
              id: sessionId,
            },

            data: {
              status:
                QuestionPracticeSessionStatus
                  .COMPLETED,

              answeredQuestions,
              correctAnswers,
              incorrectAnswers,
              skippedQuestions,
              score,

              accuracyPercent:
                answeredQuestions ===
                0
                  ? 0
                  : clampPercent(
                      (
                        correctAnswers /
                        answeredQuestions
                      ) *
                        100,
                    ),

              durationSeconds:
                dto.durationSeconds ??
                measuredDuration,

              completedAt:
                new Date(),
            },
          });
      },
    );

    return this.getPracticeSession(
      userId,
      sessionId,
    );
  }
}
