import { SetMetadata } from "@nestjs/common";

import { UserRole } from "@aimers/database";

export const ROLES_KEY =
  "aimers:required-roles";

export const Roles = (
  ...roles: UserRole[]
) =>
  SetMetadata(
    ROLES_KEY,
    roles,
  );
