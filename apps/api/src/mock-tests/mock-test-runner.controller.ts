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
  SaveMockTestResponseDto,
} from "./dto/save-mock-test-response.dto";

import {
  SubmitMockTestRunnerAttemptDto,
} from "./dto/submit-mock-test-runner-attempt.dto";

import {
  MockTestRunnerService,
} from "./mock-test-runner.service";

@Roles(UserRole.STUDENT)
@Controller("mock-tests")
export class MockTestRunnerController {
  constructor(
    @Inject(MockTestRunnerService)
    private readonly mockTestRunnerService:
      MockTestRunnerService,
  ) {}

  @Get("runner/catalogue")
  getRunnerCatalogue(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.mockTestRunnerService
      .getRunnerCatalogue(
        user.userId,
      );
  }

  @Post(
    ":mockTestId/runner-attempts",
  )
  startOrResumeAttempt(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("mockTestId")
    mockTestId: string,
  ) {
    return this.mockTestRunnerService
      .startOrResumeAttempt(
        user.userId,
        mockTestId,
      );
  }

  @Get(
    "runner-attempts/:attemptId",
  )
  getRunnerAttempt(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("attemptId")
    attemptId: string,
  ) {
    return this.mockTestRunnerService
      .getRunnerAttempt(
        user.userId,
        attemptId,
      );
  }

  @Patch(
    "runner-attempts/:attemptId/responses/:mockTestQuestionId",
  )
  saveResponse(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("attemptId")
    attemptId: string,

    @Param("mockTestQuestionId")
    mockTestQuestionId:
      string,

    @Body()
    dto:
      SaveMockTestResponseDto,
  ) {
    return this.mockTestRunnerService
      .saveResponse(
        user.userId,
        attemptId,
        mockTestQuestionId,
        dto,
      );
  }

  @Patch(
    "runner-attempts/:attemptId/submit",
  )
  submitAttempt(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("attemptId")
    attemptId: string,

    @Body()
    dto:
      SubmitMockTestRunnerAttemptDto,
  ) {
    return this.mockTestRunnerService
      .submitAttempt(
        user.userId,
        attemptId,
        dto,
      );
  }
}
