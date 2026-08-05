import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
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
  UpdatePrivacyPreferencesDto,
} from "./dto/update-privacy-preferences.dto";

import {
  PrivacyService,
} from "./privacy.service";

@Roles(UserRole.STUDENT)
@Controller("privacy")
export class PrivacyController {
  constructor(
    @Inject(PrivacyService)
    private readonly privacyService:
      PrivacyService,
  ) {}

  @Get()
  get(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.privacyService
      .get(
        user.userId,
      );
  }

  @Patch()
  update(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      UpdatePrivacyPreferencesDto,
  ) {
    return this.privacyService
      .update(
        user.userId,
        dto,
      );
  }
}
