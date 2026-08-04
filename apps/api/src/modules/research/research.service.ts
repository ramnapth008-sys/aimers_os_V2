import {
  createHash,
} from "node:crypto";

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  ResearchMessageRole,
  ResearchProjectStatus,
  ResearchSourceStatus,
  ResearchSourceType,
  StudentStatus,
} from "@aimers/database";

import {
  AiService,
} from "../../ai/ai.service";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ResearchSourceIngestionService,
} from "./research-source-ingestion.service";

import type {
  CreateResearchCitationDto,
} from "./dto/create-research-citation.dto";

import type {
  CreateResearchMessageDto,
} from "./dto/create-research-message.dto";

import type {
  GenerateResearchAssistantReplyDto,
} from "./dto/generate-research-assistant-reply.dto";

import type {
  CreateResearchMindMapEdgeDto,
} from "./dto/create-research-mind-map-edge.dto";

import type {
  CreateResearchMindMapNodeDto,
} from "./dto/create-research-mind-map-node.dto";

import type {
  CreateResearchProjectDto,
} from "./dto/create-research-project.dto";

import type {
  CreateResearchSourceExcerptDto,
} from "./dto/create-research-source-excerpt.dto";

import type {
  CreateResearchSourceDto,
} from "./dto/create-research-source.dto";

import type {
  CreateResearchThreadDto,
} from "./dto/create-research-thread.dto";

import type {
  ListResearchProjectsQueryDto,
} from "./dto/list-research-projects-query.dto";

import type {
  UpdateResearchMindMapNodeDto,
} from "./dto/update-research-mind-map-node.dto";

import type {
  UpdateResearchProjectDto,
} from "./dto/update-research-project.dto";

import type {
  UpdateResearchSourceDto,
} from "./dto/update-research-source.dto";

const projectSummaryInclude = {
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  chapter: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  topic: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  _count: {
    select: {
      sources: true,
      threads: true,
      mindMapNodes: true,
      mindMapEdges: true,
    },
  },
} as const;

const projectWorkspaceInclude = {
  ...projectSummaryInclude,

  sources: {
    orderBy: [
      {
        isPinned: "desc" as const,
      },
      {
        updatedAt: "desc" as const,
      },
    ],

    include: {
      sourceNote: {
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      },

      excerpts: {
        orderBy: {
          createdAt: "desc" as const,
        },
      },

      _count: {
        select: {
          citations: true,
          mindMapNodes: true,
        },
      },
    },
  },

  threads: {
    orderBy: {
      updatedAt: "desc" as const,
    },

    include: {
      messages: {
        orderBy: {
          createdAt: "asc" as const,
        },

        include: {
          citations: {
            orderBy: {
              createdAt: "asc" as const,
            },

            include: {
              researchSource: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  citationKey: true,
                  url: true,
                },
              },

              researchSourceExcerpt: {
                select: {
                  id: true,
                  quote: true,
                  locator: true,
                  pageNumber: true,
                },
              },
            },
          },
        },
      },
    },
  },

  mindMapNodes: {
    orderBy: [
      {
        sequenceNumber: "asc" as const,
      },
      {
        createdAt: "asc" as const,
      },
    ],

    include: {
      researchSource: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },

      note: {
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      },
    },
  },

  mindMapEdges: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

function clipResearchText(
  value:
    | string
    | null
    | undefined,
  maximum = 1800,
): string {
  const normalized =
    value?.trim() ?? "";

  if (
    normalized.length <= maximum
  ) {
    return normalized;
  }

  return `${normalized.slice(
    0,
    maximum,
  ).trimEnd()}…`;
}

function researchCitationIndexes(
  content: string,
  sourceCount: number,
): number[] {
  const indexes =
    new Set<number>();

  for (
    const match
    of content.matchAll(
      /\[S(\d+)\]/g,
    )
  ) {
    const number =
      Number(match[1]);

    if (
      Number.isInteger(number) &&
      number >= 1 &&
      number <= sourceCount
    ) {
      indexes.add(number - 1);
    }
  }

  return [...indexes];
}

