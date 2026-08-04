import {
  AcademicCatalogStatus,
  MockTestScope,
  MockTestSourceType,
  MockTestStatus,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  QuestionDifficulty,
  QuestionSourceType,
  QuestionStatus,
  QuestionType,
} from "@aimers/database";

const database =
  new PrismaClient();

interface OptionSeed {
  label: "A" | "B" | "C" | "D";
  text: string;
  isCorrect: boolean;
}

interface QuestionSeed {
  code: string;
  subjectCode:
    | "PHYSICS"
    | "CHEMISTRY"
    | "BIOLOGY";
  topicCode: string;
  difficulty:
    QuestionDifficulty;
  stem: string;
  explanation: string;
  estimatedSeconds: number;
  tags: string[];
  options: OptionSeed[];
}

const questions:
  QuestionSeed[] = [
    {
      code: "DEV-PHY-UNITS-001",
      subjectCode: "PHYSICS",
      topicCode: "PHY-UNITS-SI",
      difficulty: QuestionDifficulty.EASY,
      stem: "Which of the following is the SI unit of force?",
      explanation: "Force is measured in newton. One newton is the force required to accelerate a mass of one kilogram by one metre per second squared.",
      estimatedSeconds: 45,
      tags: ["conceptual", "foundation"],
      options: [
        { label: "A", text: "Joule", isCorrect: false },
        { label: "B", text: "Newton", isCorrect: true },
        { label: "C", text: "Pascal", isCorrect: false },
        { label: "D", text: "Watt", isCorrect: false },
      ],
    },
    {
      code: "DEV-PHY-ERRORS-001",
      subjectCode: "PHYSICS",
      topicCode: "PHY-UNITS-ERRORS",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "A length is recorded as 12.40 cm. How many significant figures are present?",
      explanation: "All non-zero digits and trailing zeros to the right of a decimal point are significant. Therefore 12.40 has four significant figures.",
      estimatedSeconds: 60,
      tags: ["conceptual", "calculation"],
      options: [
        { label: "A", text: "2", isCorrect: false },
        { label: "B", text: "3", isCorrect: false },
        { label: "C", text: "4", isCorrect: true },
        { label: "D", text: "5", isCorrect: false },
      ],
    },
    {
      code: "DEV-PHY-KINEMATICS-001",
      subjectCode: "PHYSICS",
      topicCode: "PHY-KINEMATICS-1D",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "A body starts from rest and moves with a constant acceleration of 2 m/s² for 5 s. What is its final speed?",
      explanation: "Using v = u + at with u = 0, a = 2 m/s² and t = 5 s gives v = 10 m/s.",
      estimatedSeconds: 75,
      tags: ["numerical", "kinematics"],
      options: [
        { label: "A", text: "5 m/s", isCorrect: false },
        { label: "B", text: "10 m/s", isCorrect: true },
        { label: "C", text: "20 m/s", isCorrect: false },
        { label: "D", text: "25 m/s", isCorrect: false },
      ],
    },
    {
      code: "DEV-PHY-NEWTON-001",
      subjectCode: "PHYSICS",
      topicCode: "PHY-LOM-NEWTON",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "A net force of 12 N acts on a 3 kg object. What acceleration is produced?",
      explanation: "Newton's second law gives a = F/m = 12/3 = 4 m/s².",
      estimatedSeconds: 60,
      tags: ["numerical", "newton-laws"],
      options: [
        { label: "A", text: "2 m/s²", isCorrect: false },
        { label: "B", text: "3 m/s²", isCorrect: false },
        { label: "C", text: "4 m/s²", isCorrect: true },
        { label: "D", text: "6 m/s²", isCorrect: false },
      ],
    },
    {
      code: "DEV-CHEM-MASS-001",
      subjectCode: "CHEMISTRY",
      topicCode: "CHEM-MOLE-MASS",
      difficulty: QuestionDifficulty.EASY,
      stem: "What is the approximate molar mass of water, H₂O?",
      explanation: "Water contains two hydrogen atoms and one oxygen atom: 2 × 1 + 16 = 18 g mol⁻¹.",
      estimatedSeconds: 45,
      tags: ["numerical", "mole-concept"],
      options: [
        { label: "A", text: "16 g mol⁻¹", isCorrect: false },
        { label: "B", text: "17 g mol⁻¹", isCorrect: false },
        { label: "C", text: "18 g mol⁻¹", isCorrect: true },
        { label: "D", text: "20 g mol⁻¹", isCorrect: false },
      ],
    },
    {
      code: "DEV-CHEM-STOICH-001",
      subjectCode: "CHEMISTRY",
      topicCode: "CHEM-MOLE-STOICHIOMETRY",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "How many moles are present in 44 g of carbon dioxide, CO₂?",
      explanation: "The molar mass of CO₂ is 44 g mol⁻¹. Therefore 44 g corresponds to one mole.",
      estimatedSeconds: 60,
      tags: ["numerical", "stoichiometry"],
      options: [
        { label: "A", text: "0.5 mol", isCorrect: false },
        { label: "B", text: "1 mol", isCorrect: true },
        { label: "C", text: "2 mol", isCorrect: false },
        { label: "D", text: "4 mol", isCorrect: false },
      ],
    },
    {
      code: "DEV-CHEM-QUANTUM-001",
      subjectCode: "CHEMISTRY",
      topicCode: "CHEM-ATOM-QUANTUM",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "Which quantum number primarily identifies the shape of an atomic orbital?",
      explanation: "The azimuthal or angular-momentum quantum number, l, identifies the subshell and the general shape of its orbitals.",
      estimatedSeconds: 60,
      tags: ["conceptual", "atomic-structure"],
      options: [
        { label: "A", text: "Principal quantum number, n", isCorrect: false },
        { label: "B", text: "Azimuthal quantum number, l", isCorrect: true },
        { label: "C", text: "Magnetic quantum number, mₗ", isCorrect: false },
        { label: "D", text: "Spin quantum number, mₛ", isCorrect: false },
      ],
    },
    {
      code: "DEV-CHEM-VSEPR-001",
      subjectCode: "CHEMISTRY",
      topicCode: "CHEM-BOND-VSEPR",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "According to VSEPR theory, what is the molecular shape of methane, CH₄?",
      explanation: "Methane has four bonding electron pairs around carbon and no lone pair, producing a tetrahedral molecular shape.",
      estimatedSeconds: 60,
      tags: ["conceptual", "chemical-bonding"],
      options: [
        { label: "A", text: "Linear", isCorrect: false },
        { label: "B", text: "Trigonal planar", isCorrect: false },
        { label: "C", text: "Tetrahedral", isCorrect: true },
        { label: "D", text: "Bent", isCorrect: false },
      ],
    },
    {
      code: "DEV-BIO-LIFE-001",
      subjectCode: "BIOLOGY",
      topicCode: "BIO-LW-LIFE",
      difficulty: QuestionDifficulty.EASY,
      stem: "Which feature is regarded as a defining property of living organisms because it involves sensing and responding to the environment?",
      explanation: "Consciousness, in the biological sense used here, refers to the ability of living organisms to sense their surroundings and respond to stimuli.",
      estimatedSeconds: 45,
      tags: ["conceptual", "ncert-aligned"],
      options: [
        { label: "A", text: "Crystallisation", isCorrect: false },
        { label: "B", text: "Consciousness", isCorrect: true },
        { label: "C", text: "Sedimentation", isCorrect: false },
        { label: "D", text: "Evaporation", isCorrect: false },
      ],
    },
    {
      code: "DEV-BIO-TAXONOMY-001",
      subjectCode: "BIOLOGY",
      topicCode: "BIO-LW-TAXONOMY",
      difficulty: QuestionDifficulty.EASY,
      stem: "What is the basic unit of biological classification?",
      explanation: "Species is the basic unit of classification. It groups organisms that share fundamental similarities and can be distinguished from other groups.",
      estimatedSeconds: 45,
      tags: ["conceptual", "taxonomy"],
      options: [
        { label: "A", text: "Kingdom", isCorrect: false },
        { label: "B", text: "Phylum", isCorrect: false },
        { label: "C", text: "Genus", isCorrect: false },
        { label: "D", text: "Species", isCorrect: true },
      ],
    },
    {
      code: "DEV-BIO-CELL-001",
      subjectCode: "BIOLOGY",
      topicCode: "BIO-CELL-TYPES",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "Which structure is absent in a typical prokaryotic cell?",
      explanation: "Prokaryotic cells do not have a membrane-bound nucleus. Their genetic material is located in a nucleoid region.",
      estimatedSeconds: 60,
      tags: ["conceptual", "cell-biology"],
      options: [
        { label: "A", text: "Plasma membrane", isCorrect: false },
        { label: "B", text: "Ribosome", isCorrect: false },
        { label: "C", text: "Membrane-bound nucleus", isCorrect: true },
        { label: "D", text: "Genetic material", isCorrect: false },
      ],
    },
    {
      code: "DEV-BIO-ENZYME-001",
      subjectCode: "BIOLOGY",
      topicCode: "BIO-BM-PROTEINS",
      difficulty: QuestionDifficulty.MEDIUM,
      stem: "What is the main effect of an enzyme on a biochemical reaction?",
      explanation: "An enzyme increases reaction rate by lowering the activation energy. It does not change the overall free-energy change or equilibrium position.",
      estimatedSeconds: 60,
      tags: ["conceptual", "biomolecules"],
      options: [
        { label: "A", text: "It increases the activation energy", isCorrect: false },
        { label: "B", text: "It lowers the activation energy", isCorrect: true },
        { label: "C", text: "It permanently shifts equilibrium", isCorrect: false },
        { label: "D", text: "It is consumed completely", isCorrect: false },
      ],
    },
  ];

