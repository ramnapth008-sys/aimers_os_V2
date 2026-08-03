#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS OS Prisma database package..."

mkdir -p \
  packages/database/prisma/migrations \
  packages/database/src

# ============================================================
# DATABASE PACKAGE
# ============================================================

cat > packages/database/package.json <<'EOF'
{
  "name": "@aimers/database",
  "version": "0.0.0",
  "private": true,
  "type": "commonjs",
  "description": "Shared AIMERS OS Prisma database client and schema",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "clean": "rm -rf dist",
    "prisma:format": "prisma format --schema prisma/schema.prisma",
    "prisma:validate": "dotenv -e ../../apps/api/.env -- prisma validate --schema prisma/schema.prisma",
    "prisma:generate": "dotenv -e ../../apps/api/.env -- prisma generate --schema prisma/schema.prisma",
    "prisma:migrate:dev": "dotenv -e ../../apps/api/.env -- prisma migrate dev --schema prisma/schema.prisma",
    "prisma:migrate:deploy": "dotenv -e ../../apps/api/.env -- prisma migrate deploy --schema prisma/schema.prisma",
    "prisma:studio": "dotenv -e ../../apps/api/.env -- prisma studio --schema prisma/schema.prisma",
    "db:seed": "dotenv -e ../../apps/api/.env -- tsx prisma/seed.ts"
  }
}
EOF

cat > packages/database/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Bundler",

    "rootDir": "./src",
    "outDir": "./dist",

    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "types": [
      "node"
    ]
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF

cat > packages/database/src/index.ts <<'EOF'
export * from "@prisma/client";
EOF

# ============================================================
# PRISMA SCHEMA
# ============================================================

cat > packages/database/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserStatus {
  INVITED
  ACTIVE
  SUSPENDED
  DELETED
}

enum UserRole {
  STUDENT
  PARENT
  MENTOR
  TEACHER
  STAFF
  INSTITUTION_ADMIN
  ADMIN
  SUPER_ADMIN
}

enum OrganizationType {
  PLATFORM
  SCHOOL
  COLLEGE
  COACHING_INSTITUTE
  COMPANY
  OTHER
}

enum OrganizationStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}

enum MembershipStatus {
  INVITED
  ACTIVE
  SUSPENDED
  REVOKED
}

enum AuthProvider {
  GOOGLE
  APPLE
  MICROSOFT
}

enum SessionStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

enum StudentStatus {
  ACTIVE
  PAUSED
  GRADUATED
  ARCHIVED
}

enum GuardianRelationship {
  MOTHER
  FATHER
  LEGAL_GUARDIAN
  SIBLING
  OTHER
}

enum GuardianLinkStatus {
  INVITED
  ACTIVE
  REVOKED
}

enum AssignmentStatus {
  ACTIVE
  PAUSED
  ENDED
}

model User {
  id                  String     @id @default(uuid()) @db.Uuid
  email               String     @unique @db.VarChar(320)
  passwordHash        String?    @map("password_hash") @db.VarChar(255)
  firstName           String     @map("first_name") @db.VarChar(100)
  lastName            String?    @map("last_name") @db.VarChar(100)
  displayName         String?    @map("display_name") @db.VarChar(150)
  phoneNumber         String?    @map("phone_number") @db.VarChar(30)
  avatarUrl           String?    @map("avatar_url") @db.Text
  status              UserStatus @default(ACTIVE)
  emailVerifiedAt     DateTime?  @map("email_verified_at") @db.Timestamptz(6)
  lastLoginAt         DateTime?  @map("last_login_at") @db.Timestamptz(6)
  createdAt           DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt           DateTime?  @map("deleted_at") @db.Timestamptz(6)

  globalRoles            GlobalRoleAssignment[]
  organizationMemberships OrganizationMembership[]
  authAccounts           AuthAccount[]
  sessions               AuthSession[]
  passwordResetTokens    PasswordResetToken[]
  emailVerificationTokens EmailVerificationToken[]
  studentProfiles        StudentProfile[]
  staffProfiles          StaffProfile[]

  guardianLinks GuardianStudentLink[] @relation("GuardianUser")
  mentorAssignments StudentMentorAssignment[] @relation("MentorUser")

  @@index([status])
  @@index([createdAt])
  @@map("users")
}

model GlobalRoleAssignment {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      UserRole
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@index([role])
  @@map("global_role_assignments")
}

