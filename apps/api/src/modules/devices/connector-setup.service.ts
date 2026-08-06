import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  ConsentScope,
  DataConnectorStatus,
  DataConnectorType,
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

type ConnectorSetupState =
  | "CONNECTED"
  | "PAUSED"
  | "AUTHORIZATION_REQUIRED"
  | "AWAITING_EXTERNAL_APPROVAL"
  | "AUTHORIZATION_FAILED"
  | "INTEGRATION_UNAVAILABLE"
  | "REVOKED";

type ConnectorCategory =
  | "AIMERS_NATIVE"
  | "BROWSER"
  | "DEVICE"
  | "LEARNING_ACCOUNT"
  | "IMPORT";

interface ConnectorDescriptor {
  title: string;
  description: string;
  category:
    ConnectorCategory;
  actionLabel: string;
  implementationAvailable:
    boolean;
  authorizationMode:
    | "AIMERS_NATIVE"
    | "BROWSER_EXTENSION"
    | "OPERATING_SYSTEM"
    | "OAUTH"
    | "PROVIDER"
    | "FILE_IMPORT";
  unavailableReason:
    string | null;
  requiredScope:
    ConsentScope;
}

const CONNECTOR_DESCRIPTORS:
  Record<
    DataConnectorType,
    ConnectorDescriptor
  > = {
    [DataConnectorType.AIMERS_WEB]: {
      title:
        "AIMERS Web",
      description:
        "Internal AIMERS route, focus, idle and study-session activity.",
      category:
        "AIMERS_NATIVE",
      actionLabel:
        "Managed automatically",
      implementationAvailable:
        true,
      authorizationMode:
        "AIMERS_NATIVE",
      unavailableReason:
        null,
      requiredScope:
        ConsentScope
          .DIGITAL_ACTIVITY_MONITORING,
    },

    [DataConnectorType
      .AIMERS_LECTURE_PLAYER]: {
      title:
        "AIMERS Lecture Player",
      description:
        "Lecture evidence emitted directly by AIMERS-controlled playback.",
      category:
        "AIMERS_NATIVE",
      actionLabel:
        "Managed automatically",
      implementationAvailable:
        true,
      authorizationMode:
        "AIMERS_NATIVE",
      unavailableReason:
        null,
      requiredScope:
        ConsentScope
          .LECTURE_PROGRESS,
    },

    [DataConnectorType
      .BROWSER_EXTENSION]: {
      title:
        "Browser Activity Extension",
      description:
        "Approved external domains, page titles, URLs and permitted browser history.",
      category:
        "BROWSER",
      actionLabel:
        "Install extension",
      implementationAvailable:
        false,
      authorizationMode:
        "BROWSER_EXTENSION",
      unavailableReason:
        "The AIMERS browser extension package and store listing have not been implemented yet.",
      requiredScope:
        ConsentScope
          .BROWSER_ACTIVITY,
    },

    [DataConnectorType
      .ANDROID_USAGE_ACCESS]: {
      title:
        "Android Usage Access",
      description:
        "Permitted app names, categories and foreground duration from Android.",
      category:
        "DEVICE",
      actionLabel:
        "Open Android setup",
      implementationAvailable:
        false,
      authorizationMode:
        "OPERATING_SYSTEM",
      unavailableReason:
        "The AIMERS Android collector and Usage Access setup flow have not been implemented yet.",
      requiredScope:
        ConsentScope.APP_USAGE,
    },

    [DataConnectorType
      .APPLE_DEVICE_ACTIVITY]: {
      title:
        "Apple Device Activity",
      description:
        "Permitted device-activity signals from supported Apple platforms.",
      category:
        "DEVICE",
      actionLabel:
        "Open Apple setup",
      implementationAvailable:
        false,
      authorizationMode:
        "OPERATING_SYSTEM",
      unavailableReason:
        "The Apple Device Activity integration and guardian-safe entitlement flow have not been implemented yet.",
      requiredScope:
        ConsentScope.APP_USAGE,
    },

    [DataConnectorType
      .DESKTOP_AGENT]: {
      title:
        "Desktop Agent",
      description:
        "Permitted application and focus signals from a registered computer.",
      category:
        "DEVICE",
      actionLabel:
        "Install desktop agent",
      implementationAvailable:
        false,
      authorizationMode:
        "OPERATING_SYSTEM",
      unavailableReason:
        "The signed AIMERS desktop agent and operating-system permission flow have not been implemented yet.",
      requiredScope:
        ConsentScope.APP_USAGE,
    },

    [DataConnectorType.YOUTUBE]: {
      title:
        "YouTube Learning History",
      description:
        "Authorized learning-video history and progress from the user's YouTube account.",
      category:
        "LEARNING_ACCOUNT",
      actionLabel:
        "Connect YouTube",
      implementationAvailable:
        false,
      authorizationMode:
        "OAUTH",
      unavailableReason:
        "Google OAuth credentials, callback handling and the YouTube sync worker have not been implemented yet.",
      requiredScope:
        ConsentScope
          .LECTURE_PROGRESS,
    },

    [DataConnectorType
      .LEARNING_PLATFORM]: {
      title:
        "Learning Platform",
      description:
        "Authorized lecture and course progress from an official learning provider.",
      category:
        "LEARNING_ACCOUNT",
      actionLabel:
        "Choose provider",
      implementationAvailable:
        false,
      authorizationMode:
        "PROVIDER",
      unavailableReason:
        "No official learning-platform provider adapter has been configured yet.",
      requiredScope:
        ConsentScope
          .LECTURE_PROGRESS,
    },

    [DataConnectorType
      .MANUAL_IMPORT]: {
      title:
        "Past Activity Import",
      description:
        "A deliberate import of permitted historical activity from a supported file or source.",
      category:
        "IMPORT",
      actionLabel:
        "Start import",
      implementationAvailable:
        false,
      authorizationMode:
        "FILE_IMPORT",
      unavailableReason:
        "The validated file importer, preview and explicit import-confirmation workflow have not been implemented yet.",
      requiredScope:
        ConsentScope
          .BROWSER_HISTORY_IMPORT,
    },
  };

