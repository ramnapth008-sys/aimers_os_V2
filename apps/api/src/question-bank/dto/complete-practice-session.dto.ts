import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class CompletePracticeSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSeconds?: number;
}
