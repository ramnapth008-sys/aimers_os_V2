import {
  hash,
} from "@node-rs/argon2";

import {
  MembershipStatus,
  OrganizationType,
  PrismaClient,
  UserRole,
  UserStatus,
} from "@aimers/database";

import {
  randomBytes,
} from "node:crypto";

import {
  chmod,
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  resolve,
} from "node:path";

interface Credential {
  email: string;
  password: string;
  firstName: string;
  role: UserRole;
}

type CredentialMap =
  Record<string, Credential>;

const database =
  new PrismaClient();

const credentialPath =
  resolve(
    process.cwd(),
    ".dev-auth-credentials.json",
  );

function createPassword():
  string {
  return (
    "Aimers!" +
    randomBytes(15)
      .toString("base64url")
  );
}

async function loadCredentials():
  Promise<CredentialMap> {
  try {
    return JSON.parse(
      await readFile(
        credentialPath,
        "utf8",
      ),
    ) as CredentialMap;
  } catch {
    const credentials:
      CredentialMap = {
        student: {
          email:
            "student@aimers.local",
          password:
            createPassword(),
          firstName:
            "Student",
          role:
            UserRole.STUDENT,
        },

        parent: {
          email:
            "parent@aimers.local",
          password:
            createPassword(),
          firstName:
            "Parent",
          role:
            UserRole.PARENT,
        },

        staff: {
          email:
            "mentor@aimers.local",
          password:
            createPassword(),
          firstName:
            "Mentor",
          role:
            UserRole.MENTOR,
        },

        institution: {
          email:
            "institution@aimers.local",
          password:
            createPassword(),
          firstName:
            "Institution",
          role:
            UserRole.INSTITUTION_ADMIN,
        },

        admin: {
          email:
            "admin@aimers.local",
          password:
            createPassword(),
          firstName:
            "Admin",
          role:
            UserRole.ADMIN,
        },
      };

    await writeFile(
      credentialPath,
      JSON.stringify(
        credentials,
        null,
        2,
      ) + "\n",
      "utf8",
    );

    await chmod(
      credentialPath,
      0o600,
    );

    return credentials;
  }
}

async function ensureRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  const existing =
    await database
      .globalRoleAssignment
      .findFirst({
        where: {
          userId,
          role,
        },
      });

  if (!existing) {
    await database
      .globalRoleAssignment
      .create({
        data: {
          userId,
          role,
        },
      });
  }
}

async function ensureMembership(
  userId: string,
  organizationId: string,
  role: UserRole,
): Promise<void> {
  const existing =
    await database
      .organizationMembership
      .findFirst({
        where: {
          userId,
          organizationId,
          role,
        },
      });

  if (existing) {
    await database
      .organizationMembership
      .update({
        where: {
          id: existing.id,
        },

        data: {
          status:
            MembershipStatus.ACTIVE,
          joinedAt:
            existing.joinedAt ??
            new Date(),
        },
      });

    return;
  }

  await database
    .organizationMembership
    .create({
      data: {
        userId,
        organizationId,
        role,
        status:
          MembershipStatus.ACTIVE,
        joinedAt:
          new Date(),
      },
    });
}

async function run():
  Promise<void> {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    throw new Error(
      "Development users cannot be seeded in production.",
    );
  }

  const credentials =
    await loadCredentials();

  const academy =
    await database.organization
      .upsert({
        where: {
          slug:
            "aimers-academy-trivandrum",
        },

        update: {},

        create: {
          name:
            "AIMERS Academy Trivandrum",
          slug:
            "aimers-academy-trivandrum",
          type:
            OrganizationType
              .COACHING_INSTITUTE,
          timezone:
            "Asia/Kolkata",
          country:
            "IN",
        },
      });

  for (
    const credential of
    Object.values(credentials)
  ) {
    const passwordHash =
      await hash(
        credential.password,
        {
          memoryCost:
            19 * 1024,
          timeCost:
            2,
          parallelism:
            1,
          outputLen:
            32,
        },
      );

    const user =
      await database.user
        .upsert({
          where: {
            email:
              credential.email,
          },

          update: {
            passwordHash,
            firstName:
              credential.firstName,
            displayName:
              credential.firstName,
            status:
              UserStatus.ACTIVE,
          },

          create: {
            email:
              credential.email,
            passwordHash,
            firstName:
              credential.firstName,
            displayName:
              credential.firstName,
            status:
              UserStatus.ACTIVE,
          },
        });

    await ensureRole(
      user.id,
      credential.role,
    );

    if (
      credential.role ===
        UserRole.STUDENT ||
      credential.role ===
        UserRole.MENTOR ||
      credential.role ===
        UserRole.INSTITUTION_ADMIN
    ) {
      await ensureMembership(
        user.id,
        academy.id,
        credential.role,
      );
    }

    if (
      credential.role ===
      UserRole.STUDENT
    ) {
      const profile =
        await database
          .studentProfile
          .findFirst({
            where: {
              userId:
                user.id,
              organizationId:
                academy.id,
            },
          });

      if (!profile) {
        await database
          .studentProfile
          .create({
            data: {
              userId:
                user.id,
              organizationId:
                academy.id,
              examTarget:
                "NEET",
              targetYear:
                2027,
            },
          });
      }
    }
  }

  console.log(
    "\nDevelopment portal accounts",
  );

  console.log(
    "Stored locally at:",
    credentialPath,
  );

  for (
    const [
      portal,
      credential,
    ] of Object.entries(
      credentials,
    )
  ) {
    console.log(
      `\n${portal.toUpperCase()}`,
    );

    console.log(
      `Email: ${credential.email}`,
    );

    console.log(
      `Password: ${credential.password}`,
    );

    console.log(
      `Role: ${credential.role}`,
    );
  }

  console.log(
    "\nThese credentials are local development data and must never be committed.",
  );
}

run()
  .catch((error: unknown) => {
    console.error(
      "Development user seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
