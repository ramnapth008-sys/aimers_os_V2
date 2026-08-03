import {
  StudyTaskPriority,
  StudyTaskStatus,
  StudyTaskType,
} from "@aimers/database";

import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from "class-validator";

export class UpdateStudyTaskDto {
  @IsOptional()
  @IsUUID()
  studyPlanId?: string;

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
  @IsString()
  @Length(2, 250)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @IsOptional()
  @IsEnum(StudyTaskType)
  type?: StudyTaskType;

  @IsOptional()
  @IsEnum(StudyTaskStatus)
  status?: StudyTaskStatus;

  @IsOptional()
  @IsEnum(StudyTaskPriority)
  priority?: StudyTaskPriority;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  estimatedMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  actualMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercent?: number;
}
