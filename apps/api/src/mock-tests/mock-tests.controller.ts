import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
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
  RecordMockTestAttemptDto,
} from "./dto/record-mock-test-attempt.dto";

import {
  MockTestsService,
} from "./mock-tests.service";

@Roles(UserRole.STUDENT)
@Controller("mock-tests")
export class MockTestsController {
  constructor(
    @Inject(MockTestsService)
    private readonly mockTestsService:
      MockTestsService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.mockTestsService
      .getWorkspace(
        user.userId,
      );
  }

  @Get(":mockTestId")
  getTest(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("mockTestId")
    mockTestId: string,
  ) {
    return this.mockTestsService
      .getTest(
        user.userId,
        mockTestId,
      );
  }

  @Post(
    ":mockTestId/attempts",
  )
  recordAttempt(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("mockTestId")
    mockTestId: string,

    @Body()
    dto:
      RecordMockTestAttemptDto,
  ) {
    return this.mockTestsService
      .recordAttempt(
        user.userId,
        mockTestId,
        dto,
      );
  }

  @Delete(
    "attempts/:attemptId",
  )
  deleteAttempt(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("attemptId")
    attemptId: string,
  ) {
    return this.mockTestsService
      .deleteAttempt(
        user.userId,
        attemptId,
      );
  }
}
