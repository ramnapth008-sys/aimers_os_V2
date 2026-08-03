import {
  Body,
  Controller,
  Get,
  Inject,
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
  StudentOnboardingDto,
} from "./dto/student-onboarding.dto";

import {
  OnboardingService,
} from "./onboarding.service";

@Roles(UserRole.STUDENT)
@Controller("onboarding")
export class OnboardingController {
  constructor(
    @Inject(OnboardingService)
    private readonly onboardingService:
      OnboardingService,
  ) {}

  @Get("status")
  getStatus(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.onboardingService
      .getStudentStatus(
        user.userId,
      );
  }

  @Post("student")
  completeStudentOnboarding(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: StudentOnboardingDto,
  ) {
    return this.onboardingService
      .completeStudentOnboarding(
        user.userId,
        dto,
      );
  }
}
