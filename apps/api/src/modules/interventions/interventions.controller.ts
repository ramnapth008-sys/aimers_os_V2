import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
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
  GenerateInterventionsDto,
} from "./dto/generate-interventions.dto";

import {
  ListInterventionsQueryDto,
} from "./dto/list-interventions-query.dto";

import {
  RespondToInterventionDto,
} from "./dto/respond-to-intervention.dto";

import {
  InterventionsService,
} from "./interventions.service";

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

function normalizeBooleanQuery(
  value: unknown,
  fallback: boolean,
): boolean {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no"
  ) {
    return false;
  }

  return fallback;
}

function normalizeListQuery(
  query:
    ListInterventionsQueryDto,
): ListInterventionsQueryDto {
  return {
    includeClosed:
      normalizeBooleanQuery(
        query.includeClosed,
        false,
      ),

    status:
      query.status,

    limit:
      normalizeIntegerQuery(
        query.limit,
        50,
        1,
        200,
      ),
  };
}

@Roles(UserRole.STUDENT)
@Controller("interventions")
export class InterventionsController {
  constructor(
    @Inject(InterventionsService)
    private readonly interventionsService:
      InterventionsService,
  ) {}

  @Post("generate")
  generate(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      GenerateInterventionsDto,
  ) {
    return this.interventionsService
      .generate(
        user.userId,
        dto,
      );
  }

  @Get()
  list(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      ListInterventionsQueryDto,
  ) {
    return this.interventionsService
      .list(
        user.userId,
        normalizeListQuery(
          query,
        ),
      );
  }

  @Get("overview")
  overview(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.interventionsService
      .overview(
        user.userId,
      );
  }

  @Get(":interventionId")
  getOne(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("interventionId")
    interventionId: string,
  ) {
    return this.interventionsService
      .getOne(
        user.userId,
        interventionId,
      );
  }

  @Post(
    ":interventionId/respond",
  )
  respond(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("interventionId")
    interventionId: string,

    @Body()
    dto:
      RespondToInterventionDto,
  ) {
    return this.interventionsService
      .respond(
        user.userId,
        interventionId,
        dto,
      );
  }
}
