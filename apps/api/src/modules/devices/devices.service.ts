import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  ConsentScope,
  DataConnectorStatus,
  DataConnectorType,
  DeviceStatus,
  type Prisma,
} from "@aimers/database";

import {
  DatabaseService,
} from "../../infrastructure/database/database.service";

import {
  ConsentService,
} from "../consent/consent.service";

import type {
  DeviceHeartbeatDto,
} from "./dto/device-heartbeat.dto";

import type {
  RegisterConnectorDto,
} from "./dto/register-connector.dto";

import type {
  RegisterDeviceDto,
} from "./dto/register-device.dto";

import type {
  UpdateConnectorStatusDto,
} from "./dto/update-connector-status.dto";

import type {
  UpdateDeviceStatusDto,
} from "./dto/update-device-status.dto";

const USER_MANAGED_DEVICE_STATUSES =
  new Set<DeviceStatus>([
    DeviceStatus.ACTIVE,
    DeviceStatus.PAUSED,
    DeviceStatus.REVOKED,
  ]);

const USER_MANAGED_CONNECTOR_STATUSES =
  new Set<DataConnectorStatus>([
    DataConnectorStatus.ACTIVE,
    DataConnectorStatus.PAUSED,
    DataConnectorStatus.REVOKED,
  ]);

@Injectable()
export class DevicesService {
  constructor(
    @Inject(DatabaseService)
    private readonly database:
      DatabaseService,

    @Inject(ConsentService)
    private readonly consentService:
      ConsentService,
  ) {}