@Injectable()
export class ResearchService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(AiService)
    private readonly aiService:
      AiService,

    @Inject(
      ResearchSourceIngestionService,
    )
    private readonly sourceIngestion:
      ResearchSourceIngestionService,
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
        "Complete student onboarding before using Research AI.",
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
        "An active academic enrollment is required before using Research AI.",
      );
    }

    return {
      profile,
      enrollment,
    };
  }

  private async getOwnedProjectRecord(
    studentProfileId: string,
    projectId: string,
  ) {
    const project =
      await this.database
        .researchProject
        .findFirst({
          where: {
            id: projectId,
            studentProfileId,
          },
        });

    if (!project) {
      throw new NotFoundException(
        "The requested research project was not found.",
      );
    }

    return project;
  }

  private async getOwnedSource(
    studentProfileId: string,
    projectId: string,
    sourceId: string,
  ) {
    await this.getOwnedProjectRecord(
      studentProfileId,
      projectId,
    );

    const source =
      await this.database
        .researchSource
        .findFirst({
          where: {
            id: sourceId,
            researchProjectId:
              projectId,
            studentProfileId,
          },
        });

    if (!source) {
      throw new NotFoundException(
        "The requested research source was not found.",
      );
    }

    return source;
  }

  private async getOwnedThread(
    studentProfileId: string,
    projectId: string,
    threadId: string,
  ) {
    await this.getOwnedProjectRecord(
      studentProfileId,
      projectId,
    );

    const thread =
      await this.database
        .researchThread
        .findFirst({
          where: {
            id: threadId,
            researchProjectId:
              projectId,
            studentProfileId,
          },
        });

    if (!thread) {
      throw new NotFoundException(
        "The requested research thread was not found.",
      );
    }

    return thread;
  }

  private async getOwnedNode(
    studentProfileId: string,
    projectId: string,
    nodeId: string,
  ) {
    await this.getOwnedProjectRecord(
      studentProfileId,
      projectId,
    );

    const node =
      await this.database
        .researchMindMapNode
        .findFirst({
          where: {
            id: nodeId,
            researchProjectId:
              projectId,

            researchProject: {
              studentProfileId,
            },
          },
        });

    if (!node) {
      throw new NotFoundException(
        "The requested research mind-map node was not found.",
      );
    }

    return node;
  }

  private async assertOwnedNote(
    studentProfileId: string,
    noteId:
      | string
      | null
      | undefined,
  ) {
    if (!noteId) {
      return;
    }

    const note =
      await this.database.note
        .findFirst({
          where: {
            id: noteId,
            studentProfileId,
          },

          select: {
            id: true,
          },
        });

    if (!note) {
      throw new BadRequestException(
        "The selected note is not available to this student.",
      );
    }
  }

  private async assertSourceLink(
    studentProfileId: string,
    projectId: string,
    sourceId:
      | string
      | null
      | undefined,
  ) {
    if (!sourceId) {
      return;
    }

    await this.getOwnedSource(
      studentProfileId,
      projectId,
      sourceId,
    );
  }

  private async assertAcademicLinks(
    syllabusVersionId: string,
    links: {
      subjectId:
        | string
        | null;
      chapterId:
        | string
        | null;
      topicId:
        | string
        | null;
    },
  ) {
    const {
      subjectId,
      chapterId,
      topicId,
    } = links;

    if (topicId) {
      const topic =
        await this.database.topic
          .findFirst({
            where: {
              id: topicId,

              chapter: {
                unit: {
                  syllabusSubject: {
                    syllabusVersionId,
                  },
                },
              },
            },

            select: {
              id: true,
              chapterId: true,

              chapter: {
                select: {
                  unit: {
                    select: {
                      syllabusSubject: {
                        select: {
                          subjectId:
                            true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

      if (!topic) {
        throw new BadRequestException(
          "The selected topic does not belong to the active syllabus.",
        );
      }

      const topicSubjectId =
        topic.chapter
          .unit
          .syllabusSubject
          .subjectId;

      if (
        chapterId &&
        chapterId !==
          topic.chapterId
      ) {
        throw new BadRequestException(
          "The selected topic does not belong to the selected chapter.",
        );
      }

      if (
        subjectId &&
        subjectId !==
          topicSubjectId
      ) {
        throw new BadRequestException(
          "The selected topic does not belong to the selected subject.",
        );
      }

      return;
    }

    if (chapterId) {
      const chapter =
        await this.database
          .chapter
          .findFirst({
            where: {
              id: chapterId,

              unit: {
                syllabusSubject: {
                  syllabusVersionId,
                },
              },
            },

            select: {
              id: true,

              unit: {
                select: {
                  syllabusSubject: {
                    select: {
                      subjectId:
                        true,
                    },
                  },
                },
              },
            },
          });

      if (!chapter) {
        throw new BadRequestException(
          "The selected chapter does not belong to the active syllabus.",
        );
      }

      if (
        subjectId &&
        subjectId !==
          chapter
            .unit
            .syllabusSubject
            .subjectId
      ) {
        throw new BadRequestException(
          "The selected chapter does not belong to the selected subject.",
        );
      }

      return;
    }

    if (subjectId) {
      const syllabusSubject =
        await this.database
          .syllabusSubject
          .findFirst({
            where: {
              syllabusVersionId,
              subjectId,
            },

            select: {
              id: true,
            },
          });

      if (!syllabusSubject) {
        throw new BadRequestException(
          "The selected subject does not belong to the active syllabus.",
        );
      }
    }
  }

  async getWorkspace(
    userId: string,
    query:
      ListResearchProjectsQueryDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const where: any = {
      studentProfileId:
        profile.id,
    };

    if (query.status) {
      where.status =
        query.status;
    }

    if (query.subjectId) {
      where.subjectId =
        query.subjectId;
    }

    if (query.chapterId) {
      where.chapterId =
        query.chapterId;
    }

    if (query.topicId) {
      where.topicId =
        query.topicId;
    }

    if (query.search?.trim()) {
      const search =
        query.search.trim();

      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          researchQuestion: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [
      projects,
      activeProjects,
      completedProjects,
      archivedProjects,
      totalSources,
      readySources,
      totalThreads,
      totalNodes,
      recentSources,
    ] = await Promise.all([
      this.database
        .researchProject
        .findMany({
          where,

          orderBy: [
            {
              isPinned: "desc",
            },
            {
              updatedAt: "desc",
            },
          ],

          include:
            projectSummaryInclude,
        }),

      this.database
        .researchProject
        .count({
          where: {
            studentProfileId:
              profile.id,
            status:
              ResearchProjectStatus
                .ACTIVE,
          },
        }),

      this.database
        .researchProject
        .count({
          where: {
            studentProfileId:
              profile.id,
            status:
              ResearchProjectStatus
                .COMPLETED,
          },
        }),

      this.database
        .researchProject
        .count({
          where: {
            studentProfileId:
              profile.id,
            status:
              ResearchProjectStatus
                .ARCHIVED,
          },
        }),

      this.database
        .researchSource
        .count({
          where: {
            studentProfileId:
              profile.id,
          },
        }),

      this.database
        .researchSource
        .count({
          where: {
            studentProfileId:
              profile.id,
            status:
              ResearchSourceStatus
                .READY,
          },
        }),

      this.database
        .researchThread
        .count({
          where: {
            studentProfileId:
              profile.id,
          },
        }),

      this.database
        .researchMindMapNode
        .count({
          where: {
            researchProject: {
              studentProfileId:
                profile.id,
            },
          },
        }),

      this.database
        .researchSource
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          take: 10,

          orderBy: [
            {
              isPinned: "desc",
            },
            {
              updatedAt: "desc",
            },
          ],

          include: {
            researchProject: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },

            sourceNote: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
    ]);

    return {
      summary: {
        activeProjects,
        completedProjects,
        archivedProjects,
        totalProjects:
          activeProjects +
          completedProjects +
          archivedProjects,
        totalSources,
        readySources,
        totalThreads,
        totalNodes,
      },

      projects,
      recentSources,
    };
  }

  async getProject(
    userId: string,
    projectId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedProjectRecord(
      profile.id,
      projectId,
    );

    await this.database
      .researchProject
      .update({
        where: {
          id: projectId,
        },

        data: {
          lastOpenedAt:
            new Date(),
        },
      });

    return this.database
      .researchProject
      .findUnique({
        where: {
          id: projectId,
        },

        include:
          projectWorkspaceInclude,
      });
  }

  async createProject(
    userId: string,
    dto: CreateResearchProjectDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.assertAcademicLinks(
      enrollment.syllabusVersionId,
      {
        subjectId:
          dto.subjectId ?? null,
        chapterId:
          dto.chapterId ?? null,
        topicId:
          dto.topicId ?? null,
      },
    );

    const now =
      new Date();

    const status =
      dto.status ??
      ResearchProjectStatus.ACTIVE;

    const project =
      await this.database
        .researchProject
        .create({
          data: {
            studentProfileId:
              profile.id,
            title:
              dto.title.trim(),
            description:
              dto.description ?? null,
            researchQuestion:
              dto.researchQuestion ??
              null,
            status,
            subjectId:
              dto.subjectId ?? null,
            chapterId:
              dto.chapterId ?? null,
            topicId:
              dto.topicId ?? null,
            color:
              dto.color ?? null,
            icon:
              dto.icon ?? null,
            isPinned:
              dto.isPinned ?? false,

            completedAt:
              status ===
              ResearchProjectStatus
                .COMPLETED
                ? now
                : null,

            archivedAt:
              status ===
              ResearchProjectStatus
                .ARCHIVED
                ? now
                : null,
          },
        });

    return this.getProject(
      userId,
      project.id,
    );
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateResearchProjectDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const project =
      await this.getOwnedProjectRecord(
        profile.id,
        projectId,
      );

    const subjectId =
      dto.subjectId !== undefined
        ? dto.subjectId
        : project.subjectId;

    const chapterId =
      dto.chapterId !== undefined
        ? dto.chapterId
        : project.chapterId;

    const topicId =
      dto.topicId !== undefined
        ? dto.topicId
        : project.topicId;

    await this.assertAcademicLinks(
      enrollment.syllabusVersionId,
      {
        subjectId,
        chapterId,
        topicId,
      },
    );

    const data: any = {
      ...dto,
      subjectId,
      chapterId,
      topicId,
    };

    if (dto.title !== undefined) {
      data.title =
        dto.title.trim();
    }

    if (dto.status !== undefined) {
      data.completedAt =
        dto.status ===
        ResearchProjectStatus
          .COMPLETED
          ? project.completedAt ??
            new Date()
          : null;

      data.archivedAt =
        dto.status ===
        ResearchProjectStatus
          .ARCHIVED
          ? project.archivedAt ??
            new Date()
          : null;
    }

    await this.database
      .researchProject
      .update({
        where: {
          id: project.id,
        },
        data,
      });

    return this.getProject(
      userId,
      project.id,
    );
  }

  async deleteProject(
    userId: string,
    projectId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const project =
      await this.getOwnedProjectRecord(
        profile.id,
        projectId,
      );

    await this.database
      .researchProject
      .delete({
        where: {
          id: project.id,
        },
      });

    return {
      success: true,
      projectId:
        project.id,
    };
  }

  async createSource(
    userId: string,
    projectId: string,
    dto: CreateResearchSourceDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedProjectRecord(
      profile.id,
      projectId,
    );

    await this.assertOwnedNote(
      profile.id,
      dto.sourceNoteId,
    );

    const source =
      await this.database
        .researchSource
        .create({
          data: {
            studentProfileId:
              profile.id,
            researchProjectId:
              projectId,
            sourceNoteId:
              dto.sourceNoteId ?? null,
            type:
              dto.type,
            status:
              dto.status ??
              ResearchSourceStatus.SAVED,
            title:
              dto.title.trim(),
            url:
              dto.url ?? null,
            author:
              dto.author ?? null,
            publisher:
              dto.publisher ?? null,

            publishedAt:
              dto.publishedAt
                ? new Date(
                    dto.publishedAt,
                  )
                : null,

            accessedAt:
              dto.accessedAt
                ? new Date(
                    dto.accessedAt,
                  )
                : new Date(),

            rawContent:
              dto.rawContent ?? null,
            summary:
              dto.summary ?? null,
            citationText:
              dto.citationText ??
              null,
            citationKey:
              dto.citationKey ??
              null,
            reliabilityScore:
              dto.reliabilityScore ??
              null,
            isPinned:
              dto.isPinned ?? false,
            metadata:
              dto.metadata as any,
          },
        });

    return this.getOwnedSource(
      profile.id,
      projectId,
      source.id,
    );
  }

  async updateSource(
    userId: string,
    projectId: string,
    sourceId: string,
    dto: UpdateResearchSourceDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const source =
      await this.getOwnedSource(
        profile.id,
        projectId,
        sourceId,
      );

    if (
      dto.sourceNoteId !==
      undefined
    ) {
      await this.assertOwnedNote(
        profile.id,
        dto.sourceNoteId,
      );
    }

    const {
      publishedAt,
      accessedAt,
      metadata,
      ...rest
    } = dto;

    const data: any = {
      ...rest,
    };

    if (publishedAt !== undefined) {
      data.publishedAt =
        publishedAt
          ? new Date(
              publishedAt,
            )
          : null;
    }

    if (accessedAt !== undefined) {
      data.accessedAt =
        accessedAt
          ? new Date(
              accessedAt,
            )
          : null;
    }

    if (metadata !== undefined) {
      data.metadata =
        metadata as any;
    }

    if (dto.title !== undefined) {
      data.title =
        dto.title.trim();
    }

    return this.database
      .researchSource
      .update({
        where: {
          id: source.id,
        },
        data,
      });
  }

  async ingestSource(
    userId: string,
    projectId: string,
    sourceId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const source =
      await this.getOwnedSource(
        profile.id,
        projectId,
        sourceId,
      );

    if (
      source.type !==
      ResearchSourceType.WEB_PAGE
    ) {
      throw new BadRequestException(
        "Only webpage sources can be fetched automatically.",
      );
    }

    if (
      !source.url?.trim()
    ) {
      throw new BadRequestException(
        "A webpage URL is required before ingestion.",
      );
    }

    await this.database
      .researchSource
      .update({
        where: {
          id:
            source.id,
        },

        data: {
          status:
            ResearchSourceStatus
              .PROCESSING,

          processingError:
            null,
        },
      });

    try {
      const ingested =
        await this.sourceIngestion
          .ingestWebpage(
            source.url,
          );

      const existingMetadata =
        source.metadata &&
        typeof source.metadata ===
          "object" &&
        !Array.isArray(
          source.metadata,
        )
          ? source.metadata
          : {};

      const accessedAt =
        new Date();

      const citationText = [
        source.title,
        ingested.publisher,
        `Accessed ${accessedAt.toISOString().slice(0, 10)}`,
        ingested.finalUrl,
      ]
        .filter(Boolean)
        .join(". ");

      await this.database
        .$transaction(
          async (
            transaction,
          ) => {
            await transaction
              .researchSourceExcerpt
              .deleteMany({
                where: {
                  researchSourceId:
                    source.id,
                },
              });

            if (
              ingested.excerpts
                .length
            ) {
              await transaction
                .researchSourceExcerpt
                .createMany({
                  data:
                    ingested.excerpts
                      .map(
                        (
                          excerpt,
                        ) => ({
                          researchSourceId:
                            source.id,

                          quote:
                            excerpt.quote,

                          locator:
                            excerpt.locator,

                          startOffset:
                            excerpt.startOffset,

                          endOffset:
                            excerpt.endOffset,
                        }),
                      ),
                });
            }

            await transaction
              .researchSource
              .update({
                where: {
                  id:
                    source.id,
                },

                data: {
                  status:
                    ResearchSourceStatus
                      .READY,

                  url:
                    ingested.finalUrl,

                  author:
                    source.author ??
                    ingested.author,

                  publisher:
                    source.publisher ??
                    ingested.publisher,

                  accessedAt,

                  rawContent:
                    ingested.rawContent,

                  summary:
                    ingested.summary,

                  citationText,

                  processingError:
                    null,

                  metadata: {
                    ...existingMetadata,

                    ingestion: {
                      version:
                        1,

                      fetchedAt:
                        accessedAt
                          .toISOString(),

                      finalUrl:
                        ingested.finalUrl,

                      contentType:
                        ingested.contentType,

                      pageTitle:
                        ingested.pageTitle,

                      description:
                        ingested.description,

                      language:
                        ingested.language,

                      wordCount:
                        ingested.wordCount,

                      characterCount:
                        ingested.rawContent
                          .length,
                    },
                  } as any,
                },
              });
          },
        );
    } catch (error) {
      const processingError =
        error instanceof Error
          ? error.message
          : "The webpage could not be ingested.";

      await this.database
        .researchSource
        .update({
          where: {
            id:
              source.id,
          },

          data: {
            status:
              ResearchSourceStatus
                .FAILED,

            processingError:
              processingError
                .slice(
                  0,
                  2000,
                ),
          },
        });
    }

    return this.database
      .researchSource
      .findUnique({
        where: {
          id:
            source.id,
        },

        include: {
          excerpts: {
            orderBy: {
              createdAt:
                "asc",
            },
          },

          _count: {
            select: {
              citations:
                true,
              mindMapNodes:
                true,
            },
          },
        },
      });
  }

  async deleteSource(
    userId: string,
    projectId: string,
    sourceId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const source =
      await this.getOwnedSource(
        profile.id,
        projectId,
        sourceId,
      );

    await this.database
      .researchSource
      .delete({
        where: {
          id: source.id,
        },
      });

    return {
      success: true,
      sourceId:
        source.id,
    };
  }

  async createExcerpt(
    userId: string,
    projectId: string,
    sourceId: string,
    dto:
      CreateResearchSourceExcerptDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const source =
      await this.getOwnedSource(
        profile.id,
        projectId,
        sourceId,
      );

    if (
      dto.startOffset !== null &&
      dto.startOffset !== undefined &&
      dto.endOffset !== null &&
      dto.endOffset !== undefined &&
      dto.startOffset >
        dto.endOffset
    ) {
      throw new BadRequestException(
        "Excerpt startOffset cannot be greater than endOffset.",
      );
    }

    return this.database
      .researchSourceExcerpt
      .create({
        data: {
          researchSourceId:
            source.id,
          quote:
            dto.quote,
          note:
            dto.note ?? null,
          locator:
            dto.locator ?? null,
          pageNumber:
            dto.pageNumber ?? null,
          startOffset:
            dto.startOffset ?? null,
          endOffset:
            dto.endOffset ?? null,
        },
      });
  }

  async deleteExcerpt(
    userId: string,
    projectId: string,
    sourceId: string,
    excerptId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const source =
      await this.getOwnedSource(
        profile.id,
        projectId,
        sourceId,
      );

    const excerpt =
      await this.database
        .researchSourceExcerpt
        .findFirst({
          where: {
            id: excerptId,
            researchSourceId:
              source.id,
          },
        });

    if (!excerpt) {
      throw new NotFoundException(
        "The requested research excerpt was not found.",
      );
    }

    await this.database
      .researchSourceExcerpt
      .delete({
        where: {
          id: excerpt.id,
        },
      });

    return {
      success: true,
      excerptId:
        excerpt.id,
    };
  }

  async createThread(
    userId: string,
    projectId: string,
    dto: CreateResearchThreadDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedProjectRecord(
      profile.id,
      projectId,
    );

    return this.database
      .researchThread
      .create({
        data: {
          studentProfileId:
            profile.id,
          researchProjectId:
            projectId,
          title:
            dto.title.trim(),
        },
      });
  }

  async createMessage(
    userId: string,
    projectId: string,
    threadId: string,
    dto: CreateResearchMessageDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const thread =
      await this.getOwnedThread(
        profile.id,
        projectId,
        threadId,
      );

    const message =
      await this.database
        .researchMessage
        .create({
          data: {
            researchThreadId:
              thread.id,
            role:
              ResearchMessageRole.USER,
            content:
              dto.content.trim(),
            model:
              null,
          },
        });

    await this.database
      .researchThread
      .update({
        where: {
          id: thread.id,
        },

        data: {
          updatedAt:
            new Date(),
        },
      });

    return message;
  }

  async generateAssistantReply(
    userId: string,
    projectId: string,
    threadId: string,
    dto:
      GenerateResearchAssistantReplyDto,
  ) {
    const content =
      dto.content.trim();

    if (!content) {
      throw new BadRequestException(
        "A research question is required.",
      );
    }

    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const thread =
      await this.getOwnedThread(
        profile.id,
        projectId,
        threadId,
      );

    const [
      project,
      history,
    ] = await Promise.all([
      this.database
        .researchProject
        .findUnique({
          where: {
            id:
              projectId,
          },

          select: {
            title:
              true,
            description:
              true,
            researchQuestion:
              true,

            subject: {
              select: {
                name:
                  true,
              },
            },

            chapter: {
              select: {
                name:
                  true,
              },
            },

            topic: {
              select: {
                name:
                  true,
              },
            },

            sources: {
              where: {
                status: {
                  not:
                    ResearchSourceStatus
                      .ARCHIVED,
                },
              },

              take:
                12,

              orderBy: [
                {
                  isPinned:
                    "desc",
                },
                {
                  updatedAt:
                    "desc",
                },
              ],

              select: {
                id:
                  true,
                title:
                  true,
                type:
                  true,
                status:
                  true,
                url:
                  true,
                author:
                  true,
                publisher:
                  true,
                summary:
                  true,
                rawContent:
                  true,
                citationKey:
                  true,

                excerpts: {
                  take:
                    5,

                  orderBy: {
                    createdAt:
                      "desc",
                  },

                  select: {
                    quote:
                      true,
                    locator:
                      true,
                    pageNumber:
                      true,
                  },
                },
              },
            },

            mindMapNodes: {
              take:
                20,

              orderBy: [
                {
                  sequenceNumber:
                    "asc",
                },
                {
                  createdAt:
                    "asc",
                },
              ],

              select: {
                type:
                  true,
                title:
                  true,
                content:
                  true,
              },
            },
          },
        }),

      this.database
        .researchMessage
        .findMany({
          where: {
            researchThreadId:
              thread.id,

            role: {
              in: [
                ResearchMessageRole.USER,
                ResearchMessageRole.ASSISTANT,
              ],
            },
          },

          take:
            20,

          orderBy: {
            createdAt:
              "desc",
          },

          select: {
            role:
              true,
            content:
              true,
          },
        }),
    ]);

    if (!project) {
      throw new NotFoundException(
        "The requested research project was not found.",
      );
    }

    const sourceBlocks =
      project.sources.map(
        (
          source,
          index,
        ) => {
          const excerpts =
            source.excerpts
              .map(
                (
                  excerpt,
                  excerptIndex,
                ) => {
                  const locator = [
                    excerpt.locator,
                    excerpt.pageNumber
                      ? `page ${excerpt.pageNumber}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return [
                    `  Excerpt ${excerptIndex + 1}${locator ? ` (${locator})` : ""}:`,
                    `  ${clipResearchText(
                      excerpt.quote,
                      700,
                    )}`,
                  ].join("\n");
                },
              )
              .join("\n");

          const evidence =
            clipResearchText(
              source.summary ||
              source.rawContent,
              1800,
            );

          return [
            `[S${index + 1}] ${source.title}`,
            `Type: ${String(source.type).replaceAll("_", " ")}`,
            `Status: ${source.status}`,
            source.author
              ? `Author: ${source.author}`
              : "",
            source.publisher
              ? `Publisher: ${source.publisher}`
              : "",
            source.url
              ? `URL: ${source.url}`
              : "",
            source.citationKey
              ? `Citation key: ${source.citationKey}`
              : "",
            evidence
              ? `Saved evidence: ${evidence}`
              : "Saved evidence: No summary or extracted content is available.",
            excerpts,
          ]
            .filter(Boolean)
            .join("\n");
        },
      );

    const nodeContext =
      project.mindMapNodes
        .map(
          (node) =>
            `- ${node.type}: ${node.title}${node.content ? ` — ${clipResearchText(node.content, 500)}` : ""}`,
        )
        .join("\n");

    const instructions = [
      "You are AIMERS Research AI, an evidence-first academic research assistant for a student.",
      "",
      "Answer the student's exact question clearly and directly.",
      "Use the saved project context and evidence sources when relevant.",
      "Never invent a source, quote, experiment, author, statistic or citation.",
      "Cite only the saved sources listed below, using their exact inline labels such as [S1].",
      "Do not add a [S#] label unless that saved source genuinely supports the nearby claim.",
      "Clearly state when the saved evidence is insufficient, conflicting or absent.",
      "Separate evidence-backed statements from general reasoning or background explanation.",
      "Do not claim that you searched the web or opened an external file.",
      "Prefer concise structure, precise terminology and an explicit conclusion.",
      "",
      `Project title: ${project.title}`,
      `Research question: ${project.researchQuestion || "Not defined"}`,
      `Project description: ${clipResearchText(project.description, 1400) || "Not defined"}`,
      `Academic subject: ${project.subject?.name || "Independent research"}`,
      `Chapter: ${project.chapter?.name || "Not linked"}`,
      `Topic: ${project.topic?.name || "Not linked"}`,
      "",
      "Knowledge-map context:",
      nodeContext ||
        "No knowledge-map nodes have been added.",
      "",
      "Saved evidence sources:",
      sourceBlocks.join("\n\n") ||
        "No saved evidence sources are available. Do not fabricate citations.",
    ].join("\n");

    const conversationMessages:
      Array<{
        role:
          | "user"
          | "assistant";
        content:
          string;
      }> = [];

    for (
      const item
      of [...history].reverse()
    ) {
      conversationMessages.push({
        role:
          item.role ===
          ResearchMessageRole.ASSISTANT
            ? "assistant"
            : "user",

        content:
          clipResearchText(
            item.content,
            5000,
          ),
      });
    }

    conversationMessages.push({
      role:
        "user",
      content,
    });

    const result =
      await this.aiService
        .generateText({
          instructions,
          messages:
            conversationMessages,

          safetyIdentifier:
            createHash("sha256")
              .update(profile.id)
              .digest("hex")
              .slice(0, 40),
        });

    const citedIndexes =
      researchCitationIndexes(
        result.text,
        project.sources.length,
      );

    const records =
      await this.database
        .$transaction(
          async (
            transaction,
          ) => {
            const userMessage =
              await transaction
                .researchMessage
                .create({
                  data: {
                    researchThreadId:
                      thread.id,
                    role:
                      ResearchMessageRole.USER,
                    content,
                    model:
                      null,
                  },
                });

            const assistantMessage =
              await transaction
                .researchMessage
                .create({
                  data: {
                    researchThreadId:
                      thread.id,
                    role:
                      ResearchMessageRole.ASSISTANT,
                    content:
                      result.text,
                    model:
                      result.model,
                    promptTokens:
                      result.inputTokens,
                    completionTokens:
                      result.outputTokens,
                  },
                });

            if (citedIndexes.length > 0) {
              await transaction
                .researchCitation
                .createMany({
                  data:
                    citedIndexes.map(
                      (
                        sourceIndex,
                      ) => ({
                        researchMessageId:
                          assistantMessage.id,
                        researchSourceId:
                          project.sources[
                            sourceIndex
                          ].id,
                        label:
                          `[S${sourceIndex + 1}]`,
                      }),
                    ),
                });
            }

            await transaction
              .researchThread
              .update({
                where: {
                  id:
                    thread.id,
                },

                data: {
                  updatedAt:
                    new Date(),
                },
              });

            return {
              userMessageId:
                userMessage.id,
              assistantMessageId:
                assistantMessage.id,
            };
          },
        );

    const messageInclude = {
      citations: {
        orderBy: {
          createdAt:
            "asc" as const,
        },

        include: {
          researchSource: {
            select: {
              id:
                true,
              title:
                true,
              type:
                true,
              citationKey:
                true,
              url:
                true,
            },
          },

          researchSourceExcerpt: {
            select: {
              id:
                true,
              quote:
                true,
              locator:
                true,
              pageNumber:
                true,
            },
          },
        },
      },
    };

    const [
      userMessage,
      assistantMessage,
    ] = await Promise.all([
      this.database
        .researchMessage
        .findUnique({
          where: {
            id:
              records.userMessageId,
          },

          include:
            messageInclude,
        }),

      this.database
        .researchMessage
        .findUnique({
          where: {
            id:
              records.assistantMessageId,
          },

          include:
            messageInclude,
        }),
    ]);

    if (
      !userMessage ||
      !assistantMessage
    ) {
      throw new InternalServerErrorException(
        "Research AI generated a response but could not reload the stored conversation.",
      );
    }

    return {
      userMessage,
      assistantMessage,

      provider: {
        name:
          result.provider,
        model:
          result.model,
      },
    };
  }

  async createCitation(
    userId: string,
    projectId: string,
    threadId: string,
    messageId: string,
    dto: CreateResearchCitationDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const thread =
      await this.getOwnedThread(
        profile.id,
        projectId,
        threadId,
      );

    const message =
      await this.database
        .researchMessage
        .findFirst({
          where: {
            id: messageId,
            researchThreadId:
              thread.id,
          },
        });

    if (!message) {
      throw new NotFoundException(
        "The requested research message was not found.",
      );
    }

    const source =
      await this.getOwnedSource(
        profile.id,
        projectId,
        dto.researchSourceId,
      );

    if (
      dto.researchSourceExcerptId
    ) {
      const excerpt =
        await this.database
          .researchSourceExcerpt
          .findFirst({
            where: {
              id:
                dto.researchSourceExcerptId,
              researchSourceId:
                source.id,
            },

            select: {
              id: true,
            },
          });

      if (!excerpt) {
        throw new BadRequestException(
          "The selected excerpt does not belong to the selected research source.",
        );
      }
    }

    return this.database
      .researchCitation
      .create({
        data: {
          researchMessageId:
            message.id,
          researchSourceId:
            source.id,
          researchSourceExcerptId:
            dto
              .researchSourceExcerptId ??
            null,
          label:
            dto.label ?? null,
          quote:
            dto.quote ?? null,
        },
      });
  }

  async createMindMapNode(
    userId: string,
    projectId: string,
    dto:
      CreateResearchMindMapNodeDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedProjectRecord(
      profile.id,
      projectId,
    );

    await Promise.all([
      this.assertSourceLink(
        profile.id,
        projectId,
        dto.researchSourceId,
      ),

      this.assertOwnedNote(
        profile.id,
        dto.noteId,
      ),
    ]);

    return this.database
      .researchMindMapNode
      .create({
        data: {
          researchProjectId:
            projectId,
          researchSourceId:
            dto.researchSourceId ??
            null,
          noteId:
            dto.noteId ?? null,
          type:
            dto.type,
          title:
            dto.title.trim(),
          content:
            dto.content ?? null,
          positionX:
            dto.positionX ?? 0,
          positionY:
            dto.positionY ?? 0,
          color:
            dto.color ?? null,
          sequenceNumber:
            dto.sequenceNumber ?? 0,
        },
      });
  }

  async updateMindMapNode(
    userId: string,
    projectId: string,
    nodeId: string,
    dto:
      UpdateResearchMindMapNodeDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const node =
      await this.getOwnedNode(
        profile.id,
        projectId,
        nodeId,
      );

    if (
      dto.researchSourceId !==
      undefined
    ) {
      await this.assertSourceLink(
        profile.id,
        projectId,
        dto.researchSourceId,
      );
    }

    if (
      dto.noteId !==
      undefined
    ) {
      await this.assertOwnedNote(
        profile.id,
        dto.noteId,
      );
    }

    const data: any = {
      ...dto,
    };

    if (dto.title !== undefined) {
      data.title =
        dto.title.trim();
    }

    return this.database
      .researchMindMapNode
      .update({
        where: {
          id: node.id,
        },
        data,
      });
  }

  async deleteMindMapNode(
    userId: string,
    projectId: string,
    nodeId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const node =
      await this.getOwnedNode(
        profile.id,
        projectId,
        nodeId,
      );

    await this.database
      .researchMindMapNode
      .delete({
        where: {
          id: node.id,
        },
      });

    return {
      success: true,
      nodeId:
        node.id,
    };
  }

  async createMindMapEdge(
    userId: string,
    projectId: string,
    dto:
      CreateResearchMindMapEdgeDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    if (
      dto.sourceNodeId ===
      dto.targetNodeId
    ) {
      throw new BadRequestException(
        "A research mind-map node cannot link to itself.",
      );
    }

    const [
      sourceNode,
      targetNode,
    ] = await Promise.all([
      this.getOwnedNode(
        profile.id,
        projectId,
        dto.sourceNodeId,
      ),

      this.getOwnedNode(
        profile.id,
        projectId,
        dto.targetNodeId,
      ),
    ]);

    return this.database
      .researchMindMapEdge
      .create({
        data: {
          researchProjectId:
            projectId,
          sourceNodeId:
            sourceNode.id,
          targetNodeId:
            targetNode.id,
          label:
            dto.label ?? null,
        },
      });
  }

  async deleteMindMapEdge(
    userId: string,
    projectId: string,
    edgeId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedProjectRecord(
      profile.id,
      projectId,
    );

    const result =
      await this.database
        .researchMindMapEdge
        .deleteMany({
          where: {
            id: edgeId,
            researchProjectId:
              projectId,

            researchProject: {
              studentProfileId:
                profile.id,
            },
          },
        });

    if (result.count === 0) {
      throw new NotFoundException(
        "The requested research mind-map edge was not found.",
      );
    }

    return {
      success: true,
      edgeId,
    };
  }
}
