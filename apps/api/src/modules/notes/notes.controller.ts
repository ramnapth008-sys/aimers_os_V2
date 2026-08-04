import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  UserRole,
} from "@aimers/database";

import type {
  AuthenticatedUser,
} from "../../auth/auth.types";

import {
  CurrentUser,
} from "../../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../../auth/decorators/roles.decorator";

import {
  CreateNoteFolderDto,
} from "./dto/create-note-folder.dto";

import {
  CreateNoteLinkDto,
} from "./dto/create-note-link.dto";

import {
  CreateNoteTagDto,
} from "./dto/create-note-tag.dto";

import {
  CreateNoteDto,
} from "./dto/create-note.dto";

import {
  ListNotesQueryDto,
} from "./dto/list-notes-query.dto";

import {
  UpdateNoteFolderDto,
} from "./dto/update-note-folder.dto";

import {
  UpdateNoteStatusDto,
} from "./dto/update-note-status.dto";

import {
  UpdateNoteDto,
} from "./dto/update-note.dto";

import {
  NotesService,
} from "./notes.service";

@Roles(UserRole.STUDENT)
@Controller("notes")
export class NotesController {
  constructor(
    @Inject(NotesService)
    private readonly notesService:
      NotesService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
    @Query()
    query: ListNotesQueryDto,
  ) {
    return this.notesService
      .getWorkspace(
        user.userId,
        query,
      );
  }

  @Post("folders")
  createFolder(
    @CurrentUser()
    user: AuthenticatedUser,
    @Body()
    dto: CreateNoteFolderDto,
  ) {
    return this.notesService
      .createFolder(
        user.userId,
        dto,
      );
  }

  @Patch("folders/:folderId")
  updateFolder(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("folderId")
    folderId: string,
    @Body()
    dto: UpdateNoteFolderDto,
  ) {
    return this.notesService
      .updateFolder(
        user.userId,
        folderId,
        dto,
      );
  }

  @Delete("folders/:folderId")
  deleteFolder(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("folderId")
    folderId: string,
  ) {
    return this.notesService
      .deleteFolder(
        user.userId,
        folderId,
      );
  }

  @Post("tags")
  createTag(
    @CurrentUser()
    user: AuthenticatedUser,
    @Body()
    dto: CreateNoteTagDto,
  ) {
    return this.notesService
      .createTag(
        user.userId,
        dto,
      );
  }

  @Post()
  createNote(
    @CurrentUser()
    user: AuthenticatedUser,
    @Body()
    dto: CreateNoteDto,
  ) {
    return this.notesService
      .createNote(
        user.userId,
        dto,
      );
  }

  @Get(":noteId")
  getNote(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
  ) {
    return this.notesService
      .getNote(
        user.userId,
        noteId,
      );
  }

  @Patch(":noteId")
  updateNote(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
    @Body()
    dto: UpdateNoteDto,
  ) {
    return this.notesService
      .updateNote(
        user.userId,
        noteId,
        dto,
      );
  }

  @Patch(":noteId/status")
  updateNoteStatus(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
    @Body()
    dto: UpdateNoteStatusDto,
  ) {
    return this.notesService
      .updateNoteStatus(
        user.userId,
        noteId,
        dto,
      );
  }

  @Delete(":noteId")
  permanentlyDeleteNote(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
  ) {
    return this.notesService
      .permanentlyDeleteNote(
        user.userId,
        noteId,
      );
  }

  @Get(":noteId/revisions")
  getRevisions(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
  ) {
    return this.notesService
      .getRevisions(
        user.userId,
        noteId,
      );
  }

  @Post(
    ":noteId/revisions/:revisionId/restore",
  )
  restoreRevision(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
    @Param("revisionId")
    revisionId: string,
  ) {
    return this.notesService
      .restoreRevision(
        user.userId,
        noteId,
        revisionId,
      );
  }

  @Post(":noteId/links")
  createLink(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
    @Body()
    dto: CreateNoteLinkDto,
  ) {
    return this.notesService
      .createLink(
        user.userId,
        noteId,
        dto,
      );
  }

  @Delete(
    ":noteId/links/:linkId",
  )
  deleteLink(
    @CurrentUser()
    user: AuthenticatedUser,
    @Param("noteId")
    noteId: string,
    @Param("linkId")
    linkId: string,
  ) {
    return this.notesService
      .deleteLink(
        user.userId,
        noteId,
        linkId,
      );
  }
}
