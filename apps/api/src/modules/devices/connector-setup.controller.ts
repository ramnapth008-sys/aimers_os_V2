import {
  Controller,
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
} from "../../auth/auth.types";

import {
  CurrentUser,
} from "../../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../../auth/decorators/roles.decorator";

import {
  ConnectorSetupService,
} from "./connector-setup.service";

@Roles(UserRole.STUDENT)
@Controller("connector-setup")
export class ConnectorSetupController {
  constructor(
    @Inject(
      ConnectorSetupService,
    )
    private readonly service:
      ConnectorSetupService,
  ) {}

  // AIMERS_EXTERNAL_AUTHORIZATION_ORCHESTRATOR_FOUNDATION_V1
  @Get()
  getWorkspace(
    @CurrentUser()
    user:
      AuthenticatedUser,
  ) {
    return this.service
      .getWorkspace(
        user.userId,
      );
  }

  @Post(":connectorId/start")
  start(
    @CurrentUser()
    user:
      AuthenticatedUser,

    @Param("connectorId")
    connectorId:
      string,
  ) {
    return this.service
      .start(
        user.userId,
        connectorId,
      );
  }

  @Post(":connectorId/retry")
  retry(
    @CurrentUser()
    user:
      AuthenticatedUser,

    @Param("connectorId")
    connectorId:
      string,
  ) {
    return this.service
      .retry(
        user.userId,
        connectorId,
      );
  }
}
