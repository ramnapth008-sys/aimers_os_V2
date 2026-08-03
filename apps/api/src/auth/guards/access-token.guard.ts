import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { Reflector } from "@nestjs/core";

import { JwtService } from "@nestjs/jwt";

import type { Request } from "express";

import {
  IS_PUBLIC_KEY,
} from "../decorators/public.decorator";

import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from "../auth.types";

type AuthenticatedRequest =
  Request & {
    user?: AuthenticatedUser;
  };

@Injectable()
export class AccessTokenGuard
  implements CanActivate
{
  constructor(
    @Inject(JwtService)
    private readonly jwtService:
      JwtService,

    @Inject(Reflector)
    private readonly reflector:
      Reflector,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic =
      this.reflector
        .getAllAndOverride<boolean>(
          IS_PUBLIC_KEY,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    if (isPublic) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const token =
      this.extractBearerToken(
        request,
      );

    if (!token) {
      throw new UnauthorizedException(
        "A valid access token is required.",
      );
    }

    try {
      const payload =
        await this.jwtService
          .verifyAsync<AccessTokenPayload>(
            token,
          );

      if (
        payload.type !== "access" ||
        !payload.sub ||
        !payload.email
      ) {
        throw new Error(
          "Invalid token payload.",
        );
      }

      request.user = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        "The access token is invalid or expired.",
      );
    }
  }

  private extractBearerToken(
    request: Request,
  ): string | undefined {
    const [
      type,
      token,
    ] =
      request.headers.authorization
        ?.split(" ") ?? [];

    return type === "Bearer"
      ? token
      : undefined;
  }
}
