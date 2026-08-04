import {
  FlashcardDeckStatus,
  FlashcardLearningState,
  FlashcardSourceType,
  FlashcardStatus,
  PrismaClient,
  QuestionStatus,
  StudentStatus,
} from "@aimers/database";

const database =
  new PrismaClient();

const deckDefinitions = {
  PHYSICS: {
    name:
      "Physics Foundations",
    description:
      "Core Physics concepts generated from the AIMERS development Question Bank.",
  },

  CHEMISTRY: {
    name:
      "Chemistry Foundations",
    description:
      "Core Chemistry concepts generated from the AIMERS development Question Bank.",
  },

  BIOLOGY: {
    name:
      "Biology Foundations",
    description:
      "Core Biology concepts generated from the AIMERS development Question Bank.",
  },
} as const;

async function main() {
  const studentProfile =
    await database
      .studentProfile
      .findFirst({
        where: {
          status:
            StudentStatus.ACTIVE,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

  if (!studentProfile) {
    throw new Error(
      "No active student profile was found. Run the development user and onboarding seeds first.",
    );
  }

  const questions =
    await database.question
      .findMany({
        where: {
          status:
            QuestionStatus.PUBLISHED,

          code: {
            startsWith: "DEV-",
          },

          subject: {
            code: {
              in: [
                "PHYSICS",
                "CHEMISTRY",
                "BIOLOGY",
              ],
            },
          },
        },

        orderBy: [
          {
            subject: {
              code: "asc",
            },
          },
          {
            code: "asc",
          },
        ],

        include: {
          subject: true,
          chapter: true,
          topic: true,

          options: {
            where: {
              isCorrect: true,
            },

            orderBy: {
              sequenceNumber:
                "asc",
            },
          },
        },
      });

  if (questions.length === 0) {
    throw new Error(
      "No published development questions were found. Run seed:dev-question-bank first.",
    );
  }

  let processedCardCount = 0;

  for (
    const [
      subjectCode,
      definition,
    ]
    of Object.entries(
      deckDefinitions,
    )
  ) {
    const subjectQuestions =
      questions.filter(
        (question) =>
          question.subject.code ===
          subjectCode,
      );

    if (
      subjectQuestions.length ===
      0
    ) {
      continue;
    }

    const subject =
      subjectQuestions[0]
        .subject;

    const deck =
      await database
        .flashcardDeck
        .upsert({
          where: {
            studentProfileId_name: {
              studentProfileId:
                studentProfile.id,

              name:
                definition.name,
            },
          },

          update: {
            subjectId:
              subject.id,

            description:
              definition.description,

            status:
              FlashcardDeckStatus
                .ACTIVE,

            isDefault: true,
          },

          create: {
            studentProfileId:
              studentProfile.id,

            subjectId:
              subject.id,

            name:
              definition.name,

            description:
              definition.description,

            status:
              FlashcardDeckStatus
                .ACTIVE,

            isDefault: true,
          },
        });

    for (
      const question
      of subjectQuestions
    ) {
      const correctOption =
        question.options[0];

      if (!correctOption) {
        throw new Error(
          `Question ${question.code} does not have a correct option.`,
        );
      }

      const back = [
        `${correctOption.label}. ${correctOption.text}`,
        question.explanation,
      ]
        .filter(Boolean)
        .join("\n\n");

      const card =
        await database
          .flashcard
          .upsert({
            where: {
              deckId_sourceQuestionId: {
                deckId:
                  deck.id,

                sourceQuestionId:
                  question.id,
              },
            },

            update: {
              studentProfileId:
                studentProfile.id,

              subjectId:
                question.subjectId,

              chapterId:
                question.chapterId,

              topicId:
                question.topicId,

              sourceType:
                FlashcardSourceType
                  .QUESTION_BANK,

              status:
                FlashcardStatus.ACTIVE,

              front:
                question.stem,

              back,

              hint:
                question.topic
                  ?.name ??
                question.chapter
                  ?.name ??
                null,
            },

            create: {
              deckId:
                deck.id,

              studentProfileId:
                studentProfile.id,

              subjectId:
                question.subjectId,

              chapterId:
                question.chapterId,

              topicId:
                question.topicId,

              sourceQuestionId:
                question.id,

              sourceType:
                FlashcardSourceType
                  .QUESTION_BANK,

              status:
                FlashcardStatus.ACTIVE,

              front:
                question.stem,

              back,

              hint:
                question.topic
                  ?.name ??
                question.chapter
                  ?.name ??
                null,
            },
          });

      await database
        .flashcardSchedule
        .upsert({
          where: {
            flashcardId:
              card.id,
          },

          update: {},

          create: {
            flashcardId:
              card.id,

            state:
              FlashcardLearningState
                .NEW,

            dueAt:
              new Date(),

            intervalDays: 0,
            scheduleStep: 0,
            easeFactor: 2.5,
            repetitions: 0,
            lapseCount: 0,
          },
        });

      processedCardCount += 1;
    }
  }

  const [
    deckCount,
    cardCount,
    dueCount,
  ] = await Promise.all([
    database.flashcardDeck
      .count({
        where: {
          studentProfileId:
            studentProfile.id,

          status:
            FlashcardDeckStatus
              .ACTIVE,
        },
      }),

    database.flashcard.count({
      where: {
        studentProfileId:
          studentProfile.id,

        status:
          FlashcardStatus.ACTIVE,
      },
    }),

    database.flashcardSchedule
      .count({
        where: {
          flashcard: {
            studentProfileId:
              studentProfile.id,

            status:
              FlashcardStatus
                .ACTIVE,
          },

          dueAt: {
            lte:
              new Date(),
          },
        },
      }),
  ]);

  console.log(
    "Seeded Flashcards foundation:",
    {
      studentProfileId:
        studentProfile.id,

      deckCount,
      cardCount,
      dueCount,
      processedCardCount,
    },
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      "Flashcards seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
