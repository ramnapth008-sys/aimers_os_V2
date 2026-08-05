import {
  InterventionStatus,
} from "@aimers/database";

import {
  Transform,
  Type,
} from "class-transformer";

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class ListInterventionsQueryDto {
  @IsOptional()
  @Transform(
    ({
      value,
    }) =>
      value === true ||
      value === "true",
  )
  @IsBoolean()
  includeClosed: boolean =
    false;

  @IsOptional()
  @IsEnum(
    InterventionStatus,
  )
  status?:
    InterventionStatus;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;
}
