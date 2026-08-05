import {
  InterventionResponseType,
} from "@aimers/database";

import {
  Type,
} from "class-transformer";

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class RespondToInterventionDto {
  @IsEnum(
    InterventionResponseType,
  )
  responseType!:
    InterventionResponseType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ValidateIf(
    (value) =>
      value.responseType ===
      InterventionResponseType.SNOOZED,
  )
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(5)
  @Max(10080)
  snoozeMinutes?: number;
}
