import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  FlashcardDeckStatus,
  FlashcardLearningState,
  FlashcardReviewRating,
  FlashcardReviewSessionStatus,
  FlashcardStatus,
  Prisma,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  CompleteFlashcardReviewSessionDto,
} from "./dto/complete-flashcard-review-session.dto";

import type {
  CreateFlashcardReviewSessionDto,
} from "./dto/create-flashcard-review-session.dto";

import type {
  ReviewFlashcardDto,
} from "./dto/review-flashcard.dto";

const deckInclude = {
  subject: true,
  chapter: true,
  topic: true,

  _count: {
    select: {
      cards: {
        where: {
          status: FlashcardStatus.ACTIVE,
        },
      },
    },
  },
} satisfies Prisma.FlashcardDeckInclude;

const cardInclude = {
  subject: true,
  chapter: true,
  topic: true,
  schedule: true,

  sourceQuestion: {
    select: {
      id: true,
      code: true,
    },
  },
} satisfies Prisma.FlashcardInclude;

const reviewSessionInclude = {
  deck: {
    include: deckInclude,
  },

  items: {
    orderBy: {
      sequenceNumber: "asc" as const,
    },

    include: {
      flashcard: {
        include: cardInclude,
      },
    },
  },

  reviews: {
    orderBy: {
      reviewedAt: "asc" as const,
    },
  },
} satisfies Prisma.FlashcardReviewSessionInclude;

type DeckRecord =
  Prisma.FlashcardDeckGetPayload<{
    include: typeof deckInclude;
  }>;

type ReviewSessionRecord =
  Prisma.FlashcardReviewSessionGetPayload<{
    include: typeof reviewSessionInclude;
  }>;

interface ScheduleInput {
  state: FlashcardLearningState;
  intervalDays: number;
  scheduleStep: number;
  easeFactor: number;
  repetitions: number;
  lapseCount: number;
}

interface ScheduleResult
  extends ScheduleInput {
  dueAt: Date;
}

