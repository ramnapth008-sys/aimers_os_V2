import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
} from "@nestjs/common";

import type {
  AuthenticatedUser,
} from "../auth/auth.types";

import {
  CurrentUser,
} from "../auth/decorators/current-user.decorator";

import {
  UpdateProfileDto,
} from "./dto/update-profile.dto";

import {
  ProfileService,
} from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(
    @Inject(ProfileService)
    private readonly profileService:
      ProfileService,
  ) {}

  @Get("me")
  getProfile(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.profileService
      .getProfile(
        user.userId,
      );
  }

  @Patch("me")
  updateProfile(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: UpdateProfileDto,
  ) {
    return this.profileService
      .updateProfile(
        user.userId,
        dto,
      );
  }
}
