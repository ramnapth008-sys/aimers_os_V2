import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import {
  UserRole,
} from "@aimers/database";

import type {
  AuthenticatedUser,
} from "../auth/auth.types";

import {
  CurrentUser,
} from "../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../auth/decorators/roles.decorator";

import {
  AcademicService,
} from "./academic.service";

import {
  UpdateChapterProgressDto,
} from "./dto/update-chapter-progress.dto";

import {
  UpdateTopicMasteryDto,
} from "./dto/update-topic-mastery.dto";

@Roles(UserRole.STUDENT)
@Controller("academic")
export class AcademicController {
  constructor(
    @Inject(AcademicService)
    private readonly academicService:
      AcademicService,
  ) {}

  @Get("catalog")
  getCatalog() {
    return this.academicService
      .getCatalog();
  }

  @Post("enrollment/ensure")
  ensureEnrollment(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.academicService
      .ensureEnrollment(
        user.userId,
      );
  }

  @Get("me")
  getMyWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.academicService
      .getMyWorkspace(
        user.userId,
      );
  }

  @Patch(
    "chapters/:chapterId/progress",
  )
  updateChapterProgress(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("chapterId")
    chapterId: string,

    @Body()
    dto: UpdateChapterProgressDto,
  ) {
    return this.academicService
      .updateChapterProgress(
        user.userId,
        chapterId,
        dto,
      );
  }

  @Patch(
    "topics/:topicId/mastery",
  )
  updateTopicMastery(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("topicId")
    topicId: string,

    @Body()
    dto: UpdateTopicMasteryDto,
  ) {
    return this.academicService
      .updateTopicMastery(
        user.userId,
        topicId,
        dto,
      );
  }
}
