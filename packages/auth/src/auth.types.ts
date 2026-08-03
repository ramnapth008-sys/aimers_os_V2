export type UserRole =
  | "STUDENT"
  | "PARENT"
  | "MENTOR"
  | "TEACHER"
  | "STAFF"
  | "INSTITUTION_ADMIN"
  | "ADMIN"
  | "SUPER_ADMIN";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous";

export interface OrganizationMembership {
  organizationId: string;
  role: UserRole;
  status: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  roles: UserRole[];
  organizationMemberships: OrganizationMembership[];
}

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}
