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
