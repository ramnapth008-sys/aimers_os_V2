import {
  Body,
  Controller,
  Get,
  Inject,
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
  BehaviorService,
} from "./behavior.service";

import {
  AnalyzeBehaviorDto,
} from "./dto/analyze-behavior.dto";

import {
  BehaviorOverviewQueryDto,
} from "./dto/behavior-overview-query.dto";

import {
  BehaviorSignalsQueryDto,
} from "./dto/behavior-signals-query.dto";

@Roles(UserRole.STUDENT)
@Controller("behavior")
export class BehaviorController {
  constructor(
    @Inject(BehaviorService)
    private readonly behaviorService:
      BehaviorService,
  ) {}

  @Post("analyze")
  analyze(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      AnalyzeBehaviorDto,
  ) {
    return this.behaviorService
      .analyze(
        user.userId,
        dto,
      );
  }

  @Get("overview")
  overview(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      BehaviorOverviewQueryDto,
  ) {
    return this.behaviorService
      .overview(
        user.userId,
        query,
      );
  }

  @Get("signals")
  listSignals(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      BehaviorSignalsQueryDto,
  ) {
    return this.behaviorService
      .listSignals(
        user.userId,
        query,
      );
  }
}
