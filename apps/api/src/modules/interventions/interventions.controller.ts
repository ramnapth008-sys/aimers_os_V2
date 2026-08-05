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
        query,
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