model Organization {
  id        String             @id @default(uuid()) @db.Uuid
  name      String             @db.VarChar(200)
  slug      String             @unique @db.VarChar(120)
  type      OrganizationType
  status    OrganizationStatus @default(ACTIVE)
  website   String?            @db.Text
  timezone  String             @default("Asia/Kolkata") @db.VarChar(100)
  country   String             @default("IN") @db.VarChar(2)
  createdAt DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime           @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt DateTime?          @map("deleted_at") @db.Timestamptz(6)

  memberships      OrganizationMembership[]
  studentProfiles  StudentProfile[]
  staffProfiles    StaffProfile[]
  mentorAssignments StudentMentorAssignment[]

  @@index([type, status])
  @@map("organizations")
}

model OrganizationMembership {
  id             String           @id @default(uuid()) @db.Uuid
  userId         String           @map("user_id") @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  role           UserRole
  status         MembershipStatus @default(ACTIVE)
  joinedAt       DateTime?        @map("joined_at") @db.Timestamptz(6)
  createdAt      DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  organization Organization @relation(
    fields: [organizationId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([userId, organizationId, role])
  @@index([organizationId, status])
  @@index([userId, status])
  @@map("organization_memberships")
}

model AuthAccount {
  id                String       @id @default(uuid()) @db.Uuid
  userId            String       @map("user_id") @db.Uuid
  provider          AuthProvider
  providerAccountId String       @map("provider_account_id") @db.VarChar(255)
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("auth_accounts")
}

model AuthSession {
  id          String        @id @default(uuid()) @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  tokenHash   String        @unique @map("token_hash") @db.VarChar(128)
  status      SessionStatus @default(ACTIVE)
  ipAddress   String?       @map("ip_address") @db.VarChar(64)
  userAgent   String?       @map("user_agent") @db.Text
  expiresAt   DateTime      @map("expires_at") @db.Timestamptz(6)
  lastSeenAt  DateTime?     @map("last_seen_at") @db.Timestamptz(6)
  revokedAt   DateTime?     @map("revoked_at") @db.Timestamptz(6)
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([expiresAt])
  @@map("auth_sessions")
}

model PasswordResetToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.VarChar(128)
  expiresAt DateTime  @map("expires_at") @db.Timestamptz(6)
  usedAt    DateTime? @map("used_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
  @@map("password_reset_tokens")
}

model EmailVerificationToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.VarChar(128)
  expiresAt DateTime  @map("expires_at") @db.Timestamptz(6)
  usedAt    DateTime? @map("used_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
  @@map("email_verification_tokens")
}

model StudentProfile {
  id              String        @id @default(uuid()) @db.Uuid
  userId          String        @map("user_id") @db.Uuid
  organizationId  String        @map("organization_id") @db.Uuid
  admissionNumber String?       @map("admission_number") @db.VarChar(100)
  examTarget      String?       @map("exam_target") @db.VarChar(100)
  targetYear      Int?          @map("target_year")
  dateOfBirth     DateTime?     @map("date_of_birth") @db.Date
  status          StudentStatus @default(ACTIVE)
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  organization Organization @relation(
    fields: [organizationId],
    references: [id],
    onDelete: Cascade
  )

  guardians         GuardianStudentLink[]
  mentorAssignments StudentMentorAssignment[]

  @@unique([userId, organizationId])
  @@unique([organizationId, admissionNumber])
  @@index([organizationId, status])
  @@index([examTarget, targetYear])
  @@map("student_profiles")
}

model StaffProfile {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  employeeCode   String?  @map("employee_code") @db.VarChar(100)
  jobTitle       String?  @map("job_title") @db.VarChar(150)
  department     String?  @db.VarChar(150)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  organization Organization @relation(
    fields: [organizationId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([userId, organizationId])
  @@unique([organizationId, employeeCode])
  @@index([organizationId, department])
  @@map("staff_profiles")
}

model GuardianStudentLink {
  id                String               @id @default(uuid()) @db.Uuid
  guardianUserId    String               @map("guardian_user_id") @db.Uuid
  studentProfileId  String               @map("student_profile_id") @db.Uuid
  relationship      GuardianRelationship
  status            GuardianLinkStatus   @default(INVITED)
  isPrimary         Boolean              @default(false) @map("is_primary")
  canViewProgress   Boolean              @default(true) @map("can_view_progress")
  canManageBilling  Boolean              @default(false) @map("can_manage_billing")
  createdAt         DateTime             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime             @updatedAt @map("updated_at") @db.Timestamptz(6)

  guardianUser User @relation(
    "GuardianUser",
    fields: [guardianUserId],
    references: [id],
    onDelete: Cascade
  )

  studentProfile StudentProfile @relation(
    fields: [studentProfileId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([guardianUserId, studentProfileId])
  @@index([studentProfileId, status])
  @@map("guardian_student_links")
}

model StudentMentorAssignment {
  id               String           @id @default(uuid()) @db.Uuid
  studentProfileId String           @map("student_profile_id") @db.Uuid
  mentorUserId     String           @map("mentor_user_id") @db.Uuid
  organizationId   String           @map("organization_id") @db.Uuid
  status           AssignmentStatus @default(ACTIVE)
  assignedAt       DateTime         @default(now()) @map("assigned_at") @db.Timestamptz(6)
  endedAt          DateTime?        @map("ended_at") @db.Timestamptz(6)
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  studentProfile StudentProfile @relation(
    fields: [studentProfileId],
    references: [id],
    onDelete: Cascade
  )

  mentorUser User @relation(
    "MentorUser",
    fields: [mentorUserId],
    references: [id],
    onDelete: Cascade
  )

  organization Organization @relation(
    fields: [organizationId],
    references: [id],
    onDelete: Cascade
  )

  @@index([studentProfileId, status])
  @@index([mentorUserId, status])
  @@index([organizationId, status])
  @@map("student_mentor_assignments")
}
EOF

# ============================================================
# INITIAL SEED
# ============================================================

cat > packages/database/prisma/seed.ts <<'EOF'
import {
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
} from "@prisma/client";

const database = new PrismaClient();

async function seed(): Promise<void> {
  const platform =
    await database.organization.upsert({
      where: {
        slug: "aimers-platform",
      },

      update: {
        name: "AIMERS Platform",
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
      },

      create: {
        name: "AIMERS Platform",
        slug: "aimers-platform",
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
        timezone: "Asia/Kolkata",
        country: "IN",
      },
    });

  const academy =
    await database.organization.upsert({
      where: {
        slug: "aimers-academy-trivandrum",
      },

      update: {
        name: "AIMERS Academy Trivandrum",
        type:
          OrganizationType.COACHING_INSTITUTE,
        status: OrganizationStatus.ACTIVE,
      },

      create: {
        name: "AIMERS Academy Trivandrum",
        slug: "aimers-academy-trivandrum",
        type:
          OrganizationType.COACHING_INSTITUTE,
        status: OrganizationStatus.ACTIVE,
        timezone: "Asia/Kolkata",
        country: "IN",
      },
    });

  console.log(
    "Seeded organisations:",
    {
      platform: platform.slug,
      academy: academy.slug,
    },
  );
}

seed()
  .catch((error: unknown) => {
    console.error(
      "Database seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
EOF

# ============================================================
# API PRISMA DATABASE SERVICE
# ============================================================

cat > apps/api/src/infrastructure/database/database.service.ts <<'EOF'
import {
  Inject,
  Injectable,
  type OnModuleDestroy,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { PrismaClient } from "@aimers/database";

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleDestroy
{
  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    super({
      datasources: {
        db: {
          url:
            configService.getOrThrow<string>(
              "DATABASE_URL",
            ),
        },
      },
    });
  }

  async ping(): Promise<boolean> {
    const result =
      await this.$queryRaw<
        Array<{
          ok: number;
        }>
      >`
        SELECT 1::int AS ok
      `;

    return result[0]?.ok === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
EOF

# ============================================================
# API BUILD DEPENDENCY
# ============================================================

python3 - <<'PY'
import json
from pathlib import Path

path = Path("apps/api/package.json")
package = json.loads(path.read_text())

scripts = package.setdefault("scripts", {})

scripts["predev"] = (
    "pnpm --filter @aimers/database build"
)

scripts["prebuild"] = (
    "pnpm --filter @aimers/database build"
)

scripts["pretypecheck"] = (
    "pnpm --filter @aimers/database build"
)

path.write_text(
    json.dumps(
        package,
        indent=2,
    ) + "\n"
)
PY

echo "Prisma database package source created."
