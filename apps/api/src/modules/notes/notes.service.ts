import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AcademicEnrollmentStatus,
  NoteContentFormat,
  NoteSourceType,
  NoteStatus,
  StudentStatus,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import type {
  CreateNoteFolderDto,
} from "./dto/create-note-folder.dto";

import type {
  CreateNoteLinkDto,
} from "./dto/create-note-link.dto";

import type {
  CreateNoteTagDto,
} from "./dto/create-note-tag.dto";

import type {
  CreateNoteDto,
} from "./dto/create-note.dto";

import type {
  ListNotesQueryDto,
} from "./dto/list-notes-query.dto";

import type {
  UpdateNoteFolderDto,
} from "./dto/update-note-folder.dto";

import type {
  UpdateNoteStatusDto,
} from "./dto/update-note-status.dto";

import type {
  UpdateNoteDto,
} from "./dto/update-note.dto";

const noteInclude = {
  folder: {
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
    },
  },

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

  tagAssignments: {
    orderBy: {
      createdAt: "asc" as const,
    },

    include: {
      tag: true,
    },
  },

  outgoingLinks: {
    orderBy: {
      createdAt: "asc" as const,
    },

    include: {
      targetNote: {
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  },

  incomingLinks: {
    orderBy: {
      createdAt: "asc" as const,
    },

    include: {
      sourceNote: {
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  },
};

@Injectable()
export class NotesService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,
  ) {}

  private countWords(
    content: string,
  ) {
    const normalized =
      content.trim();

    if (!normalized) {
      return 0;
    }

    return normalized
      .split(/\s+/u)
      .filter(Boolean)
      .length;
  }

  private createExcerpt(
    content: string,
  ) {
    const normalized =
      content
        .replace(/\s+/gu, " ")
        .trim();

    return normalized
      ? normalized.slice(0, 260)
      : null;
  }

  private serializeNote(
    note: any,
  ) {
    const {
      tagAssignments,
      ...rest
    } = note;

    return {
      ...rest,

      tags:
        tagAssignments?.map(
          (
            assignment: any,
          ) => assignment.tag,
        ) ?? [],
    };
  }

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
        "Complete student onboarding before using Notes.",
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
        "An active academic enrollment is required before using Notes.",
      );
    }

    return {
      profile,
      enrollment,
    };
  }

  private async getOwnedNote(
    studentProfileId: string,
    noteId: string,
  ) {
    const note =
      await this.database.note
        .findFirst({
          where: {
            id: noteId,
            studentProfileId,
          },

          include:
            noteInclude,
        });

    if (!note) {
      throw new NotFoundException(
        "The requested note was not found.",
      );
    }

    return note;
  }

  private async getOwnedFolder(
    studentProfileId: string,
    folderId: string,
  ) {
    const folder =
      await this.database
        .noteFolder
        .findFirst({
          where: {
            id: folderId,
            studentProfileId,
          },
        });

    if (!folder) {
      throw new NotFoundException(
        "The requested note folder was not found.",
      );
    }

    return folder;
  }

  private async assertFolder(
    studentProfileId: string,
    folderId:
      | string
      | null
      | undefined,
  ) {
    if (!folderId) {
      return;
    }

    await this.getOwnedFolder(
      studentProfileId,
      folderId,
    );
  }

  private async assertFolderParent(
    studentProfileId: string,
    parentFolderId:
      | string
      | null
      | undefined,
    currentFolderId?: string,
  ) {
    if (!parentFolderId) {
      return;
    }

    if (
      currentFolderId &&
      parentFolderId ===
        currentFolderId
    ) {
      throw new BadRequestException(
        "A folder cannot be its own parent.",
      );
    }

    let current =
      await this.getOwnedFolder(
        studentProfileId,
        parentFolderId,
      );

    for (
      let depth = 0;
      depth < 40;
      depth += 1
    ) {
      if (!current.parentFolderId) {
        return;
      }

      if (
        currentFolderId &&
        current.parentFolderId ===
          currentFolderId
      ) {
        throw new BadRequestException(
          "The selected parent would create a folder cycle.",
        );
      }

      current =
        await this.getOwnedFolder(
          studentProfileId,
          current.parentFolderId,
        );
    }

    throw new BadRequestException(
      "The folder hierarchy is too deeply nested.",
    );
  }

  private async assertTags(
    studentProfileId: string,
    tagIds:
      | string[]
      | undefined,
  ) {
    if (!tagIds) {
      return [];
    }

    const uniqueTagIds =
      [
        ...new Set(
          tagIds,
        ),
      ];

    if (
      uniqueTagIds.length ===
      0
    ) {
      return [];
    }

    const ownedTags =
      await this.database
        .noteTag
        .findMany({
          where: {
            studentProfileId,

            id: {
              in: uniqueTagIds,
            },
          },

          select: {
            id: true,
          },
        });

    if (
      ownedTags.length !==
      uniqueTagIds.length
    ) {
      throw new BadRequestException(
        "One or more selected note tags are unavailable.",
      );
    }

    return uniqueTagIds;
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
      const subject =
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

      if (!subject) {
        throw new BadRequestException(
          "The selected subject does not belong to the active syllabus.",
        );
      }
    }
  }

  private async createCurrentRevision(
    note: {
      id: string;
      title: string;
      content: string;
      contentFormat:
        NoteContentFormat;
      wordCount: number;
      characterCount: number;
    },
  ) {
    return this.database
      .noteRevision
      .create({
        data: {
          noteId: note.id,
          title: note.title,
          content: note.content,

          contentFormat:
            note.contentFormat,

          wordCount:
            note.wordCount,

          characterCount:
            note.characterCount,
        },
      });
  }

  async getWorkspace(
    userId: string,
    query: ListNotesQueryDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const status =
      query.status ??
      NoteStatus.ACTIVE;

    const search =
      query.search
        ?.trim() ?? "";

    const [
      folders,
      tags,
      notes,
      activeNotes,
      archivedNotes,
      trashedNotes,
      pinnedNotes,
      totalWords,
      academic,
    ] =
      await Promise.all([
        this.database
          .noteFolder
          .findMany({
            where: {
              studentProfileId:
                profile.id,
            },

            orderBy: [
              {
                sequenceNumber:
                  "asc",
              },
              {
                name: "asc",
              },
            ],

            include: {
              _count: {
                select: {
                  notes: true,
                  childFolders:
                    true,
                },
              },
            },
          }),

        this.database
          .noteTag
          .findMany({
            where: {
              studentProfileId:
                profile.id,
            },

            orderBy: {
              name: "asc",
            },
          }),

        this.database.note
          .findMany({
            where: {
              studentProfileId:
                profile.id,

              status,

              ...(query.folderId
                ? {
                    folderId:
                      query.folderId,
                  }
                : {}),

              ...(query.subjectId
                ? {
                    subjectId:
                      query.subjectId,
                  }
                : {}),

              ...(query.chapterId
                ? {
                    chapterId:
                      query.chapterId,
                  }
                : {}),

              ...(query.topicId
                ? {
                    topicId:
                      query.topicId,
                  }
                : {}),

              ...(search
                ? {
                    OR: [
                      {
                        title: {
                          contains:
                            search,
                          mode:
                            "insensitive" as const,
                        },
                      },
                      {
                        content: {
                          contains:
                            search,
                          mode:
                            "insensitive" as const,
                        },
                      },
                    ],
                  }
                : {}),
            },

            orderBy: [
              {
                isPinned: "desc",
              },
              {
                updatedAt: "desc",
              },
            ],

            take: 250,
            include:
              noteInclude,
          }),

        this.database.note
          .count({
            where: {
              studentProfileId:
                profile.id,

              status:
                NoteStatus.ACTIVE,
            },
          }),

        this.database.note
          .count({
            where: {
              studentProfileId:
                profile.id,

              status:
                NoteStatus.ARCHIVED,
            },
          }),

        this.database.note
          .count({
            where: {
              studentProfileId:
                profile.id,

              status:
                NoteStatus.TRASHED,
            },
          }),

        this.database.note
          .count({
            where: {
              studentProfileId:
                profile.id,

              status:
                NoteStatus.ACTIVE,

              isPinned: true,
            },
          }),

        this.database.note
          .aggregate({
            where: {
              studentProfileId:
                profile.id,

              status:
                NoteStatus.ACTIVE,
            },

            _sum: {
              wordCount: true,
            },
          }),

        this.database
          .studentEnrollment
          .findUnique({
            where: {
              id: enrollment.id,
            },

            select: {
              syllabusVersion: {
                select: {
                  id: true,
                  versionCode:
                    true,
                  name: true,

                  programme: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },

                  subjects: {
                    orderBy: {
                      sequenceNumber:
                        "asc",
                    },

                    select: {
                      subject: {
                        select: {
                          id: true,
                          code: true,
                          name: true,
                        },
                      },

                      units: {
                        orderBy: {
                          sequenceNumber:
                            "asc",
                        },

                        select: {
                          id: true,
                          code: true,
                          name: true,

                          chapters: {
                            orderBy: {
                              sequenceNumber:
                                "asc",
                            },

                            select: {
                              id: true,
                              code: true,
                              name: true,

                              topics: {
                                orderBy: {
                                  sequenceNumber:
                                    "asc",
                                },

                                select: {
                                  id: true,
                                  code: true,
                                  name: true,
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
      ]);

    return {
      studentProfileId:
        profile.id,

      syllabusVersion:
        academic
          ?.syllabusVersion ??
        null,

      filters: {
        status,
        folderId:
          query.folderId ??
          null,
        subjectId:
          query.subjectId ??
          null,
        chapterId:
          query.chapterId ??
          null,
        topicId:
          query.topicId ??
          null,
        search,
      },

      summary: {
        activeNotes,
        archivedNotes,
        trashedNotes,
        pinnedNotes,

        totalWords:
          totalWords._sum
            .wordCount ?? 0,

        folderCount:
          folders.length,

        tagCount:
          tags.length,
      },

      folders,
      tags,

      notes:
        notes.map(
          (
            note,
          ) =>
            this.serializeNote(
              note,
            ),
        ),
    };
  }

  async createFolder(
    userId: string,
    dto: CreateNoteFolderDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const name =
      dto.name.trim();

    if (!name) {
      throw new BadRequestException(
        "Folder name is required.",
      );
    }

    await this.assertFolderParent(
      profile.id,
      dto.parentFolderId,
    );

    return this.database
      .noteFolder
      .create({
        data: {
          studentProfileId:
            profile.id,

          name,

          description:
            dto.description
              ?.trim() ||
            null,

          color:
            dto.color
              ?.trim() ||
            null,

          icon:
            dto.icon
              ?.trim() ||
            null,

          parentFolderId:
            dto.parentFolderId ??
            null,

          sequenceNumber:
            dto.sequenceNumber ??
            0,
        },

        include: {
          _count: {
            select: {
              notes: true,
              childFolders:
                true,
            },
          },
        },
      });
  }

  async updateFolder(
    userId: string,
    folderId: string,
    dto: UpdateNoteFolderDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedFolder(
      profile.id,
      folderId,
    );

    if (
      dto.parentFolderId !==
      undefined
    ) {
      await this.assertFolderParent(
        profile.id,
        dto.parentFolderId,
        folderId,
      );
    }

    const name =
      dto.name === undefined
        ? undefined
        : dto.name.trim();

    if (
      name !== undefined &&
      !name
    ) {
      throw new BadRequestException(
        "Folder name cannot be empty.",
      );
    }

    return this.database
      .noteFolder
      .update({
        where: {
          id: folderId,
        },

        data: {
          ...(name !== undefined
            ? {
                name,
              }
            : {}),

          ...(dto.description !==
          undefined
            ? {
                description:
                  dto.description
                    ?.trim() ||
                  null,
              }
            : {}),

          ...(dto.color !==
          undefined
            ? {
                color:
                  dto.color
                    ?.trim() ||
                  null,
              }
            : {}),

          ...(dto.icon !==
          undefined
            ? {
                icon:
                  dto.icon
                    ?.trim() ||
                  null,
              }
            : {}),

          ...(dto.parentFolderId !==
          undefined
            ? {
                parentFolderId:
                  dto.parentFolderId,
              }
            : {}),

          ...(dto.sequenceNumber !==
          undefined
            ? {
                sequenceNumber:
                  dto.sequenceNumber,
              }
            : {}),

          ...(dto.isExpanded !==
          undefined
            ? {
                isExpanded:
                  dto.isExpanded,
              }
            : {}),
        },

        include: {
          _count: {
            select: {
              notes: true,
              childFolders:
                true,
            },
          },
        },
      });
  }

  async deleteFolder(
    userId: string,
    folderId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedFolder(
      profile.id,
      folderId,
    );

    await this.database
      .noteFolder
      .delete({
        where: {
          id: folderId,
        },
      });

    return {
      deleted: true,
      folderId,
    };
  }

  async createTag(
    userId: string,
    dto: CreateNoteTagDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const name =
      dto.name.trim();

    if (!name) {
      throw new BadRequestException(
        "Tag name is required.",
      );
    }

    return this.database
      .noteTag
      .upsert({
        where: {
          studentProfileId_name: {
            studentProfileId:
              profile.id,
            name,
          },
        },

        update: {
          ...(dto.color !==
          undefined
            ? {
                color:
                  dto.color
                    ?.trim() ||
                  null,
              }
            : {}),
        },

        create: {
          studentProfileId:
            profile.id,

          name,

          color:
            dto.color
              ?.trim() ||
            null,
        },
      });
  }

  async createNote(
    userId: string,
    dto: CreateNoteDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.assertFolder(
      profile.id,
      dto.folderId,
    );

    await this.assertAcademicLinks(
      enrollment
        .syllabusVersionId,
      {
        subjectId:
          dto.subjectId ??
          null,

        chapterId:
          dto.chapterId ??
          null,

        topicId:
          dto.topicId ??
          null,
      },
    );

    const tagIds =
      await this.assertTags(
        profile.id,
        dto.tagIds,
      );

    const title =
      dto.title
        ?.trim() ||
      "Untitled note";

    const content =
      dto.content ?? "";

    const note =
      await this.database.note
        .create({
          data: {
            studentProfileId:
              profile.id,

            folderId:
              dto.folderId ??
              null,

            subjectId:
              dto.subjectId ??
              null,

            chapterId:
              dto.chapterId ??
              null,

            topicId:
              dto.topicId ??
              null,

            title,
            content,

            excerpt:
              this.createExcerpt(
                content,
              ),

            contentFormat:
              dto.contentFormat ??
              NoteContentFormat
                .MARKDOWN,

            sourceType:
              dto.sourceType ??
              NoteSourceType
                .MANUAL,

            isPinned:
              dto.isPinned ??
              false,

            wordCount:
              this.countWords(
                content,
              ),

            characterCount:
              content.length,

            lastOpenedAt:
              new Date(),

            ...(tagIds.length
              ? {
                  tagAssignments: {
                    create:
                      tagIds.map(
                        (
                          noteTagId,
                        ) => ({
                          noteTagId,
                        }),
                      ),
                  },
                }
              : {}),
          },

          include:
            noteInclude,
        });

    return this.serializeNote(
      note,
    );
  }

  async getNote(
    userId: string,
    noteId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedNote(
      profile.id,
      noteId,
    );

    const note =
      await this.database.note
        .update({
          where: {
            id: noteId,
          },

          data: {
            lastOpenedAt:
              new Date(),
          },

          include:
            noteInclude,
        });

    return this.serializeNote(
      note,
    );
  }

  async updateNote(
    userId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ) {
    const {
      profile,
      enrollment,
    } =
      await this.getStudentContext(
        userId,
      );

    const existing =
      await this.getOwnedNote(
        profile.id,
        noteId,
      );

    if (
      dto.folderId !==
      undefined
    ) {
      await this.assertFolder(
        profile.id,
        dto.folderId,
      );
    }

    const subjectId =
      dto.subjectId ===
      undefined
        ? existing.subjectId
        : dto.subjectId;

    const chapterId =
      dto.chapterId ===
      undefined
        ? existing.chapterId
        : dto.chapterId;

    const topicId =
      dto.topicId ===
      undefined
        ? existing.topicId
        : dto.topicId;

    await this.assertAcademicLinks(
      enrollment
        .syllabusVersionId,
      {
        subjectId,
        chapterId,
        topicId,
      },
    );

    const tagIds =
      await this.assertTags(
        profile.id,
        dto.tagIds,
      );

    const title =
      dto.title === undefined
        ? existing.title
        : dto.title.trim() ||
          "Untitled note";

    const content =
      dto.content === undefined
        ? existing.content
        : dto.content;

    const contentFormat =
      dto.contentFormat ??
      existing.contentFormat;

    const changedContent =
      title !== existing.title ||
      content !==
        existing.content ||
      contentFormat !==
        existing.contentFormat;

    if (changedContent) {
      await this.createCurrentRevision(
        existing,
      );
    }

    const note =
      await this.database.note
        .update({
          where: {
            id: noteId,
          },

          data: {
            ...(dto.folderId !==
            undefined
              ? {
                  folderId:
                    dto.folderId,
                }
              : {}),

            ...(dto.subjectId !==
            undefined
              ? {
                  subjectId:
                    dto.subjectId,
                }
              : {}),

            ...(dto.chapterId !==
            undefined
              ? {
                  chapterId:
                    dto.chapterId,
                }
              : {}),

            ...(dto.topicId !==
            undefined
              ? {
                  topicId:
                    dto.topicId,
                }
              : {}),

            ...(dto.title !==
            undefined
              ? {
                  title,
                }
              : {}),

            ...(dto.content !==
            undefined
              ? {
                  content,

                  excerpt:
                    this.createExcerpt(
                      content,
                    ),

                  wordCount:
                    this.countWords(
                      content,
                    ),

                  characterCount:
                    content.length,
                }
              : {}),

            ...(dto.contentFormat !==
            undefined
              ? {
                  contentFormat,
                }
              : {}),

            ...(dto.sourceType !==
            undefined
              ? {
                  sourceType:
                    dto.sourceType,
                }
              : {}),

            ...(dto.isPinned !==
            undefined
              ? {
                  isPinned:
                    dto.isPinned,
                }
              : {}),

            lastOpenedAt:
              new Date(),

            ...(dto.tagIds !==
            undefined
              ? {
                  tagAssignments: {
                    deleteMany: {},

                    create:
                      tagIds.map(
                        (
                          noteTagId,
                        ) => ({
                          noteTagId,
                        }),
                      ),
                  },
                }
              : {}),
          },

          include:
            noteInclude,
        });

    return this.serializeNote(
      note,
    );
  }

  async updateNoteStatus(
    userId: string,
    noteId: string,
    dto: UpdateNoteStatusDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedNote(
      profile.id,
      noteId,
    );

    const now =
      new Date();

    const note =
      await this.database.note
        .update({
          where: {
            id: noteId,
          },

          data: {
            status:
              dto.status,

            archivedAt:
              dto.status ===
              NoteStatus.ARCHIVED
                ? now
                : null,

            trashedAt:
              dto.status ===
              NoteStatus.TRASHED
                ? now
                : null,
          },

          include:
            noteInclude,
        });

    return this.serializeNote(
      note,
    );
  }

  async permanentlyDeleteNote(
    userId: string,
    noteId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const note =
      await this.getOwnedNote(
        profile.id,
        noteId,
      );

    if (
      note.status !==
      NoteStatus.TRASHED
    ) {
      throw new BadRequestException(
        "Move the note to Trash before deleting it permanently.",
      );
    }

    await this.database.note
      .delete({
        where: {
          id: noteId,
        },
      });

    return {
      deleted: true,
      noteId,
    };
  }

  async getRevisions(
    userId: string,
    noteId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedNote(
      profile.id,
      noteId,
    );

    return this.database
      .noteRevision
      .findMany({
        where: {
          noteId,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 100,
      });
  }

  async restoreRevision(
    userId: string,
    noteId: string,
    revisionId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    const note =
      await this.getOwnedNote(
        profile.id,
        noteId,
      );

    const revision =
      await this.database
        .noteRevision
        .findFirst({
          where: {
            id: revisionId,
            noteId,
          },
        });

    if (!revision) {
      throw new NotFoundException(
        "The requested note revision was not found.",
      );
    }

    await this.createCurrentRevision(
      note,
    );

    const restored =
      await this.database.note
        .update({
          where: {
            id: noteId,
          },

          data: {
            title:
              revision.title,

            content:
              revision.content,

            contentFormat:
              revision
                .contentFormat,

            excerpt:
              this.createExcerpt(
                revision.content,
              ),

            wordCount:
              revision.wordCount,

            characterCount:
              revision
                .characterCount,

            lastOpenedAt:
              new Date(),
          },

          include:
            noteInclude,
        });

    return this.serializeNote(
      restored,
    );
  }

  async createLink(
    userId: string,
    noteId: string,
    dto: CreateNoteLinkDto,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    if (
      noteId ===
      dto.targetNoteId
    ) {
      throw new BadRequestException(
        "A note cannot link to itself.",
      );
    }

    await Promise.all([
      this.getOwnedNote(
        profile.id,
        noteId,
      ),

      this.getOwnedNote(
        profile.id,
        dto.targetNoteId,
      ),
    ]);

    return this.database.noteLink
      .upsert({
        where: {
          sourceNoteId_targetNoteId: {
            sourceNoteId:
              noteId,

            targetNoteId:
              dto.targetNoteId,
          },
        },

        update: {
          label:
            dto.label
              ?.trim() ||
            null,
        },

        create: {
          sourceNoteId:
            noteId,

          targetNoteId:
            dto.targetNoteId,

          label:
            dto.label
              ?.trim() ||
            null,
        },

        include: {
          targetNote: {
            select: {
              id: true,
              title: true,
              status: true,
              updatedAt: true,
            },
          },
        },
      });
  }

  async deleteLink(
    userId: string,
    noteId: string,
    linkId: string,
  ) {
    const {
      profile,
    } =
      await this.getStudentContext(
        userId,
      );

    await this.getOwnedNote(
      profile.id,
      noteId,
    );

    const link =
      await this.database.noteLink
        .findFirst({
          where: {
            id: linkId,
            sourceNoteId:
              noteId,
          },
        });

    if (!link) {
      throw new NotFoundException(
        "The requested note link was not found.",
      );
    }

    await this.database.noteLink
      .delete({
        where: {
          id: linkId,
        },
      });

    return {
      deleted: true,
      linkId,
    };
  }
}
