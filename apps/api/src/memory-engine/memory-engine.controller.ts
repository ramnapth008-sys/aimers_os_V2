import {
  Controller,
  Get,
  Inject,
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
  MemoryEngineService,
} from "./memory-engine.service";

@Roles(UserRole.STUDENT)
@Controller("memory-engine")
export class MemoryEngineController {
  constructor(
    @Inject(MemoryEngineService)
    private readonly memoryEngineService:
      MemoryEngineService,
  ) {}

  @Get("me")
  getWorkspace(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.memoryEngineService
      .getWorkspace(
        user.userId,
      );
  }
}
