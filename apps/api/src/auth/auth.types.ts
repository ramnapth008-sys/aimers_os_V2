import { UserRole } from "@aimers/database";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  type: "access";
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: UserRole[];
}

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}
