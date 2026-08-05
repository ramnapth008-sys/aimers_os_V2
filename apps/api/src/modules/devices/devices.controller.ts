import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import {
  UserRole,
} from "@aimers/database";

import type {
  AuthenticatedUser,
} from "../../auth/auth.types";

import {
  CurrentUser,
} from "../../auth/decorators/current-user.decorator";

import {
  Roles,
} from "../../auth/decorators/roles.decorator";

import {
  DevicesService,
} from "./devices.service";

import {
  DeviceHeartbeatDto,
} from "./dto/device-heartbeat.dto";

import {
  RegisterConnectorDto,
} from "./dto/register-connector.dto";

import {
  RegisterDeviceDto,
} from "./dto/register-device.dto";

import {
  UpdateConnectorStatusDto,
} from "./dto/update-connector-status.dto";

import {
  UpdateDeviceStatusDto,
} from "./dto/update-device-status.dto";

@Roles(UserRole.STUDENT)
@Controller("devices")
export class DevicesController {
  constructor(
    @Inject(DevicesService)
    private readonly devicesService:
      DevicesService,
  ) {}

  @Get()
  listDevices(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.devicesService
      .listDevices(
        user.userId,
      );
  }

  @Post()
  registerDevice(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      RegisterDeviceDto,
  ) {
    return this.devicesService
      .registerDevice(
        user.userId,
        dto,
      );
  }

  @Post(":deviceId/heartbeat")
  heartbeat(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("deviceId")
    deviceId: string,

    @Body()
    dto:
      DeviceHeartbeatDto,
  ) {
    return this.devicesService
      .heartbeat(
        user.userId,
        deviceId,
        dto,
      );
  }

  @Patch(":deviceId/status")
  updateDeviceStatus(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("deviceId")
    deviceId: string,

    @Body()
    dto:
      UpdateDeviceStatusDto,
  ) {
    return this.devicesService
      .updateDeviceStatus(
        user.userId,
        deviceId,
        dto,
      );
  }

  @Get("connectors/all")
  listConnectors(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.devicesService
      .listConnectors(
        user.userId,
      );
  }

  @Post("connectors")
  registerConnector(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto:
      RegisterConnectorDto,
  ) {
    return this.devicesService
      .registerConnector(
        user.userId,
        dto,
      );
  }

  @Patch(
    "connectors/:connectorId/status",
  )
  updateConnectorStatus(
    @CurrentUser()
    user: AuthenticatedUser,

    @Param("connectorId")
    connectorId: string,

    @Body()
    dto:
      UpdateConnectorStatusDto,
  ) {
    return this.devicesService
      .updateConnectorStatus(
        user.userId,
        connectorId,
        dto,
      );
  }
}
