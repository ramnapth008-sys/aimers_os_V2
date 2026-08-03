import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import {
  UserRole,
} from "@aimers/database";

import type { Request } from "express";

import {
  ROLES_KEY,
} from "../decorators/roles.decorator";

import type {
  AuthenticatedUser,
} from "../auth.types";

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    @Inject(Reflector)
    private readonly reflector:
      Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector
        .getAllAndOverride<UserRole[]>(
          ROLES_KEY,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const user =
      request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (
      user.roles.includes(
        UserRole.SUPER_ADMIN,
      )
    ) {
      return true;
    }

    const allowed =
      requiredRoles.some(
        (role) =>
          user.roles.includes(role),
      );

    if (!allowed) {
      throw new ForbiddenException(
        "Your account does not have permission to access this route.",
      );
    }

    return true;
  }
}
