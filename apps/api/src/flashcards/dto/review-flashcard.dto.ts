import {
  FlashcardReviewRating,
} from "@aimers/database";

import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class ReviewFlashcardDto {
  @IsEnum(FlashcardReviewRating)
  rating!: FlashcardReviewRating;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3600)
  responseSeconds: number = 0;
}
