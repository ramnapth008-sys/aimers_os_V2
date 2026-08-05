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
  ActivityService,
} from "./activity.service";

import {
  ActivityOverviewQueryDto,
} from "./dto/activity-overview-query.dto";

import {
  ActivityQueryDto,
} from "./dto/activity-query.dto";

import {
  IngestActivityEventsDto,
} from "./dto/ingest-activity-events.dto";

import {
  UpsertLectureProgressDto,
} from "./dto/upsert-lecture-progress.dto";

@Roles(UserRole.STUDENT)
@Controller("activity")
export class ActivityController {
  constructor(
    @Inject(ActivityService)
    private readonly activityService:
      ActivityService,
  ) {}

  @Post("events/batch")
  ingestEvents(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      IngestActivityEventsDto,
  ) {
    return this.activityService
      .ingestEvents(
        user.userId,
        dto,
      );
  }

  @Get("events")
  listEvents(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      ActivityQueryDto,
  ) {
    return this.activityService
      .listEvents(
        user.userId,
        query,
      );
  }

  @Get("overview")
  getOverview(
    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query:
      ActivityOverviewQueryDto,
  ) {
    return this.activityService
      .getOverview(
        user.userId,
        query,
      );
  }

  @Post("lectures/progress")
  upsertLectureProgress(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      UpsertLectureProgressDto,
  ) {
    return this.activityService
      .upsertLectureProgress(
        user.userId,
        dto,
      );
  }

  @Get("lectures")
  listLectures(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.activityService
      .listLectures(
        user.userId,
      );
  }
}
