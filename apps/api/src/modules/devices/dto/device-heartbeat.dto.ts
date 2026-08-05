import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class DeviceHeartbeatDto {
  @IsOptional()
  @IsISO8601({
    strict: true,
  })
  lastSyncAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  osVersion?: string;
}
