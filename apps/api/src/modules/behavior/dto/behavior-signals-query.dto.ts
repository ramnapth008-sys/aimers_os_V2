import {
  Type,
} from "class-transformer";

import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class BehaviorSignalsQueryDto {
  @IsOptional()
  @Type(
    () =>
      Boolean,
  )
  @IsBoolean()
  includeResolved: boolean =
    false;

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
