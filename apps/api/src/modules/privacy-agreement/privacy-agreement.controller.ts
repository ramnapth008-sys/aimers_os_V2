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
} from "../../auth/auth.types";

import {
  CurrentUser,
} from "../../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../../auth/decorators/roles.decorator";

import {
  AcceptPrivacyAgreementDto,
} from "./dto/accept-privacy-agreement.dto";

import {
  PrivacyAgreementService,
} from "./privacy-agreement.service";

@Roles(UserRole.STUDENT)
@Controller("privacy-agreement")
export class PrivacyAgreementController {
  constructor(
    @Inject(
      PrivacyAgreementService,
    )
    private readonly service:
      PrivacyAgreementService,
  ) {}

  @Get()
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.service
      .getWorkspace(
        user.userId,
      );
  }

  @Post("accept")
  accept(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      AcceptPrivacyAgreementDto,
  ) {
    return this.service
      .accept(
        user.userId,
        dto,
      );
  }
}
