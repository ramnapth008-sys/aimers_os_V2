import {
  QuestionDifficulty,
} from "@aimers/database";

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePracticeSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?:
    QuestionDifficulty;

  @IsOptional()
  @IsBoolean()
  bookmarkedOnly?: boolean;

  @IsInt()
  @Min(1)
  @Max(50)
  questionCount: number = 10;
}
