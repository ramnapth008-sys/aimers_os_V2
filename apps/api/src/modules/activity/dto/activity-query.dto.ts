import {
  ActivityCategory,
} from "@aimers/database";

import {
  Type,
} from "class-transformer";

import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class ActivityQueryDto {
  @IsOptional()
  @IsISO8601({
    strict: true,
  })
  from?: string;

  @IsOptional()
  @IsISO8601({
    strict: true,
  })
  to?: string;

  @IsOptional()
  @IsEnum(
    ActivityCategory,
  )
  category?: ActivityCategory;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(500)
  limit: number = 100;
}
