import {
  AcademicCatalogStatus,
  AcademicEnrollmentStatus,
  AcademicProgrammeType,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  StudentStatus,
} from "@prisma/client";

const database = new PrismaClient();

interface TopicSeed {
  code: string;
  name: string;
  estimatedMinutes?: number;
}

interface ChapterSeed {
  code: string;
  name: string;
  estimatedMinutes?: number;
  topics: TopicSeed[];
}

interface UnitSeed {
  code: string;
  name: string;
  chapters: ChapterSeed[];
}

interface SubjectSeed {
  code: string;
  name: string;
  sequenceNumber: number;
  units: UnitSeed[];
}

const subjects: SubjectSeed[] = [
  {
    code: "PHYSICS",
    name: "Physics",
    sequenceNumber: 1,
    units: [
      {
        code: "PHY-MECHANICS",
        name: "Mechanics",
        chapters: [
          {
            code: "PHY-UNITS-MEASUREMENTS",
            name: "Units and Measurements",
            estimatedMinutes: 300,
            topics: [
              {
                code: "PHY-UNITS-SI",
                name: "SI Units and Dimensions",
                estimatedMinutes: 75,
              },
              {
                code: "PHY-UNITS-ERRORS",
                name: "Errors and Significant Figures",
                estimatedMinutes: 90,
              },
              {
                code: "PHY-UNITS-DIMENSIONAL",
                name: "Dimensional Analysis",
                estimatedMinutes: 90,
              },
            ],
          },
          {
            code: "PHY-KINEMATICS",
            name: "Kinematics",
            estimatedMinutes: 420,
            topics: [
              {
                code: "PHY-KINEMATICS-1D",
                name: "Motion in One Dimension",
                estimatedMinutes: 120,
              },
              {
                code: "PHY-KINEMATICS-VECTORS",
                name: "Vectors and Relative Motion",
                estimatedMinutes: 135,
              },
              {
                code: "PHY-KINEMATICS-PROJECTILE",
                name: "Projectile Motion",
                estimatedMinutes: 135,
              },
            ],
          },
          {
            code: "PHY-LAWS-MOTION",
            name: "Laws of Motion",
            estimatedMinutes: 480,
            topics: [
              {
                code: "PHY-LOM-NEWTON",
                name: "Newton's Laws",
                estimatedMinutes: 120,
              },
              {
                code: "PHY-LOM-FRICTION",
                name: "Friction",
                estimatedMinutes: 135,
              },
              {
                code: "PHY-LOM-CIRCULAR",
                name: "Circular Motion",
                estimatedMinutes: 150,
              },
            ],
          },
        ],
      },
      {
        code: "PHY-THERMAL",
        name: "Thermal Physics",
        chapters: [
          {
            code: "PHY-THERMODYNAMICS",
            name: "Thermodynamics",
            estimatedMinutes: 420,
            topics: [
              {
                code: "PHY-THERMO-LAWS",
                name: "Laws of Thermodynamics",
                estimatedMinutes: 135,
              },
              {
                code: "PHY-THERMO-PROCESSES",
                name: "Thermodynamic Processes",
                estimatedMinutes: 135,
              },
              {
                code: "PHY-THERMO-HEAT-ENGINES",
                name: "Heat Engines and Refrigerators",
                estimatedMinutes: 120,
              },
            ],
          },
          {
            code: "PHY-KINETIC-THEORY",
            name: "Kinetic Theory",
            estimatedMinutes: 300,
            topics: [
              {
                code: "PHY-KTG-GAS-LAWS",
                name: "Gas Laws",
                estimatedMinutes: 90,
              },
              {
                code: "PHY-KTG-MOLECULAR",
                name: "Molecular Interpretation of Pressure",
                estimatedMinutes: 105,
              },
              {
                code: "PHY-KTG-DEGREES",
                name: "Degrees of Freedom",
                estimatedMinutes: 90,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "CHEMISTRY",
    name: "Chemistry",
    sequenceNumber: 2,
    units: [
      {
        code: "CHEM-PHYSICAL",
        name: "Physical Chemistry",
        chapters: [
          {
            code: "CHEM-MOLE-CONCEPT",
            name: "Some Basic Concepts of Chemistry",
            estimatedMinutes: 420,
            topics: [
              {
                code: "CHEM-MOLE-MASS",
                name: "Atomic and Molecular Mass",
                estimatedMinutes: 90,
              },
              {
                code: "CHEM-MOLE-STOICHIOMETRY",
                name: "Mole Concept and Stoichiometry",
                estimatedMinutes: 150,
              },
              {
                code: "CHEM-MOLE-LIMITING",
                name: "Limiting Reagent and Yield",
                estimatedMinutes: 120,
              },
            ],
          },
          {
            code: "CHEM-ATOMIC-STRUCTURE",
            name: "Structure of Atom",
            estimatedMinutes: 420,
            topics: [
              {
                code: "CHEM-ATOM-MODELS",
                name: "Atomic Models",
                estimatedMinutes: 105,
              },
              {
                code: "CHEM-ATOM-QUANTUM",
                name: "Quantum Numbers and Orbitals",
                estimatedMinutes: 150,
              },
              {
                code: "CHEM-ATOM-CONFIGURATION",
                name: "Electronic Configuration",
                estimatedMinutes: 120,
              },
            ],
          },
          {
            code: "CHEM-BONDING",
            name: "Chemical Bonding and Molecular Structure",
            estimatedMinutes: 480,
            topics: [
              {
                code: "CHEM-BOND-IONIC-COVALENT",
                name: "Ionic and Covalent Bonding",
                estimatedMinutes: 135,
              },
              {
                code: "CHEM-BOND-VSEPR",
                name: "VSEPR Theory and Molecular Shape",
                estimatedMinutes: 135,
              },
              {
                code: "CHEM-BOND-HYBRIDISATION",
                name: "Hybridisation and Molecular Orbitals",
                estimatedMinutes: 150,
              },
            ],
          },
        ],
      },
      {
        code: "CHEM-ORGANIC",
        name: "Organic Chemistry",
        chapters: [
          {
            code: "CHEM-ORGANIC-BASICS",
            name: "Organic Chemistry: Basic Principles",
            estimatedMinutes: 540,
            topics: [
              {
                code: "CHEM-ORG-NOMENCLATURE",
                name: "Nomenclature",
                estimatedMinutes: 150,
              },
              {
                code: "CHEM-ORG-ISOMERISM",
                name: "Isomerism",
                estimatedMinutes: 180,
              },
              {
                code: "CHEM-ORG-MECHANISMS",
                name: "Electronic Effects and Reaction Mechanisms",
                estimatedMinutes: 180,
              },
            ],
          },
          {
            code: "CHEM-HYDROCARBONS",
            name: "Hydrocarbons",
            estimatedMinutes: 420,
            topics: [
              {
                code: "CHEM-HC-ALKANES",
                name: "Alkanes",
                estimatedMinutes: 120,
              },
              {
                code: "CHEM-HC-ALKENES-ALKYNES",
                name: "Alkenes and Alkynes",
                estimatedMinutes: 150,
              },
              {
                code: "CHEM-HC-AROMATIC",
                name: "Aromatic Hydrocarbons",
                estimatedMinutes: 120,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "BIOLOGY",
    name: "Biology",
    sequenceNumber: 3,
    units: [
      {
        code: "BIO-DIVERSITY",
        name: "Diversity in Living World",
        chapters: [
          {
            code: "BIO-LIVING-WORLD",
            name: "The Living World",
            estimatedMinutes: 240,
            topics: [
              {
                code: "BIO-LW-LIFE",
                name: "Characteristics of Living Organisms",
                estimatedMinutes: 60,
              },
              {
                code: "BIO-LW-TAXONOMY",
                name: "Taxonomy and Systematics",
                estimatedMinutes: 75,
              },
              {
                code: "BIO-LW-NOMENCLATURE",
                name: "Nomenclature and Taxonomic Categories",
                estimatedMinutes: 75,
              },
            ],
          },
          {
            code: "BIO-CLASSIFICATION",
            name: "Biological Classification",
            estimatedMinutes: 360,
            topics: [
              {
                code: "BIO-CLASS-KINGDOMS",
                name: "Five Kingdom Classification",
                estimatedMinutes: 90,
              },
              {
                code: "BIO-CLASS-MONERA-PROTISTA",
                name: "Monera and Protista",
                estimatedMinutes: 120,
              },
              {
                code: "BIO-CLASS-FUNGI-VIRUSES",
                name: "Fungi, Viruses and Viroids",
                estimatedMinutes: 120,
              },
            ],
          },
          {
            code: "BIO-PLANT-KINGDOM",
            name: "Plant Kingdom",
            estimatedMinutes: 420,
            topics: [
              {
                code: "BIO-PK-ALGAE-BRYO",
                name: "Algae and Bryophytes",
                estimatedMinutes: 120,
              },
              {
                code: "BIO-PK-PTERIDO-GYMNO",
                name: "Pteridophytes and Gymnosperms",
                estimatedMinutes: 135,
              },
              {
                code: "BIO-PK-ANGIO",
                name: "Angiosperms and Life Cycles",
                estimatedMinutes: 135,
              },
            ],
          },
          {
            code: "BIO-ANIMAL-KINGDOM",
            name: "Animal Kingdom",
            estimatedMinutes: 480,
            topics: [
              {
                code: "BIO-AK-BASIS",
                name: "Basis of Classification",
                estimatedMinutes: 90,
              },
              {
                code: "BIO-AK-INVERTEBRATES",
                name: "Non-chordates",
                estimatedMinutes: 180,
              },
              {
                code: "BIO-AK-CHORDATES",
                name: "Chordates",
                estimatedMinutes: 180,
              },
            ],
          },
        ],
      },
      {
        code: "BIO-CELL",
        name: "Cell Structure and Function",
        chapters: [
          {
            code: "BIO-CELL-UNIT",
            name: "Cell: The Unit of Life",
            estimatedMinutes: 420,
            topics: [
              {
                code: "BIO-CELL-TYPES",
                name: "Prokaryotic and Eukaryotic Cells",
                estimatedMinutes: 120,
              },
              {
                code: "BIO-CELL-ORGANELLES",
                name: "Cell Organelles",
                estimatedMinutes: 165,
              },
              {
                code: "BIO-CELL-MEMBRANE",
                name: "Cell Membrane and Transport",
                estimatedMinutes: 105,
              },
            ],
          },
          {
            code: "BIO-BIOMOLECULES",
            name: "Biomolecules",
            estimatedMinutes: 420,
            topics: [
              {
                code: "BIO-BM-CARBS-LIPIDS",
                name: "Carbohydrates and Lipids",
                estimatedMinutes: 120,
              },
              {
                code: "BIO-BM-PROTEINS",
                name: "Proteins and Enzymes",
                estimatedMinutes: 150,
              },
              {
                code: "BIO-BM-NUCLEIC",
                name: "Nucleic Acids",
                estimatedMinutes: 120,
              },
            ],
          },
        ],
      },
    ],
  },
];

async function seedOrganizations() {
  const platform =
    await database.organization.upsert({
      where: {
        slug: "aimers-platform",
      },
      update: {
        name: "AIMERS Platform",
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
      },
      create: {
        name: "AIMERS Platform",
        slug: "aimers-platform",
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
        timezone: "Asia/Kolkata",
        country: "IN",
      },
    });

  const academy =
    await database.organization.upsert({
      where: {
        slug: "aimers-academy-trivandrum",
      },
      update: {
        name: "AIMERS Academy Trivandrum",
        type:
          OrganizationType.COACHING_INSTITUTE,
        status: OrganizationStatus.ACTIVE,
      },
      create: {
        name: "AIMERS Academy Trivandrum",
        slug: "aimers-academy-trivandrum",
        type:
          OrganizationType.COACHING_INSTITUTE,
        status: OrganizationStatus.ACTIVE,
        timezone: "Asia/Kolkata",
        country: "IN",
      },
    });

  return {
    platform,
    academy,
  };
}

async function seedAcademicCatalog(
  platformId: string,
) {
  const board =
    await database.educationBoard.upsert({
      where: {
        code: "AIMERS-ENTRANCE",
      },
      update: {
        name: "AIMERS Entrance Catalogue",
        country: "IN",
        status:
          AcademicCatalogStatus.PUBLISHED,
      },
      create: {
        code: "AIMERS-ENTRANCE",
        name: "AIMERS Entrance Catalogue",
        country: "IN",
        status:
          AcademicCatalogStatus.PUBLISHED,
      },
    });

  const programme =
    await database.academicProgramme.upsert({
      where: {
        code: "NEET-UG",
      },
      update: {
        boardId: board.id,
        ownerOrganizationId: platformId,
        name: "NEET UG",
        description:
          "AIMERS development catalogue for medical entrance preparation. It is not an official NTA or NMC syllabus publication.",
        type:
          AcademicProgrammeType.ENTRANCE_EXAM,
        status:
          AcademicCatalogStatus.PUBLISHED,
      },
      create: {
        boardId: board.id,
        ownerOrganizationId: platformId,
        code: "NEET-UG",
        name: "NEET UG",
        description:
          "AIMERS development catalogue for medical entrance preparation. It is not an official NTA or NMC syllabus publication.",
        type:
          AcademicProgrammeType.ENTRANCE_EXAM,
        status:
          AcademicCatalogStatus.PUBLISHED,
      },
    });

  const syllabus =
    await database.syllabusVersion.upsert({
      where: {
        programmeId_versionCode: {
          programmeId: programme.id,
          versionCode:
            "AIMERS-STARTER-2027",
        },
      },
      update: {
        name:
          "NEET UG 2027 Starter Catalogue",
        description:
          "Development seed content for testing AIMERS academic workflows. Replace with a verified official syllabus before production.",
        isDefault: true,
        status:
          AcademicCatalogStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        programmeId: programme.id,
        versionCode:
          "AIMERS-STARTER-2027",
        name:
          "NEET UG 2027 Starter Catalogue",
        description:
          "Development seed content for testing AIMERS academic workflows. Replace with a verified official syllabus before production.",
        isDefault: true,
        status:
          AcademicCatalogStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

  for (const subjectSeed of subjects) {
    const subject =
      await database.subject.upsert({
        where: {
          code: subjectSeed.code,
        },
        update: {
          name: subjectSeed.name,
          status:
            AcademicCatalogStatus.PUBLISHED,
        },
        create: {
          code: subjectSeed.code,
          name: subjectSeed.name,
          status:
            AcademicCatalogStatus.PUBLISHED,
        },
      });

    const syllabusSubject =
      await database.syllabusSubject.upsert({
        where: {
          syllabusVersionId_subjectId: {
            syllabusVersionId:
              syllabus.id,
            subjectId: subject.id,
          },
        },
        update: {
          sequenceNumber:
            subjectSeed.sequenceNumber,
          isRequired: true,
        },
        create: {
          syllabusVersionId:
            syllabus.id,
          subjectId: subject.id,
          sequenceNumber:
            subjectSeed.sequenceNumber,
          isRequired: true,
        },
      });

    for (
      const [
        unitIndex,
        unitSeed,
      ] of subjectSeed.units.entries()
    ) {
      const unit =
        await database.academicUnit.upsert({
          where: {
            syllabusSubjectId_code: {
              syllabusSubjectId:
                syllabusSubject.id,
              code: unitSeed.code,
            },
          },
          update: {
            name: unitSeed.name,
            sequenceNumber:
              unitIndex + 1,
          },
          create: {
            syllabusSubjectId:
              syllabusSubject.id,
            code: unitSeed.code,
            name: unitSeed.name,
            sequenceNumber:
              unitIndex + 1,
          },
        });

      for (
        const [
          chapterIndex,
          chapterSeed,
        ] of unitSeed.chapters.entries()
      ) {
        const chapter =
          await database.chapter.upsert({
            where: {
              unitId_code: {
                unitId: unit.id,
                code: chapterSeed.code,
              },
            },
            update: {
              name: chapterSeed.name,
              sequenceNumber:
                chapterIndex + 1,
              estimatedMinutes:
                chapterSeed
                  .estimatedMinutes,
            },
            create: {
              unitId: unit.id,
              code: chapterSeed.code,
              name: chapterSeed.name,
              sequenceNumber:
                chapterIndex + 1,
              estimatedMinutes:
                chapterSeed
                  .estimatedMinutes,
            },
          });

        for (
          const [
            topicIndex,
            topicSeed,
          ] of chapterSeed.topics.entries()
        ) {
          await database.topic.upsert({
            where: {
              chapterId_code: {
                chapterId: chapter.id,
                code: topicSeed.code,
              },
            },
            update: {
              name: topicSeed.name,
              sequenceNumber:
                topicIndex + 1,
              estimatedMinutes:
                topicSeed
                  .estimatedMinutes,
            },
            create: {
              chapterId: chapter.id,
              code: topicSeed.code,
              name: topicSeed.name,
              sequenceNumber:
                topicIndex + 1,
              estimatedMinutes:
                topicSeed
                  .estimatedMinutes,
            },
          });
        }
      }
    }
  }

  return {
    board,
    programme,
    syllabus,
  };
}

async function enrollDevelopmentStudent(
  syllabusVersionId: string,
) {
  const student =
    await database.user.findUnique({
      where: {
        email: "student@aimers.local",
      },
      select: {
        studentProfiles: {
          where: {
            status: StudentStatus.ACTIVE,
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

  const studentProfile =
    student?.studentProfiles[0];

  if (!studentProfile) {
    return false;
  }

  await database.studentEnrollment.upsert({
    where: {
      studentProfileId_syllabusVersionId: {
        studentProfileId:
          studentProfile.id,
        syllabusVersionId,
      },
    },
    update: {
      status:
        AcademicEnrollmentStatus.ACTIVE,
      isPrimary: true,
    },
    create: {
      studentProfileId:
        studentProfile.id,
      syllabusVersionId,
      status:
        AcademicEnrollmentStatus.ACTIVE,
      isPrimary: true,
      startedAt: new Date(),
    },
  });

  return true;
}

async function seed(): Promise<void> {
  const {
    platform,
    academy,
  } = await seedOrganizations();

  const academic =
    await seedAcademicCatalog(
      platform.id,
    );

  const developmentStudentEnrolled =
    await enrollDevelopmentStudent(
      academic.syllabus.id,
    );

  const counts = {
    subjects:
      await database.subject.count(),
    units:
      await database.academicUnit.count(),
    chapters:
      await database.chapter.count(),
    topics:
      await database.topic.count(),
  };

  console.log(
    "Seeded organisations:",
    {
      platform: platform.slug,
      academy: academy.slug,
    },
  );

  console.log(
    "Seeded academic catalogue:",
    {
      programme:
        academic.programme.code,
      syllabus:
        academic.syllabus.versionCode,
      ...counts,
      developmentStudentEnrolled,
    },
  );
}

seed()
  .catch((error: unknown) => {
    console.error(
      "Database seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
