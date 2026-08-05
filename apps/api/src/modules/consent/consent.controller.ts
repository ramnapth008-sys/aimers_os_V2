import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  Put,
} from "@nestjs/common";

import {
  ConsentScope,
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
  ConsentService,
} from "./consent.service";

import {
  GrantConsentDto,
} from "./dto/grant-consent.dto";

@Roles(UserRole.STUDENT)
@Controller("consent")
export class ConsentController {
  constructor(
    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  @Get()
  list(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.consentService
      .list(
        user.userId,
      );
  }

  @Put(":scope")
  grant(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param(
      "scope",
      new ParseEnumPipe(
        ConsentScope,
      ),
    )
    scope: ConsentScope,

    @Body()
    dto: GrantConsentDto,
  ) {
    return this.consentService
      .grant(
        user.userId,
        scope,
        dto,
      );
  }

  @Delete(":scope")
  revoke(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param(
      "scope",
      new ParseEnumPipe(
        ConsentScope,
      ),
    )
    scope: ConsentScope,
  ) {
    return this.consentService
      .revoke(
        user.userId,
        scope,
      );
  }
}
