import {
  DataConfidenceLevel,
} from "@aimers/database";

import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpsertLectureProgressDto {
  @IsString()
  @MaxLength(240)
  externalLectureId!: string;

  @IsOptional()
  @IsUUID()
  connectedDeviceId?: string;

  @IsOptional()
  @IsUUID()
  dataConnectorId?: string;

  @IsString()
  @MaxLength(160)
  platformName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  courseTitle?: string;

  @IsString()
  @MaxLength(300)
  lectureTitle!: string;

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
  @IsInt()
  @Min(1)
  @Max(172800)
  totalDurationSeconds?: number;

  @IsInt()
  @Min(0)
  @Max(172800)
  watchedSeconds!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(172800)
  focusedSeconds?: number;

  @IsInt()
  @Min(0)
  @Max(172800)
  playbackPositionSeconds!: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  collectorSessionId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(604800)
  elapsedSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  pauseCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  rewindCount?: number;

  @IsOptional()
  @IsIn(["PLAYING", "PAUSED", "STOPPED"])
  trackingState?: "PLAYING" | "PAUSED" | "STOPPED";

  @IsEnum(
    DataConfidenceLevel,
  )
  confidence!: DataConfidenceLevel;

  @IsISO8601({
    strict: true,
  })
  startedAt!: string;

  @IsOptional()
  @IsISO8601({
    strict: true,
  })
  lastProgressAt?: string;
}
