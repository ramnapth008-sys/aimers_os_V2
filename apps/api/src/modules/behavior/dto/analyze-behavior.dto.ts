import {
  Type,
} from "class-transformer";

import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class AnalyzeBehaviorDto {
  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(31)
  days: number = 7;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone: string =
    "Asia/Kolkata";
}
