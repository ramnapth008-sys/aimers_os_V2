import {
  DataConnectorType,
} from "@aimers/database";

import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class RegisterConnectorDto {
  @IsOptional()
  @IsUUID()
  connectedDeviceId?: string;

  @IsEnum(
    DataConnectorType,
  )
  type!: DataConnectorType;

  @IsString()
  @MaxLength(160)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  externalAccountId?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<
    string,
    unknown
  >;
}
