import {
  ActivityCategory,
  ActivityEventType,
  ActivitySource,
  DataConfidenceLevel,
} from "@aimers/database";

import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateActivityEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  eventKey?: string;

  @IsOptional()
  @IsUUID()
  connectedDeviceId?: string;

  @IsOptional()
  @IsUUID()
  dataConnectorId?: string;

  @IsEnum(
    ActivityEventType,
  )
  type!: ActivityEventType;

  @IsEnum(
    ActivitySource,
  )
  source!: ActivitySource;

  @IsOptional()
  @IsEnum(
    ActivityCategory,
  )
  category?: ActivityCategory;

  @IsOptional()
  @IsEnum(
    DataConfidenceLevel,
  )
  confidence?: DataConfidenceLevel;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  appName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  domain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  externalReferenceId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsISO8601({
    strict: true,
  })
  startedAt!: string;

  @IsOptional()
  @IsISO8601({
    strict: true,
  })
  endedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(604800)
  durationSeconds?: number;

  @IsOptional()
  @IsBoolean()
  foreground?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<
    string,
    unknown
  >;
}
