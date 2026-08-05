import {
  Controller,
  Get,
  Inject,
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
  IntelligenceQueryDto,
} from "./dto/intelligence-query.dto";

import {
  IntelligenceService,
} from "./intelligence.service";

@Roles(UserRole.STUDENT)
@Controller("intelligence")
export class IntelligenceController {
  constructor(
    @Inject(IntelligenceService)
    private readonly intelligenceService:
      IntelligenceService,
  ) {}

  @Get("dashboard")
  dashboard(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      IntelligenceQueryDto,
  ) {
    return this.intelligenceService
      .dashboard(
        user.userId,
        query,
      );
  }

  @Get("mentor-context")
  mentorContext(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      IntelligenceQueryDto,
  ) {
    return this.intelligenceService
      .mentorContext(
        user.userId,
        query,
      );
  }

  @Get("subjects")
  subjects(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      IntelligenceQueryDto,
  ) {
    return this.intelligenceService
      .subjects(
        user.userId,
        query,
      );
  }

  @Get("planner-context")
  plannerContext(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      IntelligenceQueryDto,
  ) {
    return this.intelligenceService
      .plannerContext(
        user.userId,
        query,
      );
  }

  @Get("predictions")
  predictions(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      IntelligenceQueryDto,
  ) {
    return this.intelligenceService
      .predictions(
        user.userId,
        query,
      );
  }
}