function jsonObject(
  value:
    Prisma.JsonValue | null,
): Prisma.JsonObject {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    return {};
  }

  return value as
    Prisma.JsonObject;
}

@Injectable()
export class ConnectorSetupService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async getWorkspace(
    userId:
      string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const [
      connectors,
      activeScopes,
    ] = await Promise.all([
      this.database
        .dataConnector
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          include: {
            connectedDevice: {
              select: {
                id:
                  true,
                name:
                  true,
                platform:
                  true,
                status:
                  true,
                lastSeenAt:
                  true,
              },
            },
          },

          orderBy: {
            updatedAt:
              "desc",
          },
        }),

      this.consentService
        .activeScopesForProfile(
          profile.id,
        ),
    ]);

    const latestByType =
      new Map<
        DataConnectorType,
        (typeof connectors)[number]
      >();

    for (
      const connector
      of connectors
    ) {
      if (
        !latestByType.has(
          connector.type,
        )
      ) {
        latestByType.set(
          connector.type,
          connector,
        );
      }
    }

    const items =
      [
        ...latestByType
          .values(),
      ].map(
        (connector) =>
          this.setupItem(
            connector,
            activeScopes,
          ),
      );

    const connected =
      items.filter(
        (item) =>
          item.setupState ===
          "CONNECTED",
      ).length;

    const paused =
      items.filter(
        (item) =>
          item.setupState ===
          "PAUSED",
      ).length;

    const unavailable =
      items.filter(
        (item) =>
          item.setupState ===
          "INTEGRATION_UNAVAILABLE",
      ).length;

    const awaitingApproval =
      items.filter(
        (item) =>
          item.setupState ===
          "AWAITING_EXTERNAL_APPROVAL",
      ).length;

    const failed =
      items.filter(
        (item) =>
          item.setupState ===
          "AUTHORIZATION_FAILED",
      ).length;

    const readyToAuthorize =
      items.filter(
        (item) =>
          item.setupState ===
          "AUTHORIZATION_REQUIRED",
      ).length;

    return {
      studentProfileId:
        profile.id,

      summary: {
        total:
          items.length,

        connected,
        paused,
        unavailable,
        awaitingApproval,
        failed,
        readyToAuthorize,

        completionPercentage:
          items.length === 0
            ? 0
            : Math.round(
                (
                  connected /
                  items.length
                ) *
                  100,
              ),

        setupComplete:
          items.length >
            0 &&
          connected ===
            items.length,
      },

      items,
    };
  }

  async start(
    userId:
      string,
    connectorId:
      string,
  ) {
    const connector =
      await this
        .ownedConnector(
          userId,
          connectorId,
        );

    const descriptor =
      CONNECTOR_DESCRIPTORS[
        connector.type
      ];

    await this.consentService
      .assertScopeActiveForProfile(
        connector
          .studentProfileId,
        descriptor
          .requiredScope,
      );

    if (
      connector.status ===
      DataConnectorStatus.ACTIVE
    ) {
      return {
        success:
          true,
        connectorId:
          connector.id,
        setupState:
          "CONNECTED" as const,
        authorizationUrl:
          null,
        message:
          "This connector is already active.",
      };
    }

    if (
      !descriptor
        .implementationAvailable
    ) {
      return {
        success:
          false,
        connectorId:
          connector.id,
        setupState:
          "INTEGRATION_UNAVAILABLE" as const,
        authorizationUrl:
          null,
        message:
          descriptor
            .unavailableReason,
      };
    }

    const metadata =
      jsonObject(
        connector.metadata,
      );

    await this.database
      .dataConnector
      .update({
        where: {
          id:
            connector.id,
        },

        data: {
          status:
            DataConnectorStatus.PENDING,

          errorMessage:
            null,

          metadata: {
            ...metadata,
            setupState:
              "AWAITING_EXTERNAL_APPROVAL",
            setupStartedAt:
              new Date()
                .toISOString(),
          } as
            Prisma.InputJsonValue,
        },
      });

    return {
      success:
        true,
      connectorId:
        connector.id,
      setupState:
        "AWAITING_EXTERNAL_APPROVAL" as const,
      authorizationUrl:
        null,
      message:
        "The authorization sequence has started.",
    };
  }

  retry(
    userId:
      string,
    connectorId:
      string,
  ) {
    return this.start(
      userId,
      connectorId,
    );
  }

  private setupItem(
    connector: {
      id: string;
      type:
        DataConnectorType;
      status:
        DataConnectorStatus;
      displayName:
        string;
      externalAccountId:
        string | null;
      permissions:
        Prisma.JsonValue | null;
      metadata:
        Prisma.JsonValue | null;
      lastSyncAt:
        Date | null;
      lastSuccessfulSyncAt:
        Date | null;
      errorMessage:
        string | null;
      createdAt:
        Date;
      updatedAt:
        Date;
      connectedDevice: {
        id: string;
        name: string;
        platform: string;
        status: string;
        lastSeenAt:
          Date | null;
      } | null;
    },
    activeScopes:
      Set<ConsentScope>,
  ) {
    const descriptor =
      CONNECTOR_DESCRIPTORS[
        connector.type
      ];

    const metadata =
      jsonObject(
        connector.metadata,
      );

    const storedSetupState =
      typeof metadata
        .setupState ===
        "string"
        ? metadata
            .setupState
        : null;

    const setupState =
      this.resolveState(
        connector.status,
        storedSetupState,
        descriptor,
      );

    const consentGranted =
      activeScopes.has(
        descriptor
          .requiredScope,
      );

    const action =
      this.actionFor(
        setupState,
        descriptor,
        consentGranted,
      );

    return {
      connectorId:
        connector.id,
      type:
        connector.type,
      displayName:
        connector
          .displayName,
      title:
        descriptor.title,
      description:
        descriptor
          .description,
      category:
        descriptor.category,
      status:
        connector.status,
      setupState,
      implementationAvailable:
        descriptor
          .implementationAvailable,
      authorizationMode:
        descriptor
          .authorizationMode,
      unavailableReason:
        descriptor
          .unavailableReason,
      requiredScope:
        descriptor
          .requiredScope,
      consentGranted,
      action,
      externalAccountId:
        connector
          .externalAccountId,
      connectedDevice:
        connector
          .connectedDevice,
      lastSyncAt:
        connector
          .lastSyncAt,
      lastSuccessfulSyncAt:
        connector
          .lastSuccessfulSyncAt,
      errorMessage:
        connector
          .errorMessage,
      createdAt:
        connector
          .createdAt,
      updatedAt:
        connector
          .updatedAt,
    };
  }

  private resolveState(
    status:
      DataConnectorStatus,
    storedSetupState:
      string | null,
    descriptor:
      ConnectorDescriptor,
  ): ConnectorSetupState {
    if (
      status ===
      DataConnectorStatus.ACTIVE
    ) {
      return "CONNECTED";
    }

    if (
      status ===
      DataConnectorStatus.PAUSED
    ) {
      return "PAUSED";
    }

    if (
      status ===
      DataConnectorStatus.REVOKED
    ) {
      return "REVOKED";
    }

    if (
      status ===
        DataConnectorStatus.ERROR ||
      storedSetupState ===
        "AUTHORIZATION_FAILED"
    ) {
      return "AUTHORIZATION_FAILED";
    }

    if (
      storedSetupState ===
      "AWAITING_EXTERNAL_APPROVAL"
    ) {
      return "AWAITING_EXTERNAL_APPROVAL";
    }

    if (
      !descriptor
        .implementationAvailable
    ) {
      return "INTEGRATION_UNAVAILABLE";
    }

    return "AUTHORIZATION_REQUIRED";
  }

  private actionFor(
    setupState:
      ConnectorSetupState,
    descriptor:
      ConnectorDescriptor,
    consentGranted:
      boolean,
  ) {
    if (
      setupState ===
        "CONNECTED" ||
      setupState ===
        "PAUSED"
    ) {
      return {
        kind:
          "MANAGE" as const,
        label:
          "Manage in Settings",
        enabled:
          true,
        reason:
          null,
        to:
          "/settings",
      };
    }

    if (
      !consentGranted
    ) {
      return {
        kind:
          "CONSENT_REQUIRED" as const,
        label:
          "Permission required",
        enabled:
          false,
        reason:
          "Grant the required permission in Settings before connecting this source.",
        to:
          "/settings",
      };
    }

    if (
      setupState ===
      "INTEGRATION_UNAVAILABLE"
    ) {
      return {
        kind:
          "UNAVAILABLE" as const,
        label:
          "Not available yet",
        enabled:
          false,
        reason:
          descriptor
            .unavailableReason,
        to:
          null,
      };
    }

    if (
      setupState ===
      "AWAITING_EXTERNAL_APPROVAL"
    ) {
      return {
        kind:
          "AWAITING_APPROVAL" as const,
        label:
          "Awaiting approval",
        enabled:
          false,
        reason:
          "Complete the mandatory browser, operating-system, OAuth or provider approval.",
        to:
          null,
      };
    }

    if (
      setupState ===
      "AUTHORIZATION_FAILED"
    ) {
      return {
        kind:
          "RETRY" as const,
        label:
          "Retry authorization",
        enabled:
          descriptor
            .implementationAvailable,
        reason:
          descriptor
            .implementationAvailable
            ? null
            : descriptor
                .unavailableReason,
        to:
          null,
      };
    }

    if (
      setupState ===
      "REVOKED"
    ) {
      return {
        kind:
          "REVOKED" as const,
        label:
          "Revoked",
        enabled:
          false,
        reason:
          "Register the connector again from Settings to create a new setup record.",
        to:
          "/settings",
      };
    }

    return {
      kind:
        "AUTHORIZE" as const,
      label:
        descriptor
          .actionLabel,
      enabled:
        descriptor
          .implementationAvailable,
      reason:
        descriptor
          .implementationAvailable
          ? null
          : descriptor
              .unavailableReason,
      to:
        null,
    };
  }

  private async ownedConnector(
    userId:
      string,
    connectorId:
      string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const connector =
      await this.database
        .dataConnector
        .findFirst({
          where: {
            id:
              connectorId,
            studentProfileId:
              profile.id,
          },
        });

    if (!connector) {
      throw new NotFoundException(
        "The connector setup record was not found.",
      );
    }

    return connector;
  }
}
