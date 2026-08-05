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

function normalizeIntegerQuery(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(
          String(
            value ?? "",
          ),
          10,
        );

  if (
    !Number.isFinite(parsed)
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      Math.trunc(parsed),
    ),
  );
}

function normalizeIntelligenceQuery(
  query:
    IntelligenceQueryDto,
): IntelligenceQueryDto {
  return {
    days:
      normalizeIntegerQuery(
        query.days,
        7,
        1,
        90,
      ),

    limit:
      normalizeIntegerQuery(
        query.limit,
        20,
        1,
        100,
      ),
  };
}

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
        normalizeIntelligenceQuery(
          query,
        ),
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
        normalizeIntelligenceQuery(
          query,
        ),
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
        normalizeIntelligenceQuery(
          query,
        ),
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
        normalizeIntelligenceQuery(
          query,
        ),
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
        normalizeIntelligenceQuery(
          query,
        ),
      );
  }
}