  async listDevices(
    userId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const devices =
      await this.database
        .connectedDevice
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          include: {
            connectors: {
              orderBy: {
                createdAt:
                  "desc",
              },
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    return {
      studentProfileId:
        profile.id,
      devices,
    };
  }

  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.consentService
      .assertScopeActiveForProfile(
        profile.id,
        ConsentScope.DIGITAL_ACTIVITY_MONITORING,
      );

    const now =
      new Date();

    const device =
      await this.database
        .connectedDevice
        .upsert({
          where: {
            studentProfileId_externalDeviceId: {
              studentProfileId:
                profile.id,

              externalDeviceId:
                dto.externalDeviceId.trim(),
            },
          },

          create: {
            studentProfileId:
              profile.id,

            externalDeviceId:
              dto.externalDeviceId.trim(),

            name:
              dto.name.trim(),

            platform:
              dto.platform,

            status:
              DeviceStatus.ACTIVE,

            appVersion:
              dto.appVersion
                ?.trim(),

            osVersion:
              dto.osVersion
                ?.trim(),

            lastSeenAt:
              now,

            monitoringStartedAt:
              now,
          },

          update: {
            name:
              dto.name.trim(),

            platform:
              dto.platform,

            status:
              DeviceStatus.ACTIVE,

            appVersion:
              dto.appVersion
                ?.trim(),

            osVersion:
              dto.osVersion
                ?.trim(),

            lastSeenAt:
              now,

            monitoringStartedAt:
              now,

            monitoringPausedAt:
              null,
          },
        });

    return {
      success: true,
      device,
    };
  }

  async heartbeat(
    userId: string,
    deviceId: string,
    dto: DeviceHeartbeatDto,
  ) {
    const device =
      await this.getOwnedDevice(
        userId,
        deviceId,
      );

    if (
      device.status ===
        DeviceStatus.PAUSED ||
      device.status ===
        DeviceStatus.REVOKED
    ) {
      throw new ForbiddenException(
        "This device is paused or revoked.",
      );
    }

    const now =
      new Date();

    const lastSyncAt =
      dto.lastSyncAt
        ? new Date(
            dto.lastSyncAt,
          )
        : undefined;

    if (
      lastSyncAt &&
      lastSyncAt >
        new Date(
          now.getTime() +
            10 * 60 * 1000,
        )
    ) {
      throw new BadRequestException(
        "Device sync time cannot be more than ten minutes in the future.",
      );
    }

    const updated =
      await this.database
        .connectedDevice
        .update({
          where: {
            id:
              device.id,
          },

          data: {
            status:
              DeviceStatus.ACTIVE,

            lastSeenAt:
              now,

            lastSyncAt,

            appVersion:
              dto.appVersion
                ?.trim(),

            osVersion:
              dto.osVersion
                ?.trim(),

            monitoringStartedAt:
              device
                .monitoringStartedAt ??
              now,

            monitoringPausedAt:
              null,
          },
        });

    return {
      success: true,
      device:
        updated,
    };
  }

  async updateDeviceStatus(
    userId: string,
    deviceId: string,
    dto:
      UpdateDeviceStatusDto,
  ) {
    if (
      !USER_MANAGED_DEVICE_STATUSES
        .has(
          dto.status,
        )
    ) {
      throw new BadRequestException(
        "Device status can only be set to ACTIVE, PAUSED, or REVOKED.",
      );
    }

    const device =
      await this.getOwnedDevice(
        userId,
        deviceId,
      );

    if (
      device.status ===
        DeviceStatus.REVOKED &&
      dto.status !==
        DeviceStatus.REVOKED
    ) {
      throw new ForbiddenException(
        "A revoked device must be registered again before it can become active.",
      );
    }

    const now =
      new Date();

    const updated =
      await this.database
        .connectedDevice
        .update({
          where: {
            id:
              device.id,
          },

          data: {
            status:
              dto.status,

            monitoringPausedAt:
              dto.status ===
                DeviceStatus.PAUSED ||
              dto.status ===
                DeviceStatus.REVOKED
                ? now
                : null,

            monitoringStartedAt:
              dto.status ===
                DeviceStatus.ACTIVE
                ? device
                    .monitoringStartedAt ??
                  now
                : undefined,
          },
        });

    if (
      dto.status ===
      DeviceStatus.REVOKED
    ) {
      await this.database
        .dataConnector
        .updateMany({
          where: {
            studentProfileId:
              device.studentProfileId,

            connectedDeviceId:
              device.id,

            status: {
              not:
                DataConnectorStatus.REVOKED,
            },
          },

          data: {
            status:
              DataConnectorStatus.REVOKED,
          },
        });
    }

    return {
      success: true,
      device:
        updated,
    };
  }

  async listConnectors(
    userId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const connectors =
      await this.database
        .dataConnector
        .findMany({
          where: {
            studentProfileId:
              profile.id,
          },

          include: {
            connectedDevice: {
              select: {
                id: true,
                name: true,
                platform: true,
                status: true,
                lastSeenAt: true,
              },
            },
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    return {
      studentProfileId:
        profile.id,
      connectors,
    };
  }

  async registerConnector(
    userId: string,
    dto:
      RegisterConnectorDto,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    await this.consentService
      .assertScopeActiveForProfile(
        profile.id,
        this.connectorScope(
          dto.type,
        ),
      );

    if (
      dto.connectedDeviceId
    ) {
      const device =
        await this.getOwnedDevice(
          userId,
          dto.connectedDeviceId,
        );

      if (
        device.status ===
        DeviceStatus.REVOKED
      ) {
        throw new ForbiddenException(
          "A connector cannot be attached to a revoked device.",
        );
      }
    }

    const displayName =
      dto.displayName.trim();

    const externalAccountId =
      dto.externalAccountId
        ?.trim() ??
      null;

    const existing =
      await this.database
        .dataConnector
        .findFirst({
          where: {
            studentProfileId:
              profile.id,

            connectedDeviceId:
              dto.connectedDeviceId ??
              null,

            type:
              dto.type,

            displayName,

            externalAccountId,
          },

          orderBy: {
            createdAt:
              "desc",
          },
        });

    const connectorData = {
      connectedDeviceId:
        dto.connectedDeviceId,

      type:
        dto.type,

      displayName,

      externalAccountId,

      status:
        DataConnectorStatus.ACTIVE,

      permissions:
        dto.permissions
          ? dto.permissions as
            Prisma.InputJsonValue
          : undefined,

      errorMessage:
        null,
    };

    const connector =
      existing
        ? await this.database
            .dataConnector
            .update({
              where: {
                id:
                  existing.id,
              },

              data:
                connectorData,
            })
        : await this.database
            .dataConnector
            .create({
              data: {
                studentProfileId:
                  profile.id,

                ...connectorData,
              },
            });

    return {
      success: true,
      connector,
    };
  }

  async updateConnectorStatus(
    userId: string,
    connectorId: string,
    dto:
      UpdateConnectorStatusDto,
  ) {
    if (
      !USER_MANAGED_CONNECTOR_STATUSES
        .has(
          dto.status,
        )
    ) {
      throw new BadRequestException(
        "Connector status can only be set to ACTIVE, PAUSED, or REVOKED.",
      );
    }

    const connector =
      await this.getOwnedConnector(
        userId,
        connectorId,
      );

    if (
      connector.status ===
        DataConnectorStatus.REVOKED &&
      dto.status !==
        DataConnectorStatus.REVOKED
    ) {
      throw new ForbiddenException(
        "A revoked connector must be registered again before it can become active.",
      );
    }

    if (
      dto.status ===
        DataConnectorStatus.ACTIVE
    ) {
      await this.consentService
        .assertScopeActiveForProfile(
          connector.studentProfileId,
          this.connectorScope(
            connector.type,
          ),
        );
    }

    const updated =
      await this.database
        .dataConnector
        .update({
          where: {
            id:
              connector.id,
          },

          data: {
            status:
              dto.status,

            errorMessage:
              dto.status ===
                DataConnectorStatus.ACTIVE
                ? null
                : undefined,
          },
        });

    return {
      success: true,
      connector:
        updated,
    };
  }

  private async getOwnedDevice(
    userId: string,
    deviceId: string,
  ) {
    const profile =
      await this.consentService
        .resolveStudentProfile(
          userId,
        );

    const device =
      await this.database
        .connectedDevice
        .findFirst({
          where: {
            id:
              deviceId,

            studentProfileId:
              profile.id,
          },
        });

    if (!device) {
      throw new NotFoundException(
        "The connected device was not found.",
      );
    }

    return device;
  }

  private async getOwnedConnector(
    userId: string,
    connectorId: string,
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
        "The data connector was not found.",
      );
    }

    return connector;
  }

  private connectorScope(
    type:
      DataConnectorType,
  ): ConsentScope {
    switch (type) {
      case DataConnectorType.BROWSER_EXTENSION:
        return ConsentScope.BROWSER_ACTIVITY;

      case DataConnectorType.ANDROID_USAGE_ACCESS:
      case DataConnectorType.APPLE_DEVICE_ACTIVITY:
      case DataConnectorType.DESKTOP_AGENT:
        return ConsentScope.APP_USAGE;

      case DataConnectorType.YOUTUBE:
      case DataConnectorType.LEARNING_PLATFORM:
      case DataConnectorType.AIMERS_LECTURE_PLAYER:
        return ConsentScope.LECTURE_PROGRESS;

      case DataConnectorType.MANUAL_IMPORT:
        return ConsentScope.BROWSER_HISTORY_IMPORT;

      case DataConnectorType.AIMERS_WEB:
      default:
        return ConsentScope.DIGITAL_ACTIVITY_MONITORING;
    }
  }
}
