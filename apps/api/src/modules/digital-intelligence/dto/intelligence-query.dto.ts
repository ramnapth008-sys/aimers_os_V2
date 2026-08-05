import {
  Type,
} from "class-transformer";

import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class IntelligenceQueryDto {
  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(90)
  days: number = 7;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