function clampPercent(value: number): number {
  return Math.max(
    0,
    Math.min(100, Math.round(value)),
  );
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(
    date.getTime() + minutes * 60 * 1000,
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(
    date.getTime() +
      days * 24 * 60 * 60 * 1000,
  );
}

function calculateSchedule(
  input: ScheduleInput,
  rating: FlashcardReviewRating,
  now: Date,
): ScheduleResult {
  const easeFactor = Math.max(
    1.3,
    input.easeFactor,
  );

  if (rating === FlashcardReviewRating.AGAIN) {
    return {
      state: FlashcardLearningState.RELEARNING,
      dueAt: addMinutes(now, 10),
      intervalDays: 0,
      scheduleStep: 0,
      easeFactor: Math.max(
        1.3,
        easeFactor - 0.2,
      ),
      repetitions: input.repetitions,
      lapseCount: input.lapseCount + 1,
    };
  }

  if (rating === FlashcardReviewRating.HARD) {
    const intervalDays =
      input.state === FlashcardLearningState.NEW ||
      input.state === FlashcardLearningState.LEARNING ||
      input.state === FlashcardLearningState.RELEARNING
        ? 1
        : Math.max(
            1,
            Math.round(
              Math.max(1, input.intervalDays) * 1.2,
            ),
          );

    return {
      state:
        intervalDays >= 30
          ? FlashcardLearningState.MASTERED
          : intervalDays >= 7
            ? FlashcardLearningState.REVIEW
            : FlashcardLearningState.LEARNING,
      dueAt: addDays(now, intervalDays),
      intervalDays,
      scheduleStep: Math.max(
        1,
        input.scheduleStep,
      ),
      easeFactor: Math.max(
        1.3,
        easeFactor - 0.15,
      ),
      repetitions: input.repetitions + 1,
      lapseCount: input.lapseCount,
    };
  }

  if (rating === FlashcardReviewRating.GOOD) {
    const learningSteps = [1, 3, 7, 15, 30];

    const isLearning =
      input.state === FlashcardLearningState.NEW ||
      input.state === FlashcardLearningState.LEARNING ||
      input.state === FlashcardLearningState.RELEARNING;

    const index = Math.min(
      Math.max(0, input.scheduleStep),
      learningSteps.length - 1,
    );

    const intervalDays = isLearning
      ? learningSteps[index]
      : Math.max(
          input.intervalDays + 1,
          Math.round(
            Math.max(1, input.intervalDays) *
              easeFactor,
          ),
        );

    return {
      state:
        intervalDays >= 30
          ? FlashcardLearningState.MASTERED
          : intervalDays >= 7
            ? FlashcardLearningState.REVIEW
            : FlashcardLearningState.LEARNING,
      dueAt: addDays(now, intervalDays),
      intervalDays,
      scheduleStep: isLearning
        ? Math.min(
            learningSteps.length,
            index + 1,
          )
        : input.scheduleStep,
      easeFactor,
      repetitions: input.repetitions + 1,
      lapseCount: input.lapseCount,
    };
  }

  const isLearning =
    input.state === FlashcardLearningState.NEW ||
    input.state === FlashcardLearningState.LEARNING ||
    input.state === FlashcardLearningState.RELEARNING;

  const intervalDays = isLearning
    ? 7
    : Math.max(
        7,
        Math.round(
          Math.max(1, input.intervalDays) *
            easeFactor *
            1.3,
        ),
      );

  return {
    state:
      intervalDays >= 30
        ? FlashcardLearningState.MASTERED
        : FlashcardLearningState.REVIEW,
    dueAt: addDays(now, intervalDays),
    intervalDays,
    scheduleStep: isLearning
      ? Math.max(3, input.scheduleStep)
      : input.scheduleStep,
    easeFactor: Math.min(
      3.2,
      easeFactor + 0.15,
    ),
    repetitions: input.repetitions + 1,
    lapseCount: input.lapseCount,
  };
}

@Injectable()
export class FlashcardsService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  private async getStudentContext(userId: string) {
    const profile =
      await this.database.studentProfile.findFirst({
        where: {
          userId,
          status: StudentStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    if (!profile) {
      throw new NotFoundException(
        "Complete student onboarding before using Flashcards.",
      );
    }

    const enrollment =
      await this.database.studentEnrollment.findFirst({
        where: {
          studentProfileId: profile.id,
          status: AcademicEnrollmentStatus.ACTIVE,
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
        "An active academic enrollment is required before using Flashcards.",
      );
    }

    return {
      profile,
      enrollment,
    };
  }

  private serializeDeck(
    deck: DeckRecord,
    dueCount: number,
  ) {
    return {
      id: deck.id,
      studentProfileId: deck.studentProfileId,
      name: deck.name,
      description: deck.description,
      color: deck.color,
      status: deck.status,
      isDefault: deck.isDefault,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      subject: deck.subject,
      chapter: deck.chapter,
      topic: deck.topic,
      cardCount: deck._count.cards,
      dueCount,
    };
  }

  private serializeReviewSession(
    session: ReviewSessionRecord,
  ) {
    const reviewByCardId = new Map(
      session.reviews.map((review) => [
        review.flashcardId,
        review,
      ]),
    );

    const items = session.items.map((item) => {
      const review = reviewByCardId.get(
        item.flashcardId,
      );

      return {
        id: item.id,
        sequenceNumber: item.sequenceNumber,
        reviewedAt: item.reviewedAt,
        reviewed: Boolean(review),

        review: review
          ? {
              id: review.id,
              rating: review.rating,
              previousState: review.previousState,
              newState: review.newState,
              previousIntervalDays:
                review.previousIntervalDays,
              newIntervalDays:
                review.newIntervalDays,
              responseSeconds:
                review.responseSeconds,
              reviewedAt: review.reviewedAt,
            }
          : null,

        flashcard: {
          id: item.flashcard.id,
          deckId: item.flashcard.deckId,
          sourceType:
            item.flashcard.sourceType,
          status: item.flashcard.status,
          front: item.flashcard.front,
          back: item.flashcard.back,
          hint: item.flashcard.hint,
          mnemonic: item.flashcard.mnemonic,
          subject: item.flashcard.subject,
          chapter: item.flashcard.chapter,
          topic: item.flashcard.topic,
          sourceQuestion:
            item.flashcard.sourceQuestion,
          schedule: item.flashcard.schedule,
        },
      };
    });

    const currentIndex = items.findIndex(
      (item) => !item.reviewed,
    );

    return {
      id: session.id,
      studentProfileId:
        session.studentProfileId,
      deckId: session.deckId,
      status: session.status,
      totalCards: session.totalCards,
      reviewedCards: session.reviewedCards,
      remainingCards: Math.max(
        0,
        session.totalCards -
          session.reviewedCards,
      ),
      againCount: session.againCount,
      hardCount: session.hardCount,
      goodCount: session.goodCount,
      easyCount: session.easyCount,
      durationSeconds:
        session.durationSeconds,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      currentIndex:
        currentIndex >= 0
          ? currentIndex
          : Math.max(0, items.length - 1),
      deck: session.deck
        ? this.serializeDeck(session.deck, 0)
        : null,
      items,
    };
  }

  private async getOwnedSessionRecord(
    studentProfileId: string,
    sessionId: string,
  ) {
    const session =
      await this.database.flashcardReviewSession.findFirst({
        where: {
          id: sessionId,
          studentProfileId,
        },
        include: reviewSessionInclude,
      });

    if (!session) {
      throw new NotFoundException(
        "The Flashcards review session was not found.",
      );
    }

    return session;
  }

  async getWorkspace(userId: string) {
    const { profile, enrollment } =
      await this.getStudentContext(userId);

    const now = new Date();

    const [
      decks,
      schedules,
      activeSession,
      recentSessions,
      ratingGroups,
      totalReviews,
    ] = await Promise.all([
      this.database.flashcardDeck.findMany({
        where: {
          studentProfileId: profile.id,
          status: FlashcardDeckStatus.ACTIVE,
        },
        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
        include: deckInclude,
      }),

      this.database.flashcardSchedule.findMany({
        where: {
          flashcard: {
            studentProfileId: profile.id,
            status: FlashcardStatus.ACTIVE,
            subject: {
              syllabi: {
                some: {
                  syllabusVersionId:
                    enrollment.syllabusVersionId,
                },
              },
            },
          },
        },
        orderBy: {
          dueAt: "asc",
        },
        select: {
          state: true,
          dueAt: true,
          flashcard: {
            select: {
              deckId: true,
            },
          },
        },
      }),

      this.database.flashcardReviewSession.findFirst({
        where: {
          studentProfileId: profile.id,
          status:
            FlashcardReviewSessionStatus.ACTIVE,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: reviewSessionInclude,
      }),

      this.database.flashcardReviewSession.findMany({
        where: {
          studentProfileId: profile.id,
          status:
            FlashcardReviewSessionStatus.COMPLETED,
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 8,
        include: {
          deck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      this.database.flashcardReview.groupBy({
        by: ["rating"],
        where: {
          reviewSession: {
            studentProfileId: profile.id,
          },
        },
        _count: {
          _all: true,
        },
      }),

      this.database.flashcardReview.count({
        where: {
          reviewSession: {
            studentProfileId: profile.id,
          },
        },
      }),
    ]);

    const dueByDeck = new Map<string, number>();

    const stateCounts: Record<
      FlashcardLearningState,
      number
    > = {
      NEW: 0,
      LEARNING: 0,
      REVIEW: 0,
      RELEARNING: 0,
      MASTERED: 0,
    };

    let dueNow = 0;

    for (const schedule of schedules) {
      stateCounts[schedule.state] += 1;

      if (schedule.dueAt <= now) {
        dueNow += 1;
        const deckId =
          schedule.flashcard.deckId;

        dueByDeck.set(
          deckId,
          (dueByDeck.get(deckId) ?? 0) + 1,
        );
      }
    }

    const ratingCounts: Record<
      FlashcardReviewRating,
      number
    > = {
      AGAIN: 0,
      HARD: 0,
      GOOD: 0,
      EASY: 0,
    };

    for (const group of ratingGroups) {
      ratingCounts[group.rating] =
        group._count._all;
    }

    const strongRecall =
      ratingCounts.GOOD +
      ratingCounts.EASY;

    return {
      studentProfileId: profile.id,
      syllabusVersionId:
        enrollment.syllabusVersionId,

      summary: {
        activeDeckCount: decks.length,
        activeCardCount: schedules.length,
        dueNow,
        nextDueAt:
          schedules[0]?.dueAt ?? null,
        totalReviews,
        strongRecallPercent:
          totalReviews === 0
            ? 0
            : clampPercent(
                (strongRecall / totalReviews) *
                  100,
              ),
        stateCounts,
        ratingCounts,
      },

      decks: decks.map((deck) =>
        this.serializeDeck(
          deck,
          dueByDeck.get(deck.id) ?? 0,
        ),
      ),

      activeSession: activeSession
        ? this.serializeReviewSession(activeSession)
        : null,

      recentSessions,
    };
  }

  async listDecks(userId: string) {
    const workspace =
      await this.getWorkspace(userId);

    return {
      decks: workspace.decks,
    };
  }

  async getDeck(
    userId: string,
    deckId: string,
  ) {
    const { profile, enrollment } =
      await this.getStudentContext(userId);

    const deck =
      await this.database.flashcardDeck.findFirst({
        where: {
          id: deckId,
          studentProfileId: profile.id,
          status: FlashcardDeckStatus.ACTIVE,
        },

        include: {
          ...deckInclude,

          cards: {
            where: {
              status: FlashcardStatus.ACTIVE,
              subject: {
                syllabi: {
                  some: {
                    syllabusVersionId:
                      enrollment.syllabusVersionId,
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
            include: cardInclude,
          },
        },
      });

    if (!deck) {
      throw new NotFoundException(
        "The Flashcards deck was not found.",
      );
    }

    const now = new Date();

    return {
      ...this.serializeDeck(
        deck,
        deck.cards.filter(
          (card) =>
            card.schedule &&
            card.schedule.dueAt <= now,
        ).length,
      ),
      cards: deck.cards,
    };
  }

  async startOrResumeReviewSession(
    userId: string,
    dto: CreateFlashcardReviewSessionDto,
  ) {
    const { profile, enrollment } =
      await this.getStudentContext(userId);

    if (dto.deckId) {
      const deckExists =
        await this.database.flashcardDeck.findFirst({
          where: {
            id: dto.deckId,
            studentProfileId: profile.id,
            status: FlashcardDeckStatus.ACTIVE,
          },
          select: {
            id: true,
          },
        });

      if (!deckExists) {
        throw new NotFoundException(
          "The selected Flashcards deck was not found.",
        );
      }
    }

    const existing =
      await this.database.flashcardReviewSession.findFirst({
        where: {
          studentProfileId: profile.id,
          status:
            FlashcardReviewSessionStatus.ACTIVE,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: reviewSessionInclude,
      });

    if (existing) {
      return this.serializeReviewSession(existing);
    }

    const parsedLimit = Number(dto.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(
          100,
          Math.max(1, Math.trunc(parsedLimit)),
        )
      : 20;

    const dueSchedules =
      await this.database.flashcardSchedule.findMany({
        where: {
          dueAt: {
            lte: new Date(),
          },
          flashcard: {
            studentProfileId: profile.id,
            status: FlashcardStatus.ACTIVE,
            ...(dto.deckId
              ? {
                  deckId: dto.deckId,
                }
              : {}),
            subject: {
              syllabi: {
                some: {
                  syllabusVersionId:
                    enrollment.syllabusVersionId,
                },
              },
            },
          },
        },
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        take: limit,
        select: {
          flashcardId: true,
        },
      });

    if (dueSchedules.length === 0) {
      throw new BadRequestException(
        "No Flashcards are currently due for the selected review queue.",
      );
    }

    const session =
      await this.database.flashcardReviewSession.create({
        data: {
          studentProfileId: profile.id,
          deckId: dto.deckId,
          status:
            FlashcardReviewSessionStatus.ACTIVE,
          totalCards: dueSchedules.length,

          items: {
            create: dueSchedules.map(
              (schedule, index) => ({
                flashcardId:
                  schedule.flashcardId,
                sequenceNumber: index + 1,
              }),
            ),
          },
        },
        include: reviewSessionInclude,
      });

    return this.serializeReviewSession(session);
  }

  async getReviewSession(
    userId: string,
    sessionId: string,
  ) {
    const { profile } =
      await this.getStudentContext(userId);

    const session =
      await this.getOwnedSessionRecord(
        profile.id,
        sessionId,
      );

    return this.serializeReviewSession(session);
  }

  async reviewCard(
    userId: string,
    sessionId: string,
    itemId: string,
    dto: ReviewFlashcardDto,
  ) {
    const { profile } =
      await this.getStudentContext(userId);

    const session =
      await this.getOwnedSessionRecord(
        profile.id,
        sessionId,
      );

    if (
      session.status !==
      FlashcardReviewSessionStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Only an active Flashcards review session can accept ratings.",
      );
    }

    const item = session.items.find(
      (candidate) => candidate.id === itemId,
    );

    if (!item) {
      throw new NotFoundException(
        "The Flashcards review item was not found in this session.",
      );
    }

    const existingReview =
      session.reviews.find(
        (review) =>
          review.flashcardId ===
          item.flashcardId,
      );

    if (existingReview) {
      return this.serializeReviewSession(session);
    }

    const now = new Date();

    const schedule: ScheduleInput =
      item.flashcard.schedule ?? {
        state: FlashcardLearningState.NEW,
        intervalDays: 0,
        scheduleStep: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapseCount: 0,
      };

    const nextSchedule = calculateSchedule(
      schedule,
      dto.rating,
      now,
    );

    const reviewedCards =
      session.reviewedCards + 1;

    const completesSession =
      reviewedCards >= session.totalCards;

    const elapsedSeconds = Math.max(
      0,
      Math.round(
        (now.getTime() -
          session.startedAt.getTime()) /
          1000,
      ),
    );

    const ratingCounter =
      dto.rating === FlashcardReviewRating.AGAIN
        ? {
            againCount: {
              increment: 1,
            },
          }
        : dto.rating ===
            FlashcardReviewRating.HARD
          ? {
              hardCount: {
                increment: 1,
              },
            }
          : dto.rating ===
              FlashcardReviewRating.GOOD
            ? {
                goodCount: {
                  increment: 1,
                },
              }
            : {
                easyCount: {
                  increment: 1,
                },
              };

    const parsedResponseSeconds = Number(
      dto.responseSeconds,
    );

    const responseSeconds = Number.isFinite(
      parsedResponseSeconds,
    )
      ? Math.min(
          3600,
          Math.max(
            0,
            Math.trunc(
              parsedResponseSeconds,
            ),
          ),
        )
      : 0;

    await this.database.$transaction(
      async (transaction) => {
        await transaction.flashcardSchedule.upsert({
          where: {
            flashcardId: item.flashcardId,
          },
          update: {
            state: nextSchedule.state,
            dueAt: nextSchedule.dueAt,
            intervalDays:
              nextSchedule.intervalDays,
            scheduleStep:
              nextSchedule.scheduleStep,
            easeFactor:
              nextSchedule.easeFactor,
            repetitions:
              nextSchedule.repetitions,
            lapseCount:
              nextSchedule.lapseCount,
            lastReviewedAt: now,
          },
          create: {
            flashcardId: item.flashcardId,
            state: nextSchedule.state,
            dueAt: nextSchedule.dueAt,
            intervalDays:
              nextSchedule.intervalDays,
            scheduleStep:
              nextSchedule.scheduleStep,
            easeFactor:
              nextSchedule.easeFactor,
            repetitions:
              nextSchedule.repetitions,
            lapseCount:
              nextSchedule.lapseCount,
            lastReviewedAt: now,
          },
        });

        await transaction.flashcardReview.create({
          data: {
            reviewSessionId: session.id,
            flashcardId: item.flashcardId,
            rating: dto.rating,
            previousState: schedule.state,
            newState: nextSchedule.state,
            previousIntervalDays:
              schedule.intervalDays,
            newIntervalDays:
              nextSchedule.intervalDays,
            responseSeconds,
            reviewedAt: now,
          },
        });

        await transaction.flashcardReviewSessionItem.update({
          where: {
            id: item.id,
          },
          data: {
            reviewedAt: now,
          },
        });

        await transaction.flashcardReviewSession.update({
          where: {
            id: session.id,
          },
          data: {
            reviewedCards: {
              increment: 1,
            },
            ...ratingCounter,
            status: completesSession
              ? FlashcardReviewSessionStatus.COMPLETED
              : FlashcardReviewSessionStatus.ACTIVE,
            completedAt: completesSession
              ? now
              : null,
            durationSeconds: completesSession
              ? Math.min(
                  86400,
                  elapsedSeconds,
                )
              : session.durationSeconds,
          },
        });
      },
    );

    const updated =
      await this.getOwnedSessionRecord(
        profile.id,
        session.id,
      );

    return this.serializeReviewSession(updated);
  }

  async completeReviewSession(
    userId: string,
    sessionId: string,
    dto: CompleteFlashcardReviewSessionDto,
  ) {
    const { profile } =
      await this.getStudentContext(userId);

    const session =
      await this.getOwnedSessionRecord(
        profile.id,
        sessionId,
      );

    if (
      session.status ===
      FlashcardReviewSessionStatus.COMPLETED
    ) {
      return this.serializeReviewSession(session);
    }

    if (
      session.status !==
      FlashcardReviewSessionStatus.ACTIVE
    ) {
      throw new BadRequestException(
        "Only an active Flashcards review session can be completed.",
      );
    }

    const elapsedSeconds = Math.max(
      0,
      Math.round(
        (Date.now() -
          session.startedAt.getTime()) /
          1000,
      ),
    );

    const suppliedDuration = Number(
      dto.durationSeconds,
    );

    const durationSeconds = Number.isFinite(
      suppliedDuration,
    )
      ? Math.min(
          86400,
          Math.max(
            0,
            Math.trunc(suppliedDuration),
          ),
        )
      : Math.min(86400, elapsedSeconds);

    await this.database.flashcardReviewSession.update({
      where: {
        id: session.id,
      },
      data: {
        status:
          FlashcardReviewSessionStatus.COMPLETED,
        completedAt: new Date(),
        durationSeconds,
      },
    });

    const updated =
      await this.getOwnedSessionRecord(
        profile.id,
        session.id,
      );

    return this.serializeReviewSession(updated);
  }
}
