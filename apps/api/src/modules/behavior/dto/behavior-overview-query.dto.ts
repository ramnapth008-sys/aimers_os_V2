import {
  Type,
} from "class-transformer";

import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class BehaviorOverviewQueryDto {
  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(31)
  days: number = 7;
}
