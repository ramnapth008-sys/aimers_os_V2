import {
  Body,
  Controller,
  Delete,
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
  CompleteStudySessionDto,
} from "./dto/complete-study-session.dto";

import {
  CreateStudyPlanDto,
} from "./dto/create-study-plan.dto";

import {
  CreateStudyTaskDto,
} from "./dto/create-study-task.dto";

import {
  UpdateStudyTaskDto,
} from "./dto/update-study-task.dto";

import {
  PlannerService,
} from "./planner.service";

@Roles(UserRole.STUDENT)
@Controller("planner")
export class PlannerController {
  constructor(
    @Inject(PlannerService)
    private readonly plannerService:
      PlannerService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.plannerService
      .getWorkspace(
        user.userId,
      );
  }

  @Post("plans")
  createPlan(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateStudyPlanDto,
  ) {
    return this.plannerService
      .createPlan(
        user.userId,
        dto,
      );
  }

  @Post("tasks")
  createTask(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateStudyTaskDto,
  ) {
    return this.plannerService
      .createTask(
        user.userId,
        dto,
      );
  }

  @Patch("tasks/:taskId")
  updateTask(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("taskId")
    taskId: string,

    @Body()
    dto: UpdateStudyTaskDto,
  ) {
    return this.plannerService
      .updateTask(
        user.userId,
        taskId,
        dto,
      );
  }

  @Delete("tasks/:taskId")
  deleteTask(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("taskId")
    taskId: string,
  ) {
    return this.plannerService
      .deleteTask(
        user.userId,
        taskId,
      );
  }

  @Post(
    "tasks/:taskId/sessions/start",
  )
  startSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("taskId")
    taskId: string,
  ) {
    return this.plannerService
      .startSession(
        user.userId,
        taskId,
      );
  }

  @Patch(
    "sessions/:sessionId/complete",
  )
  completeSession(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("sessionId")
    sessionId: string,

    @Body()
    dto: CompleteStudySessionDto,
  ) {
    return this.plannerService
      .completeSession(
        user.userId,
        sessionId,
        dto,
      );
  }
}
