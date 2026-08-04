import {
  AcademicCatalogStatus,
  MockTestScope,
  MockTestSourceType,
  MockTestStatus,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
} from "@aimers/database";

const database =
  new PrismaClient();

interface SectionSeed {
  subjectCode: string;
  name: string;
  sequenceNumber: number;
  totalQuestions: number;
  totalMarks: number;
}

const sections:
  SectionSeed[] = [
    {
      subjectCode: "PHYSICS",
      name: "Physics",
      sequenceNumber: 1,
      totalQuestions: 45,
      totalMarks: 180,
    },
    {
      subjectCode: "CHEMISTRY",
      name: "Chemistry",
      sequenceNumber: 2,
      totalQuestions: 45,
      totalMarks: 180,
    },
    {
      subjectCode: "BIOLOGY",
      name: "Biology",
      sequenceNumber: 3,
      totalQuestions: 90,
      totalMarks: 360,
    },
  ];

async function main() {
  const organization =
    await database.organization
      .findFirst({
        where: {
          status:
            OrganizationStatus
              .ACTIVE,

          type: {
            in: [
              OrganizationType
                .PLATFORM,

              OrganizationType
                .COACHING_INSTITUTE,
            ],
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

  if (!organization) {
    throw new Error(
      "No active platform or coaching organization was found.",
    );
  }

  const syllabusVersion =
    await database
      .syllabusVersion
      .findFirst({
        where: {
          status:
            AcademicCatalogStatus
              .PUBLISHED,
        },

        orderBy: [
          {
            isDefault: "desc",
          },
          {
            createdAt: "asc",
          },
        ],

        include: {
          subjects: {
            include: {
              subject: true,
            },
          },
        },
      });

  if (!syllabusVersion) {
    throw new Error(
      "No published syllabus version was found.",
    );
  }

  const mockTest =
    await database.mockTest
      .upsert({
        where: {
          ownerOrganizationId_code: {
            ownerOrganizationId:
              organization.id,

            code:
              "DEV-NEET-MOCK-001",
          },
        },

        update: {
          syllabusVersionId:
            syllabusVersion.id,

          title:
            "NEET Development Full-Length Mock 01",

          description:
            "Development-only mock test for validating AIMERS assessment analytics. This is not an official examination paper.",

          instructions:
            "Enter section-level results from a completed practice test. Scores are calculated using the configured section marking scheme.",

          sourceType:
            MockTestSourceType
              .PLATFORM,

          scope:
            MockTestScope
              .FULL_LENGTH,

          status:
            MockTestStatus
              .PUBLISHED,

          totalQuestions: 180,
          totalMarks: 720,
          durationMinutes: 180,

          publishedAt:
            new Date(),
        },

        create: {
          ownerOrganizationId:
            organization.id,

          syllabusVersionId:
            syllabusVersion.id,

          code:
            "DEV-NEET-MOCK-001",

          title:
            "NEET Development Full-Length Mock 01",

          description:
            "Development-only mock test for validating AIMERS assessment analytics. This is not an official examination paper.",

          instructions:
            "Enter section-level results from a completed practice test. Scores are calculated using the configured section marking scheme.",

          sourceType:
            MockTestSourceType
              .PLATFORM,

          scope:
            MockTestScope
              .FULL_LENGTH,

          status:
            MockTestStatus
              .PUBLISHED,

          totalQuestions: 180,
          totalMarks: 720,
          durationMinutes: 180,

          publishedAt:
            new Date(),
        },
      });

  for (
    const section
    of sections
  ) {
    const syllabusSubject =
      syllabusVersion.subjects
        .find(
          (item) =>
            item.subject.code ===
            section.subjectCode,
        );

    if (!syllabusSubject) {
      throw new Error(
        `Subject ${section.subjectCode} is missing from the published syllabus.`,
      );
    }

    const createdSection =
      await database
        .mockTestSection
        .upsert({
          where: {
            mockTestId_sequenceNumber: {
              mockTestId:
                mockTest.id,

              sequenceNumber:
                section
                  .sequenceNumber,
            },
          },

          update: {
            subjectId:
              syllabusSubject
                .subjectId,

            name:
              section.name,

            totalQuestions:
              section
                .totalQuestions,

            totalMarks:
              section.totalMarks,

            marksPerCorrect: 4,

            negativeMarksPerWrong:
              1,
          },

          create: {
            mockTestId:
              mockTest.id,

            subjectId:
              syllabusSubject
                .subjectId,

            name:
              section.name,

            sequenceNumber:
              section
                .sequenceNumber,

            totalQuestions:
              section
                .totalQuestions,

            totalMarks:
              section.totalMarks,

            marksPerCorrect: 4,

            negativeMarksPerWrong:
              1,
          },
        });

    const topics =
      await database.topic
        .findMany({
          where: {
            chapter: {
              unit: {
                syllabusSubjectId:
                  syllabusSubject.id,
              },
            },
          },

          orderBy: [
            {
              chapter: {
                sequenceNumber:
                  "asc",
              },
            },
            {
              sequenceNumber:
                "asc",
            },
          ],

          take: 12,
        });

    const plannedBase =
      topics.length === 0
        ? 0
        : Math.floor(
            section
              .totalQuestions /
            topics.length,
          );

    for (
      const [
        index,
        topic,
      ]
      of topics.entries()
    ) {
      const plannedQuestions =
        plannedBase +
        (
          index <
          section
            .totalQuestions %
            Math.max(
              1,
              topics.length,
            )
            ? 1
            : 0
        );

      await database
        .mockTestTopicBlueprint
        .upsert({
          where: {
            mockTestSectionId_topicId: {
              mockTestSectionId:
                createdSection.id,

              topicId:
                topic.id,
            },
          },

          update: {
            plannedQuestions,

            weightagePercent:
              section
                .totalQuestions ===
              0
                ? 0
                : Math.round(
                    (
                      plannedQuestions /
                      section
                        .totalQuestions
                    ) *
                    100,
                  ),
          },

          create: {
            mockTestSectionId:
              createdSection.id,

            topicId:
              topic.id,

            plannedQuestions,

            weightagePercent:
              section
                .totalQuestions ===
              0
                ? 0
                : Math.round(
                    (
                      plannedQuestions /
                      section
                        .totalQuestions
                    ) *
                    100,
                  ),
          },
        });
    }
  }

  console.log(
    JSON.stringify(
      {
        mockTestId:
          mockTest.id,

        code:
          mockTest.code,

        title:
          mockTest.title,

        sections:
          sections.length,

        totalQuestions:
          mockTest
            .totalQuestions,

        totalMarks:
          mockTest.totalMarks,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
