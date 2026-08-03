import {
  TopicMasteryLevel,
} from "@aimers/database";

import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class UpdateTopicMasteryDto {
  @IsOptional()
  @IsEnum(TopicMasteryLevel)
  level?: TopicMasteryLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  masteryScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidenceScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  attempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  correctAnswers?: number;

  @IsOptional()
  @IsDateString()
  nextReviewAt?: string;
}
