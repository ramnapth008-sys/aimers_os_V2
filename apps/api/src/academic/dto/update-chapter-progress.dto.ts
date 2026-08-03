import {
  LearningProgressState,
} from "@aimers/database";

import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class UpdateChapterProgressDto {
  @IsOptional()
  @IsEnum(LearningProgressState)
  state?: LearningProgressState;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  revisionCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  questionAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  correctAnswers?: number;
}
