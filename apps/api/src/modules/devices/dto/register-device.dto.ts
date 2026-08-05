import {
  DevicePlatform,
} from "@aimers/database";

import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(200)
  externalDeviceId!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsEnum(
    DevicePlatform,
  )
  platform!: DevicePlatform;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  osVersion?: string;
}
