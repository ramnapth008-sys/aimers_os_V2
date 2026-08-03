import {
  Transform,
} from "class-transformer";

import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class StudentOnboardingDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim().toUpperCase()
      : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  examTarget!: string;

  @IsInt()
  @Min(2026)
  @Max(2100)
  targetYear!: number;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
