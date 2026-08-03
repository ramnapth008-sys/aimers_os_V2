import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicCatalogStatus,
  AcademicEnrollmentStatus,
  LearningProgressState,
  StudentStatus,
  TopicMasteryLevel,
} from "@aimers/database";

import {
  DatabaseService,
} from "../infrastructure/database/database.service";

import type {
  UpdateChapterProgressDto,
} from "./dto/update-chapter-progress.dto";

import type {
  UpdateTopicMasteryDto,
} from "./dto/update-topic-mastery.dto";

@Injectable()
export class AcademicService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  getCatalog() {
    return this.database
      .academicProgramme
      .findMany({
        where: {
          status:
            AcademicCatalogStatus.PUBLISHED,
        },

        orderBy: {
          name: "asc",
        },

        include: {
          board: true,

          syllabusVersions: {
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
                createdAt: "desc",
              },
            ],

            include: {
              subjects: {
                orderBy: {
                  sequenceNumber: "asc",
                },

                include: {
                  subject: true,

                  units: {
                    orderBy: {
                      sequenceNumber: "asc",
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
          },
        },
      });
  }

  private async getStudentProfile(
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
        "Complete student onboarding before opening the academic workspace.",
      );
    }

    return profile;
  }

  private async getDefaultSyllabus(
    examTarget: string | null,
  ) {
    const normalizedTarget =
      examTarget
        ?.trim()
        .toUpperCase() ?? "";

    const programmeCode =
      normalizedTarget.includes("NEET")
        ? "NEET-UG"
        : null;

    if (!programmeCode) {
      throw new BadRequestException(
        "No seeded academic programme matches the student's current exam target.",
      );
    }

    const syllabus =
      await this.database
        .syllabusVersion
        .findFirst({
          where: {
            programme: {
              code: programmeCode,
              status:
                AcademicCatalogStatus
                  .PUBLISHED,
            },

            status:
              AcademicCatalogStatus
                .PUBLISHED,

            isDefault: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

    if (!syllabus) {
      throw new NotFoundException(
        "The default academic syllabus is unavailable.",
      );
    }

    return syllabus;
  }

  async ensureEnrollment(
    userId: string,
  ) {
    const profile =
      await this.getStudentProfile(
        userId,
      );

    const syllabus =
      await this.getDefaultSyllabus(
        profile.examTarget,
      );

    return this.database
      .studentEnrollment
      .upsert({
        where: {
          studentProfileId_syllabusVersionId: {
            studentProfileId:
              profile.id,

            syllabusVersionId:
              syllabus.id,
          },
        },

        update: {
          status:
            AcademicEnrollmentStatus
              .ACTIVE,

          isPrimary: true,
        },

        create: {
          studentProfileId:
            profile.id,

          syllabusVersionId:
            syllabus.id,

          status:
            AcademicEnrollmentStatus
              .ACTIVE,

          isPrimary: true,
          startedAt: new Date(),
        },

        include: {
          syllabusVersion: {
            include: {
              programme: true,
            },
          },
        },
      });
  }

  async getMyWorkspace(
    userId: string,
  ) {
    const enrollment =
      await this.ensureEnrollment(
        userId,
      );

    const workspace =
      await this.database
        .studentEnrollment
        .findUnique({
          where: {
            id: enrollment.id,
          },

          include: {
            syllabusVersion: {
              include: {
                programme: {
                  include: {
                    board: true,
                  },
                },

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
            },

            chapterProgress: true,
            topicMastery: true,
          },
        });

    if (!workspace) {
      throw new NotFoundException(
        "The student academic workspace was not found.",
      );
    }

    const chapters =
      workspace
        .syllabusVersion
        .subjects
        .flatMap(
          (subject) =>
            subject.units.flatMap(
              (unit) =>
                unit.chapters,
            ),
        );

    const topics =
      chapters.flatMap(
        (chapter) =>
          chapter.topics,
      );

    const completedChapters =
      workspace.chapterProgress
        .filter(
          (progress) =>
            progress.state ===
            LearningProgressState
              .COMPLETED,
        )
        .length;

    const masteredTopics =
      workspace.topicMastery
        .filter(
          (mastery) =>
            mastery.level ===
            TopicMasteryLevel
              .MASTERED,
        )
        .length;

    return {
      ...workspace,

      summary: {
        subjectCount:
          workspace
            .syllabusVersion
            .subjects.length,

        chapterCount:
          chapters.length,

        topicCount:
          topics.length,

        completedChapters,
        masteredTopics,

        chapterCompletionPercent:
          chapters.length === 0
            ? 0
            : Math.round(
                (
                  completedChapters /
                  chapters.length
                ) * 100,
              ),
      },
    };
  }

  async updateChapterProgress(
    userId: string,
    chapterId: string,
    dto: UpdateChapterProgressDto,
  ) {
    const enrollment =
      await this.ensureEnrollment(
        userId,
      );

    const chapter =
      await this.database.chapter
        .findFirst({
          where: {
            id: chapterId,

            unit: {
              syllabusSubject: {
                syllabusVersionId:
                  enrollment
                    .syllabusVersionId,
              },
            },
          },
        });

    if (!chapter) {
      throw new NotFoundException(
        "The chapter does not belong to the student's active syllabus.",
      );
    }

    const existing =
      await this.database
        .chapterProgress
        .findUnique({
          where: {
            studentEnrollmentId_chapterId: {
              studentEnrollmentId:
                enrollment.id,

              chapterId,
            },
          },
        });

    let completionPercent =
      dto.completionPercent ??
      existing?.completionPercent ??
      0;

    let state =
      dto.state ??
      (
        completionPercent >= 100
          ? LearningProgressState
              .COMPLETED
          : completionPercent > 0
            ? LearningProgressState
                .IN_PROGRESS
            : LearningProgressState
                .NOT_STARTED
      );

    if (
      state ===
      LearningProgressState.COMPLETED
    ) {
      completionPercent = 100;
    }

    if (
      state ===
      LearningProgressState.NOT_STARTED
    ) {
      completionPercent = 0;
    }

    const questionAttempts =
      dto.questionAttempts ??
      existing?.questionAttempts ??
      0;

    const correctAnswers =
      dto.correctAnswers ??
      existing?.correctAnswers ??
      0;

    if (
      correctAnswers >
      questionAttempts
    ) {
      throw new BadRequestException(
        "correctAnswers cannot exceed questionAttempts.",
      );
    }

    const now = new Date();

    return this.database
      .chapterProgress
      .upsert({
        where: {
          studentEnrollmentId_chapterId: {
            studentEnrollmentId:
              enrollment.id,

            chapterId,
          },
        },

        update: {
          state,
          completionPercent,

          revisionCount:
            dto.revisionCount ??
            existing?.revisionCount ??
            0,

          questionAttempts,
          correctAnswers,

          startedAt:
            state ===
            LearningProgressState
              .NOT_STARTED
              ? null
              : existing?.startedAt ??
                now,

          completedAt:
            state ===
            LearningProgressState
              .COMPLETED
              ? existing
                  ?.completedAt ??
                now
              : null,

          lastStudiedAt: now,
        },

        create: {
          studentEnrollmentId:
            enrollment.id,

          chapterId,
          state,
          completionPercent,

          revisionCount:
            dto.revisionCount ??
            0,

          questionAttempts,
          correctAnswers,

          startedAt:
            state ===
            LearningProgressState
              .NOT_STARTED
              ? null
              : now,

          completedAt:
            state ===
            LearningProgressState
              .COMPLETED
              ? now
              : null,

          lastStudiedAt: now,
        },
      });
  }

  async updateTopicMastery(
    userId: string,
    topicId: string,
    dto: UpdateTopicMasteryDto,
  ) {
    const enrollment =
      await this.ensureEnrollment(
        userId,
      );

    const topic =
      await this.database.topic
        .findFirst({
          where: {
            id: topicId,

            chapter: {
              unit: {
                syllabusSubject: {
                  syllabusVersionId:
                    enrollment
                      .syllabusVersionId,
                },
              },
            },
          },
        });

    if (!topic) {
      throw new NotFoundException(
        "The topic does not belong to the student's active syllabus.",
      );
    }

    const existing =
      await this.database
        .topicMastery
        .findUnique({
          where: {
            studentEnrollmentId_topicId: {
              studentEnrollmentId:
                enrollment.id,

              topicId,
            },
          },
        });

    const masteryScore =
      dto.masteryScore ??
      existing?.masteryScore ??
      0;

    const attempts =
      dto.attempts ??
      existing?.attempts ??
      0;

    const correctAnswers =
      dto.correctAnswers ??
      existing?.correctAnswers ??
      0;

    if (
      correctAnswers >
      attempts
    ) {
      throw new BadRequestException(
        "correctAnswers cannot exceed attempts.",
      );
    }

    const level =
      dto.level ??
      (
        masteryScore >= 80
          ? TopicMasteryLevel
              .MASTERED
          : masteryScore >= 60
            ? TopicMasteryLevel
                .PROFICIENT
            : masteryScore >= 40
              ? TopicMasteryLevel
                  .DEVELOPING
              : masteryScore > 0
                ? TopicMasteryLevel
                    .BEGINNER
                : TopicMasteryLevel
                    .NOT_ASSESSED
      );

    const now = new Date();

    return this.database
      .topicMastery
      .upsert({
        where: {
          studentEnrollmentId_topicId: {
            studentEnrollmentId:
              enrollment.id,

            topicId,
          },
        },

        update: {
          level,
          masteryScore,

          confidenceScore:
            dto.confidenceScore ??
            existing
              ?.confidenceScore ??
            0,

          attempts,
          correctAnswers,

          lastAssessedAt:
            attempts > 0
              ? now
              : existing
                  ?.lastAssessedAt,

          nextReviewAt:
            dto.nextReviewAt
              ? new Date(
                  dto.nextReviewAt,
                )
              : existing
                  ?.nextReviewAt,
        },

        create: {
          studentEnrollmentId:
            enrollment.id,

          topicId,
          level,
          masteryScore,

          confidenceScore:
            dto.confidenceScore ??
            0,

          attempts,
          correctAnswers,

          lastAssessedAt:
            attempts > 0
              ? now
              : null,

          nextReviewAt:
            dto.nextReviewAt
              ? new Date(
                  dto.nextReviewAt,
                )
              : null,
        },
      });
  }
}
