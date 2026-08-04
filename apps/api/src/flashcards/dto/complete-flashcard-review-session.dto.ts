import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class CompleteFlashcardReviewSessionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSeconds?: number;
}