const tagNames:
  Record<string, string> = {
    conceptual: "Conceptual",
    foundation: "Foundation",
    calculation: "Calculation",
    numerical: "Numerical",
    kinematics: "Kinematics",
    "newton-laws": "Newton's Laws",
    "mole-concept": "Mole Concept",
    stoichiometry: "Stoichiometry",
    "atomic-structure": "Atomic Structure",
    "chemical-bonding": "Chemical Bonding",
    "ncert-aligned": "NCERT-aligned",
    taxonomy: "Taxonomy",
    "cell-biology": "Cell Biology",
    biomolecules: "Biomolecules",
  };

async function main() {
  const organization =
    await database.organization
      .findFirst({
        where: {
          status: OrganizationStatus.ACTIVE,
          type: {
            in: [
              OrganizationType.PLATFORM,
              OrganizationType.COACHING_INSTITUTE,
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
    await database.syllabusVersion
      .findFirst({
        where: {
          status: AcademicCatalogStatus.PUBLISHED,
        },
        orderBy: [
          { isDefault: "desc" },
          { createdAt: "asc" },
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

  const topicCodes =
    questions.map(
      (question) =>
        question.topicCode,
    );

  const topics =
    await database.topic.findMany({
      where: {
        code: {
          in: topicCodes,
        },
      },
      include: {
        chapter: true,
      },
    });

  const topicByCode =
    new Map(
      topics.map(
        (topic) => [
          topic.code,
          topic,
        ],
      ),
    );

  const tagSlugs =
    Array.from(
      new Set(
        questions.flatMap(
          (question) =>
            question.tags,
        ),
      ),
    );

  const tagBySlug =
    new Map<string, string>();

  for (
    const slug
    of tagSlugs
  ) {
    const tag =
      await database.questionTag
        .upsert({
          where: { slug },
          update: {
            name:
              tagNames[slug] ??
              slug,
          },
          create: {
            slug,
            name:
              tagNames[slug] ??
              slug,
          },
        });

    tagBySlug.set(
      slug,
      tag.id,
    );
  }

  const questionByCode =
    new Map<
      string,
      {
        id: string;
        subjectCode:
          QuestionSeed["subjectCode"];
        topicId: string;
      }
    >();

  for (
    const seed
    of questions
  ) {
    const topic =
      topicByCode.get(
        seed.topicCode,
      );

    if (!topic) {
      throw new Error(
        `Topic ${seed.topicCode} was not found.`,
      );
    }

    const syllabusSubject =
      syllabusVersion.subjects.find(
        (item) =>
          item.subject.code ===
          seed.subjectCode,
      );

    if (!syllabusSubject) {
      throw new Error(
        `Subject ${seed.subjectCode} is missing from the published syllabus.`,
      );
    }

    const question =
      await database.question.upsert({
        where: {
          code: seed.code,
        },
        update: {
          ownerOrganizationId:
            organization.id,
          subjectId:
            syllabusSubject.subjectId,
          chapterId:
            topic.chapterId,
          topicId:
            topic.id,
          type:
            QuestionType.SINGLE_CORRECT,
          difficulty:
            seed.difficulty,
          status:
            QuestionStatus.PUBLISHED,
          stem:
            seed.stem,
          explanation:
            seed.explanation,
          sourceType:
            QuestionSourceType.PLATFORM,
          sourceName:
            "AIMERS Development Question Bank",
          marks: 4,
          negativeMarks: 1,
          estimatedSeconds:
            seed.estimatedSeconds,
          publishedAt:
            new Date(),
        },
        create: {
          ownerOrganizationId:
            organization.id,
          subjectId:
            syllabusSubject.subjectId,
          chapterId:
            topic.chapterId,
          topicId:
            topic.id,
          code:
            seed.code,
          type:
            QuestionType.SINGLE_CORRECT,
          difficulty:
            seed.difficulty,
          status:
            QuestionStatus.PUBLISHED,
          stem:
            seed.stem,
          explanation:
            seed.explanation,
          sourceType:
            QuestionSourceType.PLATFORM,
          sourceName:
            "AIMERS Development Question Bank",
          marks: 4,
          negativeMarks: 1,
          estimatedSeconds:
            seed.estimatedSeconds,
          publishedAt:
            new Date(),
        },
      });

    for (
      const [
        index,
        option,
      ]
      of seed.options.entries()
    ) {
      await database.questionOption
        .upsert({
          where: {
            questionId_label: {
              questionId:
                question.id,
              label:
                option.label,
            },
          },
          update: {
            text:
              option.text,
            isCorrect:
              option.isCorrect,
            sequenceNumber:
              index + 1,
          },
          create: {
            questionId:
              question.id,
            label:
              option.label,
            text:
              option.text,
            isCorrect:
              option.isCorrect,
            sequenceNumber:
              index + 1,
          },
        });
    }

    for (
      const slug
      of seed.tags
    ) {
      const tagId =
        tagBySlug.get(slug);

      if (!tagId) {
        throw new Error(
          `Tag ${slug} was not created.`,
        );
      }

      await database.questionTagAssignment
        .upsert({
          where: {
            questionId_questionTagId: {
              questionId:
                question.id,
              questionTagId:
                tagId,
            },
          },
          update: {},
          create: {
            questionId:
              question.id,
            questionTagId:
              tagId,
          },
        });
    }

    questionByCode.set(
      seed.code,
      {
        id: question.id,
        subjectCode:
          seed.subjectCode,
        topicId:
          topic.id,
      },
    );
  }

  const validationTest =
    await database.mockTest.upsert({
      where: {
        ownerOrganizationId_code: {
          ownerOrganizationId:
            organization.id,
          code:
            "DEV-QBANK-MINI-001",
        },
      },
      update: {
        syllabusVersionId:
          syllabusVersion.id,
        title:
          "AIMERS Question Bank Validation Test",
        description:
          "Development-only 12-question test containing original AIMERS validation questions. It is not an official NEET paper or PYQ collection.",
        instructions:
          "Choose one option for each question. Correct answers award 4 marks and incorrect answers deduct 1 mark.",
        sourceType:
          MockTestSourceType.PLATFORM,
        scope:
          MockTestScope.CUSTOM,
        status:
          MockTestStatus.PUBLISHED,
        totalQuestions: 12,
        totalMarks: 48,
        durationMinutes: 24,
        publishedAt:
          new Date(),
      },
      create: {
        ownerOrganizationId:
          organization.id,
        syllabusVersionId:
          syllabusVersion.id,
        code:
          "DEV-QBANK-MINI-001",
        title:
          "AIMERS Question Bank Validation Test",
        description:
          "Development-only 12-question test containing original AIMERS validation questions. It is not an official NEET paper or PYQ collection.",
        instructions:
          "Choose one option for each question. Correct answers award 4 marks and incorrect answers deduct 1 mark.",
        sourceType:
          MockTestSourceType.PLATFORM,
        scope:
          MockTestScope.CUSTOM,
        status:
          MockTestStatus.PUBLISHED,
        totalQuestions: 12,
        totalMarks: 48,
        durationMinutes: 24,
        publishedAt:
          new Date(),
      },
    });

  const subjectDefinitions = [
    {
      code: "PHYSICS",
      name: "Physics",
      sequenceNumber: 1,
    },
    {
      code: "CHEMISTRY",
      name: "Chemistry",
      sequenceNumber: 2,
    },
    {
      code: "BIOLOGY",
      name: "Biology",
      sequenceNumber: 3,
    },
  ] as const;

  let assignedQuestionCount = 0;

  for (
    const subjectDefinition
    of subjectDefinitions
  ) {
    const syllabusSubject =
      syllabusVersion.subjects.find(
        (item) =>
          item.subject.code ===
          subjectDefinition.code,
      );

    if (!syllabusSubject) {
      throw new Error(
        `Subject ${subjectDefinition.code} is missing from the published syllabus.`,
      );
    }

    const section =
      await database.mockTestSection
        .upsert({
          where: {
            mockTestId_sequenceNumber: {
              mockTestId:
                validationTest.id,
              sequenceNumber:
                subjectDefinition.sequenceNumber,
            },
          },
          update: {
            subjectId:
              syllabusSubject.subjectId,
            name:
              subjectDefinition.name,
            totalQuestions: 4,
            totalMarks: 16,
            marksPerCorrect: 4,
            negativeMarksPerWrong: 1,
          },
          create: {
            mockTestId:
              validationTest.id,
            subjectId:
              syllabusSubject.subjectId,
            name:
              subjectDefinition.name,
            sequenceNumber:
              subjectDefinition.sequenceNumber,
            totalQuestions: 4,
            totalMarks: 16,
            marksPerCorrect: 4,
            negativeMarksPerWrong: 1,
          },
        });

    const subjectQuestions =
      questions.filter(
        (question) =>
          question.subjectCode ===
          subjectDefinition.code,
      );

    for (
      const [
        index,
        questionSeed,
      ]
      of subjectQuestions.entries()
    ) {
      const question =
        questionByCode.get(
          questionSeed.code,
        );

      if (!question) {
        throw new Error(
          `Question ${questionSeed.code} was not created.`,
        );
      }

      await database.mockTestQuestion
        .upsert({
          where: {
            mockTestSectionId_questionId: {
              mockTestSectionId:
                section.id,
              questionId:
                question.id,
            },
          },
          update: {
            sequenceNumber:
              index + 1,
            marks: 4,
            negativeMarks: 1,
          },
          create: {
            mockTestSectionId:
              section.id,
            questionId:
              question.id,
            sequenceNumber:
              index + 1,
            marks: 4,
            negativeMarks: 1,
          },
        });

      await database.mockTestTopicBlueprint
        .upsert({
          where: {
            mockTestSectionId_topicId: {
              mockTestSectionId:
                section.id,
              topicId:
                question.topicId,
            },
          },
          update: {
            plannedQuestions: 1,
            weightagePercent: 25,
          },
          create: {
            mockTestSectionId:
              section.id,
            topicId:
              question.topicId,
            plannedQuestions: 1,
            weightagePercent: 25,
          },
        });

      assignedQuestionCount += 1;
    }
  }

  const [
    questionCount,
    optionCount,
    tagCount,
  ] = await Promise.all([
    database.question.count({
      where: {
        code: {
          startsWith: "DEV-",
        },
      },
    }),
    database.questionOption.count({
      where: {
        question: {
          code: {
            startsWith: "DEV-",
          },
        },
      },
    }),
    database.questionTag.count(),
  ]);

  console.log(
    "Seeded Question Bank foundation:",
    {
      questionCount,
      optionCount,
      tagCount,
      assignedQuestionCount,
      validationTest:
        validationTest.code,
    },
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      "Question Bank seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
