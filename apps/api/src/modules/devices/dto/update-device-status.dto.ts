import {
  DeviceStatus,
} from "@aimers/database";

import {
  IsEnum,
} from "class-validator";

export class UpdateDeviceStatusDto {
  @IsEnum(
    DeviceStatus,
  )
  status!: DeviceStatus;
}
