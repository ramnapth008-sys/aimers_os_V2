import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class SubmitMockTestRunnerAttemptDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(172800)
  durationSeconds?:
    number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
